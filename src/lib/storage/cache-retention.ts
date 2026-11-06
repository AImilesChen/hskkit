// This module only manages the dedicated page-cache bucket. Commercial files
// are deliberately not part of its interface.
export const CACHE_PREFIX = "system/opennext-cache/";
export const RELEASE_PREFIX = "system/cache-releases/";
export const CACHE_BUCKET = "hskkit-page-cache";
export const GRACE_MS = 72 * 60 * 60 * 1000;
const BUILD = /^[A-Za-z0-9_-]{21}$/;
const UUID = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const RELEASE_KEY = new RegExp(`^${RELEASE_PREFIX}(\\d{13})-(${UUID})-([A-Za-z0-9_-]{21})\\.json$`);

export type CacheRelease = { build: string; version: string; deployedAt: number };
export type CacheObject = { key: string; uploaded: Date; size: number };
type CacheStore = {
  get(key: string): Promise<{json(): Promise<unknown>} | null>;
  list(options: {prefix: string; limit: number; cursor?: string}): Promise<{objects: CacheObject[]; truncated: boolean; cursor?: string}>;
  delete(keys: string[]): Promise<void>;
  put(key: string, body: string, options?: unknown): Promise<unknown>;
};

export function releaseKey(release: CacheRelease) {
  const key = `${RELEASE_PREFIX}${release.deployedAt}-${release.version}-${release.build}.json`;
  if (!RELEASE_KEY.test(key)) throw new Error("INVALID_CACHE_RELEASE");
  return key;
}

export function parseRelease(key: string): CacheRelease {
  const match = RELEASE_KEY.exec(key);
  if (!match) throw new Error("INVALID_CACHE_RELEASE");
  return { deployedAt: Number(match[1]), version: match[2], build: match[3] };
}

