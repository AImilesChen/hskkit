import { processCommercialExport } from "../src/lib/commercial/processor";
import { retryDelaySeconds } from "../src/lib/commercial/queue-retry";
import { clearExportObjectKey, expireReadyExports, getExportJob } from "../src/lib/commercial/storage";

interface CommercialExportMessage {
  jobId: string;
}

interface CommercialExportEnv extends CloudflareEnv {}

export default {
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
    const expired = await expireReadyExports(100, env);
    for (const job of expired) {
      if (!job.objectKey) continue;
      await env.COMMERCIAL_EXPORTS_R2.delete(job.objectKey);
      await clearExportObjectKey(job.id, job.objectKey, env);
    }
  },
};
