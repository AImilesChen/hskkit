export type HskStandard = "hsk2" | "hsk3";
export type QaStatus = "pending" | "approved" | "rejected";
export type AuthorizationStatus = "pending" | "authorized" | "revoked";
export type ReleaseStatus = "draft" | "published" | "withdrawn";
export type ContentKind = "word" | "sentence" | "grammar" | "reading" | "question";
export type ReleaseAction = "publish" | "withdraw" | "rollback";

export interface SourceMetadata {
  name: string;
  url: string;
}

export interface AuthorizationMetadata {
  status: AuthorizationStatus;
  license: string;
  evidenceUrl: string;
}

export interface AudioUsageRights {
  streaming: boolean;
  caching: boolean;
  offlineRedistribution: boolean;
}

export interface LevelDefinition {
  standard: HskStandard;
  level: number;
  title: string;
}

export interface ContentAsset {
  id: string;
  logicalId: string;
  standard: HskStandard;
  level: number;
  kind: ContentKind;
  version: number;
  payload: Record<string, unknown>;
  source: SourceMetadata;
  authorization: AuthorizationMetadata;
  qaStatus: QaStatus;
}

export interface AudioAsset {
  id: string;
  logicalId: string;
  contentAssetId: string;
  standard: HskStandard;
  level: number;
  version: number;
  storageKey: string;
  checksumSha256: string;
  locale: string;
  voice: string;
  speed: number;
  usageRights: AudioUsageRights;
  source: SourceMetadata;
  authorization: AuthorizationMetadata;
  qaStatus: QaStatus;
}

export interface ContentRelease {
  id: string;
  standard: HskStandard;
  version: number;
  status: ReleaseStatus;
  contentAssetIds: string[];
  audioAssetIds: string[];
  publishedAt?: string;
  withdrawnAt?: string;
}

export interface ReleaseEvent {
  action: ReleaseAction;
  releaseId: string;
  standard: HskStandard;
  at: string;
  previousActiveReleaseId?: string;
}

export interface ContentRepository {
  schemaVersion: "1.0.0";
  levels: LevelDefinition[];
  contentAssets: ContentAsset[];
  audioAssets: AudioAsset[];
  releases: ContentRelease[];
  releaseEvents: ReleaseEvent[];
  activeReleaseByStandard: Partial<Record<HskStandard, string>>;
}

export interface CatalogQuery {
  standard?: HskStandard;
  level: number;
}

export interface CatalogResult {
  standard: HskStandard;
  releaseId: string;
  releaseVersion: number;
  availability: "ready" | "gap";
  level: LevelDefinition;
  contentAssets: ContentAsset[];
  audioAssets: AudioAsset[];
}

const VALID_LEVELS: Record<HskStandard, number[]> = {
  hsk2: [1, 2, 3, 4, 5, 6],
  hsk3: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};
