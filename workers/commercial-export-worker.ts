import { processCommercialExport } from "../src/lib/commercial/processor";
import { retryDelaySeconds } from "../src/lib/commercial/queue-retry";
import { clearExportObjectKey, commerceDb, expireReadyExports, getExportJob } from "../src/lib/commercial/storage";
import { cleanupExpiredExportObjects } from "../src/lib/storage/export-cleanup";

interface CommercialExportMessage {
  jobId: string;
}

type CommercialExportEnv = CloudflareEnv;

const commercialExportWorker = {
  async queue(batch: { messages: Array<{ body: CommercialExportMessage; ack(): void; retry(options?:{delaySeconds?:number}):void }> }, env: CommercialExportEnv) {
    for (const message of batch.messages) {
      try {
        const result=await processCommercialExport(message.body, env);
        if(result.skipped){const job=await getExportJob(message.body.jobId,undefined,env);if(job?.state==="generating"){message.retry({delaySeconds:retryDelaySeconds(job.lease_expires_at)});continue;}}
        message.ack();
      } catch (error) {
        console.error("commercial_export_failed", message.body.jobId, error);
        message.ack();
      }
    }
  },
  async scheduled(_controller: unknown, env: CommercialExportEnv) {
    try {
      const expired = await expireReadyExports(100, env);
      const exports = await cleanupExpiredExportObjects(expired, {
        store: env.COMMERCIAL_EXPORTS_R2,
        db: commerceDb(env),
        clear: (id, key) => clearExportObjectKey(id, key, env),
      });
      console.log("storage_export_cleanup", JSON.stringify(exports));
    } catch {
      console.error("storage_export_cleanup_blocked");
    }
  },
};

export default commercialExportWorker;