async function writeReleaseRecord(store: CacheStore, release: CacheRelease) {
  const key = releaseKey(release);
  const existing = await store.get(key);
  if (existing) {
    const saved = await existing.json() as {build?: string; version?: string; bucket?: string};
    if (saved.build !== release.build || saved.version !== release.version || saved.bucket !== CACHE_BUCKET) throw new Error("RELEASE_RECORD_CONFLICT");
    return;
  }
  await store.put(key, JSON.stringify({schemaVersion:1,worker:"hskkit",bucket:CACHE_BUCKET,prefix:CACHE_PREFIX,...release}), {onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
}

export async function registerBoundRelease(store: CacheStore, release: CacheRelease, readActiveBuild: () => Promise<string>, now = Date.now()) {
  releaseKey(release);
  if (release.deployedAt > now + 60_000 || await readActiveBuild() !== release.build) throw new Error("RELEASE_REGISTRY_OUT_OF_SYNC");
  await writeReleaseRecord(store,release);
}

export async function registerBoundHistory(store: CacheStore, history: CacheRelease[], current: CacheRelease, readActiveBuild: () => Promise<string>) {
  if (!Array.isArray(history) || history.length > 20) throw new Error("INVALID_RELEASE_HISTORY");
  for (const release of history) {releaseKey(release);if(release.deployedAt>current.deployedAt)throw new Error("INVALID_RELEASE_HISTORY");}
  if (await readActiveBuild() !== current.build) throw new Error("RELEASE_REGISTRY_OUT_OF_SYNC");
  for (const release of history) if (release.build !== current.build) await writeReleaseRecord(store,release);
}

export function retentionPlan(releases: CacheRelease[], activeBuild: string, now: number) {
  if (!BUILD.test(activeBuild) || !Number.isFinite(now) || releases.length === 0) throw new Error("MISSING_CURRENT_RELEASE");
  const byBuild = new Map<string, CacheRelease>();
  for (const record of releases) {
    releaseKey(record);
    if (record.deployedAt > now + 60_000) throw new Error("FUTURE_CACHE_RELEASE");
    if (!byBuild.has(record.build) || byBuild.get(record.build)!.deployedAt < record.deployedAt) byBuild.set(record.build, record);
  }
  const ordered = [...byBuild.values()].sort((a, b) => b.deployedAt - a.deployedAt);
  // An unrecorded deploy or a manual rollback freezes cleanup until its release
  // record is reconciled. Never infer the active version from object age.
  if (ordered[0].build !== activeBuild) throw new Error("RELEASE_REGISTRY_OUT_OF_SYNC");
  const protectedBuilds = new Set(ordered.slice(0, 3).map(record => record.build));
  const retired = ordered.filter((record, index) => index >= 3 && now - ordered[index - 1].deployedAt >= GRACE_MS);
  return {protectedBuilds, retired};
}

export function validateCachePage(objects: CacheObject[], build: string, now: number) {
  if (!BUILD.test(build)) throw new Error("INVALID_CACHE_BUILD");
  const prefix = CACHE_PREFIX + build + "/";
  const seen = new Set<string>();
  for (const object of objects) {
    if (!object.key.startsWith(prefix) || !/^[a-f0-9]{64}\.(cache|fetch)$/.test(object.key.slice(prefix.length)) || seen.has(object.key)) throw new Error("CACHE_SCOPE_MISMATCH");
    if (!Number.isSafeInteger(object.size) || object.size < 0 || !Number.isFinite(object.uploaded.getTime()) || object.uploaded.getTime() > now - GRACE_MS) throw new Error("CACHE_OBJECT_STILL_RECENT");
    seen.add(object.key);
  }
}

export async function maintainPageCache(store: CacheStore, options: {mode: "apply" | "dry-run"; readActiveBuild(): Promise<string>; now?: number; maxDeletes?: number}) {
  const now = options.now ?? Date.now();
  const budget = options.maxDeletes ?? 500;
  if (!Number.isSafeInteger(budget) || budget < 1 || budget > 500) throw new Error("INVALID_CLEANUP_BUDGET");
  const activeBuild = await options.readActiveBuild();
  const releases: CacheRelease[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; ; page++) {
    if (page >= 10) throw new Error("RELEASE_LIST_LIMIT");
    const result = await store.list({prefix: RELEASE_PREFIX, limit: 1000, ...(cursor ? {cursor} : {})});
    releases.push(...result.objects.map(object => parseRelease(object.key)));
    if (!result.truncated) break;
    if (!result.cursor || cursors.has(result.cursor)) throw new Error("RELEASE_CURSOR_REPEATED");
    cursors.add(result.cursor); cursor = result.cursor;
  }
  const plan = retentionPlan(releases, activeBuild, now);
  let inspected = 0, deleted = 0, deletedBytes = 0;
  // One page per retired build per run; never walk an unbounded cache or run
  // cleanup on a user's request. Later cron runs resume from remaining objects.
  for (const record of plan.retired.slice(0, 6)) {
    const remaining = budget - inspected;
    if (remaining <= 0) break;
    const result = await store.list({prefix: CACHE_PREFIX + record.build + "/", limit: remaining});
    if (result.objects.length > remaining) throw new Error("CACHE_LIST_EXCEEDED_BUDGET");
    validateCachePage(result.objects, record.build, now);
    inspected += result.objects.length;
    if (options.mode === "apply" && result.objects.length === 0 && !result.truncated) {
      if (await options.readActiveBuild() !== activeBuild) throw new Error("PRODUCTION_CHANGED_DURING_CLEANUP");
      // Removing an exhausted retired marker prevents empty old builds from
      // starving later candidates on subsequent bounded runs.
      await store.delete([releaseKey(record)]);
    }
    if (options.mode === "apply" && result.objects.length) {
      if (await options.readActiveBuild() !== activeBuild) throw new Error("PRODUCTION_CHANGED_DURING_CLEANUP");
      await store.delete(result.objects.map(object => object.key));
      deleted += result.objects.length;
      deletedBytes += result.objects.reduce((sum, object) => sum + object.size, 0);
    }
  }
  const summary = {schemaVersion: 1, mode: options.mode, checkedAt: new Date(now).toISOString(), activeBuild, registeredBuilds: new Set(releases.map(r=>r.build)).size, protectedBuilds: plan.protectedBuilds.size, retiredBuilds: plan.retired.length, inspectedObjects: inspected, deletedObjects: deleted, deletedBytes};
  await store.put("system/maintenance/cache-latest.json", JSON.stringify(summary), {httpMetadata: {contentType: "application/json"}});
  return summary;
}

export async function legacyCutover(store: CacheStore, registeredBuilds: number, now = Date.now()) {
  const key = "system/maintenance/legacy-cutover.json";
  const existing = await store.get(key);
  if (existing) {
    const record = await existing.json() as {schemaVersion?: number; bucket?: string; retiredAt?: number};
    if (record.schemaVersion !== 1 || record.bucket !== CACHE_BUCKET || !Number.isSafeInteger(record.retiredAt) || record.retiredAt! > now) throw new Error("INVALID_LEGACY_CUTOVER");
    return record.retiredAt!;
  }
  if (registeredBuilds < 3) return null;
  // This starts the grace period only after all three protected rollback slots
  // have moved to the dedicated bucket. A conditional put makes it immutable.
  await store.put(key, JSON.stringify({schemaVersion: 1, bucket: CACHE_BUCKET, retiredAt: now}), {onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
  return now;
}

export async function maintainLegacyCache(store: Pick<CacheStore, "list" | "delete">, options: {cutoverAt: number | null; registeredBuilds: number; activeBuild: string; now?: number; maxDeletes: number; readActiveBuild(): Promise<string>}) {
  const now = options.now ?? Date.now();
  if (options.cutoverAt === null || now - options.cutoverAt < GRACE_MS || options.registeredBuilds < 3 || options.maxDeletes === 0) return {deletedObjects:0,deletedBytes:0};
  if (!Number.isSafeInteger(options.cutoverAt) || options.cutoverAt < 0 || !BUILD.test(options.activeBuild) || !Number.isSafeInteger(options.maxDeletes) || options.maxDeletes < 1 || options.maxDeletes > 500) throw new Error("INVALID_LEGACY_CLEANUP");
  const page = await store.list({prefix:CACHE_PREFIX,limit:options.maxDeletes});
  if (page.objects.length > options.maxDeletes) throw new Error("CACHE_LIST_EXCEEDED_BUDGET");
  const candidates: CacheObject[] = [];
  for (const object of page.objects) {
    const match = /^system\/opennext-cache\/([A-Za-z0-9_-]{21})\/[a-f0-9]{64}\.(cache|fetch)$/.exec(object.key);
    if (!match || match[1] === options.activeBuild || !Number.isSafeInteger(object.size) || object.size < 0 || !Number.isFinite(object.uploaded.getTime())) throw new Error("LEGACY_CACHE_SCOPE_MISMATCH");
    if (object.uploaded.getTime() <= now - GRACE_MS) candidates.push(object);
  }
  if (candidates.length) {
    if (await options.readActiveBuild() !== options.activeBuild) throw new Error("PRODUCTION_CHANGED_DURING_CLEANUP");
    await store.delete(candidates.map(object=>object.key));
  }
  return {deletedObjects:candidates.length,deletedBytes:candidates.reduce((sum,object)=>sum+object.size,0)};
}
