type ExportJob = {id: string; userId: string; kind: string; objectKey: string};
type ExportStore = {head(key: string): Promise<{customMetadata?: Record<string, string>} | null>; delete(key: string): Promise<void>};
type CleanupDb = {prepare(sql: string): {bind(...values: unknown[]): {first<T>(): Promise<T | null>}}};

export function validExportObject(job: ExportJob) {
  if (![job.id, job.userId, job.kind].every(value => /^[A-Za-z0-9_-]{1,100}$/.test(value))) return false;
  const extensions = job.kind === "account_data" ? ["json"] : job.kind === "pdf_pack" ? ["pdf", "zip"] : job.kind === "offline_pack" ? ["zip"] : [];
  return extensions.some(extension => job.objectKey === `private/exports/${job.userId}/${job.id}/hskkit-${job.kind}.${extension}`);
}

export async function cleanupExpiredExportObjects(jobs: ExportJob[], deps: {store: ExportStore; db: CleanupDb; clear(id: string, key: string): Promise<void>}) {
  if (jobs.length > 100) throw new Error("EXPORT_CLEANUP_BUDGET_EXCEEDED");
  let deleted = 0, missing = 0, failed = 0, skipped = 0;
  for (const job of jobs) {
    try {
      if (!validExportObject(job)) {skipped++; continue;}
      const fresh = await deps.db.prepare("SELECT state,object_key FROM commercial_export_jobs WHERE id=? AND user_id=?").bind(job.id, job.userId).first<{state: string; object_key: string | null}>();
      if (!fresh || !["expired", "revoked"].includes(fresh.state) || fresh.object_key !== job.objectKey) {skipped++; continue;}
      const object = await deps.store.head(job.objectKey);
      if (object) {
        if (object.customMetadata?.ownerUserId !== job.userId || object.customMetadata?.jobId !== job.id) {skipped++; continue;}
        await deps.store.delete(job.objectKey); deleted++;
      } else missing++;
      await deps.clear(job.id, job.objectKey);
    } catch {
      // Leave the object reference for a later run. One failure must not stop
      // all other expired deliveries. Never log private paths or user IDs.
      failed++;
    }
  }
  return {inspected: jobs.length, deleted, missing, failed, skipped};
}