const STANDARDS = new Set<HskStandard>(["hsk2", "hsk3"]);
const QA_STATUSES = new Set<QaStatus>(["pending", "approved", "rejected"]);
const AUTHORIZATION_STATUSES = new Set<AuthorizationStatus>(["pending", "authorized", "revoked"]);
const RELEASE_STATUSES = new Set<ReleaseStatus>(["draft", "published", "withdrawn"]);
const CONTENT_KINDS = new Set<ContentKind>(["word", "sentence", "grammar", "reading", "question"]);
const RELEASE_ACTIONS = new Set<ReleaseAction>(["publish", "withdraw", "rollback"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/;

function cloneRepository(repository: ContentRepository): ContentRepository {
  return structuredClone(repository);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function assertId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new Error(`${label} must be a non-empty stable ID`);
  }
}

function assertStandard(value: unknown, label: string): asserts value is HskStandard {
  if (typeof value !== "string" || !STANDARDS.has(value as HskStandard)) {
    throw new Error(`${label} must be hsk2 or hsk3`);
  }
}

function assertIsoTimestamp(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}

function assertUniqueIds(items: unknown[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (!isRecord(item)) throw new Error(`${label} must be an object`);
    assertId(item.id, `${label} ID`);
    if (seen.has(item.id)) throw new Error(`${label} IDs must be unique: ${item.id}`);
    seen.add(item.id);
  }
}

function assertLevel(standard: HskStandard, level: number, label: string): void {
  if (!Number.isInteger(level) || !VALID_LEVELS[standard].includes(level)) {
    throw new Error(`${label} has invalid ${standard.toUpperCase()} level ${level}`);
  }
}

function assertSourceAndAuthorization(
  id: string,
  source: SourceMetadata,
  authorization: AuthorizationMetadata,
): void {
  if (!isRecord(source) || typeof source.name !== "string" || !source.name.trim() ||
      typeof source.url !== "string" || !/^https:\/\//.test(source.url)) {
    throw new Error(`${id} requires a named HTTPS source`);
  }
  if (!isRecord(authorization) || typeof authorization.status !== "string" ||
      !AUTHORIZATION_STATUSES.has(authorization.status as AuthorizationStatus)) {
    throw new Error(`${id} has invalid authorization status`);
  }
  if (typeof authorization.license !== "string" || !authorization.license.trim()) {
    throw new Error(`${id} requires a license declaration`);
  }
  if (typeof authorization.evidenceUrl !== "string" || !/^https:\/\//.test(authorization.evidenceUrl)) {
    throw new Error(`${id} requires an HTTPS authorization evidence URL`);
  }
  if (authorization.status === "authorized" && authorization.license.trim().toLowerCase() === "unknown") {
    throw new Error(`${id} cannot be authorized with an unknown license`);
  }
}

function assertQaStatus(value: unknown, id: string): asserts value is QaStatus {
  if (typeof value !== "string" || !QA_STATUSES.has(value as QaStatus)) {
    throw new Error(`${id} has invalid QA status`);
  }
}

function assertVersion(value: unknown, label: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${label} requires a positive integer version`);
  }
}

function assertUniqueVersionLineage(
  assets: Array<{ id: string; logicalId: string; standard: HskStandard; level: number; version: number }>,
  label: string,
): void {
  const versions = new Set<string>();
  const identities = new Map<string, number>();
  const versionsByLineage = new Map<string, number[]>();
  for (const asset of assets) {
    assertId(asset.logicalId, `${label} ${asset.id} logicalId`);
    const lineage = `${asset.standard}:${asset.logicalId}`;
    const versionKey = `${lineage}:${asset.version}`;
    if (versions.has(versionKey)) throw new Error(`Duplicate ${label} lineage version: ${versionKey}`);
    versions.add(versionKey);
    const existingLevel = identities.get(lineage);
    if (existingLevel !== undefined && existingLevel !== asset.level) {
      throw new Error(`${label} ${asset.id} changes level within lineage ${asset.logicalId}`);
    }
    identities.set(lineage, asset.level);
    versionsByLineage.set(lineage, [...(versionsByLineage.get(lineage) ?? []), asset.version]);
  }
  for (const [lineage, lineageVersions] of versionsByLineage) {
    const sorted = [...lineageVersions].sort((left, right) => left - right);
    const expected = Array.from({ length: sorted.length }, (_, index) => index + 1);
    if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
      throw new Error(`${label} ${lineage} must have continuous versions starting at 1`);
    }
  }
}

function assertPayload(kind: ContentKind, payload: Record<string, unknown>, id: string): void {
  const contracts: Record<ContentKind, { required: string[]; optional: string[] }> = {
    word: { required: ["hanzi"], optional: ["pinyin", "meaning", "traditional", "partOfSpeech"] },
    sentence: { required: ["text"], optional: ["pinyin", "translation"] },
    grammar: { required: ["title"], optional: ["explanation", "pattern"] },
    reading: { required: ["title", "text"], optional: ["translation"] },
    question: { required: ["prompt"], optional: ["answer", "options"] },
  };
  const contract = contracts[kind];
  const allowed = new Set([...contract.required, ...contract.optional]);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) throw new Error(`ContentAsset ${id} payload contains unsupported field ${key}`);
  }
  for (const key of contract.required) {
    if (typeof payload[key] !== "string" || !(payload[key] as string).trim()) {
      throw new Error(`ContentAsset ${id} payload requires string field ${key}`);
    }
  }
  for (const key of contract.optional) {
    const value = payload[key];
    if (value === undefined) continue;
    if (kind === "question" && key === "options") {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        throw new Error(`ContentAsset ${id} payload options must be strings`);
      }
    } else if (typeof value !== "string") {
      throw new Error(`ContentAsset ${id} payload field ${key} must be a string`);
    }
  }
}

function assertReleaseStatus(release: ContentRelease): void {
  if (typeof release.status !== "string" || !RELEASE_STATUSES.has(release.status as ReleaseStatus)) {
    throw new Error(`Release ${release.id} has invalid status`);
  }
  if (release.status === "draft") {
    if (release.publishedAt !== undefined || release.withdrawnAt !== undefined) {
      throw new Error(`Draft release ${release.id} cannot have publication timestamps`);
    }
    return;
  }
  assertIsoTimestamp(release.publishedAt, `Release ${release.id} publishedAt`);
  if (release.status === "published" && release.withdrawnAt !== undefined) {
    throw new Error(`Published release ${release.id} cannot have withdrawnAt`);
  }
  if (release.status === "withdrawn") {
    assertIsoTimestamp(release.withdrawnAt, `Release ${release.id} withdrawnAt`);
  }
}

function assertPublishable(repository: ContentRepository, release: ContentRelease): void {
  const contentById = new Map(repository.contentAssets.map((asset) => [asset.id, asset]));
  const audioById = new Map(repository.audioAssets.map((asset) => [asset.id, asset]));
  for (const id of release.contentAssetIds) {
    const asset = contentById.get(id)!;
    if (asset.authorization.status !== "authorized") throw new Error(`ContentAsset ${id} failed authorization gate`);
    if (asset.qaStatus !== "approved") throw new Error(`ContentAsset ${id} failed QA gate`);
  }
  for (const id of release.audioAssetIds) {
    const asset = audioById.get(id)!;
    if (asset.authorization.status !== "authorized") throw new Error(`AudioAsset ${id} failed authorization gate`);
    if (asset.qaStatus !== "approved") throw new Error(`AudioAsset ${id} failed QA gate`);
    if (!asset.usageRights.streaming) throw new Error(`AudioAsset ${id} requires an explicit streaming right`);
  }
}

function validateRepositoryInternal(repository: ContentRepository, enforceActivePublishability: boolean): void {
  if (!isRecord(repository)) throw new Error("Content repository must be an object");
  if (repository.schemaVersion !== "1.0.0") throw new Error(`Unsupported content repository schema: ${repository.schemaVersion}`);
  assertArray(repository.levels, "levels");
  assertArray(repository.contentAssets, "contentAssets");
  assertArray(repository.audioAssets, "audioAssets");
  assertArray(repository.releases, "releases");
  assertArray(repository.releaseEvents, "releaseEvents");
  if (!isRecord(repository.activeReleaseByStandard)) throw new Error("activeReleaseByStandard must be an object");

  const hsk3Levels = repository.levels
    .filter((entry) => isRecord(entry) && entry.standard === "hsk3")
    .map((entry) => entry.level)
    .sort((left, right) => Number(left) - Number(right));
  if (JSON.stringify(hsk3Levels) !== JSON.stringify(VALID_LEVELS.hsk3)) {
    throw new Error("HSK 3.0 levels must be exactly 1 through 9");
  }

  const levelKeys = new Set<string>();
  for (const level of repository.levels) {
    if (!isRecord(level)) throw new Error("Level definition must be an object");
    assertStandard(level.standard, "Level standard");
    assertLevel(level.standard, level.level as number, "Level definition");
    const key = `${level.standard}:${level.level}`;
    if (levelKeys.has(key)) throw new Error(`Duplicate level definition: ${key}`);
    if (typeof level.title !== "string" || !level.title.trim()) throw new Error(`Level definition ${key} requires a title`);
    levelKeys.add(key);
  }

  assertUniqueIds(repository.contentAssets, "ContentAsset");
  assertUniqueIds(repository.audioAssets, "AudioAsset");
  assertUniqueIds(repository.releases, "Release");
  const contentById = new Map(repository.contentAssets.map((asset) => [asset.id, asset]));
  const audioById = new Map(repository.audioAssets.map((asset) => [asset.id, asset]));

  for (const asset of repository.contentAssets) {
    if (!isRecord(asset)) throw new Error("ContentAsset must be an object");
    assertStandard(asset.standard, `ContentAsset ${asset.id} standard`);
    assertLevel(asset.standard, asset.level as number, `ContentAsset ${asset.id}`);
    assertVersion(asset.version, `ContentAsset ${asset.id}`);
    if (typeof asset.kind !== "string" || !CONTENT_KINDS.has(asset.kind as ContentKind)) {
      throw new Error(`ContentAsset ${asset.id} has invalid kind`);
    }
    if (!isRecord(asset.payload)) throw new Error(`ContentAsset ${asset.id} payload must be an object`);
    assertPayload(asset.kind, asset.payload, asset.id);
    assertSourceAndAuthorization(asset.id, asset.source as SourceMetadata, asset.authorization as AuthorizationMetadata);
    assertQaStatus(asset.qaStatus, `ContentAsset ${asset.id}`);
  }
  assertUniqueVersionLineage(repository.contentAssets, "ContentAsset");

  for (const asset of repository.audioAssets) {
    if (!isRecord(asset)) throw new Error("AudioAsset must be an object");
    assertStandard(asset.standard, `AudioAsset ${asset.id} standard`);
    assertLevel(asset.standard, asset.level as number, `AudioAsset ${asset.id}`);
    assertVersion(asset.version, `AudioAsset ${asset.id}`);
    if (typeof asset.storageKey !== "string" || !asset.storageKey.trim() ||
        typeof asset.checksumSha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.checksumSha256)) {
      throw new Error(`AudioAsset ${asset.id} requires a storage key and SHA-256 checksum`);
    }
    if (typeof asset.locale !== "string" || !asset.locale.trim() || typeof asset.voice !== "string" || !asset.voice.trim()) {
      throw new Error(`AudioAsset ${asset.id} requires locale and voice metadata`);
    }
    if (typeof asset.speed !== "number" || !Number.isFinite(asset.speed) || asset.speed <= 0 || asset.speed > 2) {
      throw new Error(`AudioAsset ${asset.id} has invalid speed`);
    }
    if (!isRecord(asset.usageRights) || typeof asset.usageRights.streaming !== "boolean" ||
        typeof asset.usageRights.caching !== "boolean" || typeof asset.usageRights.offlineRedistribution !== "boolean") {
      throw new Error(`AudioAsset ${asset.id} requires explicit usage rights`);
    }
    assertSourceAndAuthorization(asset.id, asset.source as SourceMetadata, asset.authorization as AuthorizationMetadata);
    assertQaStatus(asset.qaStatus, `AudioAsset ${asset.id}`);
    assertId(asset.contentAssetId, `AudioAsset ${asset.id} contentAssetId`);
    const content = contentById.get(asset.contentAssetId);
    if (!content) throw new Error(`AudioAsset ${asset.id} references missing ContentAsset ${asset.contentAssetId}`);
    if (content.standard !== asset.standard || content.level !== asset.level) {
      throw new Error(`AudioAsset ${asset.id} must match its ContentAsset standard and level`);
    }
  }
  assertUniqueVersionLineage(repository.audioAssets, "AudioAsset");

  const releaseVersionKeys = new Set<string>();
  const releaseVersionsByStandard = new Map<HskStandard, number[]>();
  for (const release of repository.releases) {
    if (!isRecord(release)) throw new Error("Release must be an object");
    assertStandard(release.standard, `Release ${release.id} standard`);
    assertVersion(release.version, `Release ${release.id}`);
    assertArray(release.contentAssetIds, `Release ${release.id} contentAssetIds`);
    assertArray(release.audioAssetIds, `Release ${release.id} audioAssetIds`);
    assertReleaseStatus(release);
    const versionKey = `${release.standard}:${release.version}`;
    if (releaseVersionKeys.has(versionKey)) throw new Error(`Duplicate release version: ${versionKey}`);
    releaseVersionKeys.add(versionKey);
    releaseVersionsByStandard.set(release.standard, [...(releaseVersionsByStandard.get(release.standard) ?? []), release.version]);
    if (new Set(release.contentAssetIds).size !== release.contentAssetIds.length ||
        new Set(release.audioAssetIds).size !== release.audioAssetIds.length) {
      throw new Error(`Release ${release.id} contains duplicate asset references`);
    }
    const contentLogicalIds = new Set<string>();
    for (const id of release.contentAssetIds) {
      assertId(id, `Release ${release.id} ContentAsset reference`);
      const asset = contentById.get(id);
      if (!asset) throw new Error(`Release ${release.id} references missing ContentAsset ${id}`);
      if (asset.standard !== release.standard) throw new Error(`Release ${release.id} mixes ${asset.standard.toUpperCase()} content into ${release.standard.toUpperCase()}`);
      if (contentLogicalIds.has(asset.logicalId)) throw new Error(`Release ${release.id} contains multiple versions of ContentAsset logicalId ${asset.logicalId}`);
      contentLogicalIds.add(asset.logicalId);
    }
    const audioLogicalIds = new Set<string>();
    for (const id of release.audioAssetIds) {
      assertId(id, `Release ${release.id} AudioAsset reference`);
      const asset = audioById.get(id);
      if (!asset) throw new Error(`Release ${release.id} references missing AudioAsset ${id}`);
      if (asset.standard !== release.standard) throw new Error(`Release ${release.id} mixes ${asset.standard.toUpperCase()} audio into ${release.standard.toUpperCase()}`);
      if (!release.contentAssetIds.includes(asset.contentAssetId)) throw new Error(`Release ${release.id} audio ${id} references content outside the release`);
      if (audioLogicalIds.has(asset.logicalId)) throw new Error(`Release ${release.id} contains multiple versions of AudioAsset logicalId ${asset.logicalId}`);
      audioLogicalIds.add(asset.logicalId);
    }
  }

  for (const [standard, versions] of releaseVersionsByStandard) {
    const sorted = [...versions].sort((left, right) => left - right);
    const expected = Array.from({ length: sorted.length }, (_, index) => index + 1);
    if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
      throw new Error(`${standard.toUpperCase()} releases must have continuous versions starting at 1`);
    }
  }

  for (const key of Object.keys(repository.activeReleaseByStandard)) {
    if (!STANDARDS.has(key as HskStandard)) throw new Error(`Unknown active release standard: ${key}`);
  }

  const replayedActive: Partial<Record<HskStandard, string>> = {};
  let previousEventTime = -Infinity;
  for (const event of repository.releaseEvents) {
    if (!isRecord(event)) throw new Error("Release event must be an object");
    if (typeof event.action !== "string" || !RELEASE_ACTIONS.has(event.action as ReleaseAction)) throw new Error("Release event has invalid action");
    assertId(event.releaseId, "Release event releaseId");
    assertStandard(event.standard, "Release event standard");
    assertIsoTimestamp(event.at, `Release event ${event.releaseId} timestamp`);
    const eventTime = Date.parse(event.at);
    if (eventTime < previousEventTime) throw new Error("Release events must be chronological");
    previousEventTime = eventTime;

    const release = repository.releases.find((candidate) => candidate.id === event.releaseId);
    if (!release || release.standard !== event.standard) throw new Error(`Release event references unknown or mismatched release ${event.releaseId}`);
    if (event.previousActiveReleaseId !== undefined) {
      assertId(event.previousActiveReleaseId, "Release event previousActiveReleaseId");
      const previousRelease = repository.releases.find((candidate) => candidate.id === event.previousActiveReleaseId);
      if (!previousRelease || previousRelease.standard !== event.standard) {
        throw new Error(`Release event previous active release ${event.previousActiveReleaseId} is unknown or mismatched`);
      }
    }

    const currentActive = replayedActive[event.standard];
    if (event.action === "publish" || event.action === "rollback") {
      if (event.previousActiveReleaseId !== currentActive) {
        throw new Error(`Release event previous active release does not match replay state for ${event.releaseId}`);
      }
      if (event.action === "publish" && (release.status === "draft" || release.publishedAt !== event.at)) {
        throw new Error(`Publish event does not match release ${event.releaseId}`);
      }
      if (event.action === "rollback" && release.status === "draft") {
        throw new Error(`Rollback event target ${event.releaseId} was never published`);
      }
      replayedActive[event.standard] = event.releaseId;
    } else {
      if (release.status !== "withdrawn" || release.withdrawnAt !== event.at) {
        throw new Error(`Withdraw event does not match release ${event.releaseId}`);
      }
      if (currentActive === event.releaseId) delete replayedActive[event.standard];
    }
  }

  for (const release of repository.releases) {
    if (release.status === "draft") continue;
    const publishEvents = repository.releaseEvents.filter((event) => event.action === "publish" && event.releaseId === release.id && event.at === release.publishedAt);
    if (publishEvents.length !== 1) throw new Error(`Release ${release.id} must have exactly one matching publish event`);
    if (release.status === "withdrawn") {
      const withdrawEvents = repository.releaseEvents.filter((event) => event.action === "withdraw" && event.releaseId === release.id && event.at === release.withdrawnAt);
      if (withdrawEvents.length !== 1) throw new Error(`Release ${release.id} must have exactly one matching withdraw event`);
    }
  }

  for (const standard of ["hsk2", "hsk3"] as const) {
    if (replayedActive[standard] !== repository.activeReleaseByStandard[standard]) {
      throw new Error(`Release events do not replay to the active ${standard.toUpperCase()} pointer`);
    }
    const activeId = repository.activeReleaseByStandard[standard];
    if (!activeId) continue;
    assertId(activeId, `Active ${standard} release ID`);
    const release = repository.releases.find((candidate) => candidate.id === activeId);
    if (!release || release.standard !== standard || release.status !== "published") {
      throw new Error(`Active ${standard.toUpperCase()} release must reference a published release of the same standard`);
    }
    if (enforceActivePublishability) assertPublishable(repository, release);
  }
}

export function validateRepository(repository: ContentRepository): void {
  validateRepositoryInternal(repository, true);
}

export function queryCatalog(repository: ContentRepository, query: CatalogQuery): CatalogResult {
  validateRepository(repository);
  const standard = query.standard ?? "hsk3";
  assertStandard(standard, "Catalog standard");
  assertLevel(standard, query.level, "Catalog query");
  const level = repository.levels.find((candidate) => candidate.standard === standard && candidate.level === query.level);
  if (!level) throw new Error(`No ${standard.toUpperCase()} Level ${query.level} definition`);
  const releaseId = repository.activeReleaseByStandard[standard];
  if (!releaseId) throw new Error(`No active ${standard === "hsk3" ? "HSK 3.0" : "HSK 2.0"} release`);
  const release = repository.releases.find((candidate) => candidate.id === releaseId)!;
  const contentIds = new Set(release.contentAssetIds);
  const audioIds = new Set(release.audioAssetIds);
  const contentAssets = repository.contentAssets.filter((asset) => contentIds.has(asset.id) && asset.standard === standard && asset.level === query.level);
  const audioAssets = repository.audioAssets.filter((asset) => audioIds.has(asset.id) && asset.standard === standard && asset.level === query.level);
  return {
    standard,
    releaseId,
    releaseVersion: release.version,
    availability: contentAssets.length > 0 || audioAssets.length > 0 ? "ready" : "gap",
    level,
    contentAssets,
    audioAssets,
  };
}

export function publishRelease(repository: ContentRepository, releaseId: string, publishedAt: string): ContentRepository {
  validateRepositoryInternal(repository, false);
  assertIsoTimestamp(publishedAt, "publishedAt");
  const next = cloneRepository(repository);
  const release = next.releases.find((candidate) => candidate.id === releaseId);
  if (!release) throw new Error(`Unknown release: ${releaseId}`);
  if (release.status !== "draft") throw new Error(`Release ${releaseId} is not a draft`);
  assertPublishable(next, release);
  const previousActiveReleaseId = next.activeReleaseByStandard[release.standard];
  release.status = "published";
  release.publishedAt = publishedAt;
  delete release.withdrawnAt;
  next.activeReleaseByStandard[release.standard] = release.id;
  next.releaseEvents.push({ action: "publish", releaseId, standard: release.standard, at: publishedAt, ...(previousActiveReleaseId ? { previousActiveReleaseId } : {}) });
  validateRepository(next);
  return next;
}

export function withdrawRelease(repository: ContentRepository, releaseId: string, withdrawnAt: string): ContentRepository {
  validateRepositoryInternal(repository, false);
  assertIsoTimestamp(withdrawnAt, "withdrawnAt");
  const next = cloneRepository(repository);
  const release = next.releases.find((candidate) => candidate.id === releaseId);
  if (!release) throw new Error(`Unknown release: ${releaseId}`);
  if (release.status !== "published") throw new Error(`Release ${releaseId} is not published`);
  release.status = "withdrawn";
  release.withdrawnAt = withdrawnAt;
  if (next.activeReleaseByStandard[release.standard] === release.id) delete next.activeReleaseByStandard[release.standard];
  next.releaseEvents.push({ action: "withdraw", releaseId, standard: release.standard, at: withdrawnAt });
  validateRepository(next);
  return next;
}

export function rollbackRelease(repository: ContentRepository, releaseId: string, rolledBackAt: string): ContentRepository {
  validateRepositoryInternal(repository, false);
  assertIsoTimestamp(rolledBackAt, "rolledBackAt");
  const next = cloneRepository(repository);
  const release = next.releases.find((candidate) => candidate.id === releaseId);
  if (!release) throw new Error(`Unknown release: ${releaseId}`);
  if (release.status !== "published") throw new Error(`Rollback target ${releaseId} must be published`);
  const previousActiveReleaseId = next.activeReleaseByStandard[release.standard];
  next.activeReleaseByStandard[release.standard] = release.id;
  next.releaseEvents.push({ action: "rollback", releaseId, standard: release.standard, at: rolledBackAt, ...(previousActiveReleaseId ? { previousActiveReleaseId } : {}) });
  validateRepository(next);
  return next;
}
