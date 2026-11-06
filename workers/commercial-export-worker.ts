import { processCommercialExport } from "../src/lib/commercial/processor";
import { retryDelaySeconds } from "../src/lib/commercial/queue-retry";
import { clearExportObjectKey, commerceDb, expireReadyExports, getExportJob } from "../src/lib/commercial/storage";
import { legacyCutover, maintainLegacyCache, maintainPageCache } from "../src/lib/storage/cache-retention";
import { cleanupExpiredExportObjects } from "../src/lib/storage/export-cleanup";

interface CommercialExportMessage {
  jobId: string;
}

interface CommercialExportEnv extends CloudflareEnv {
  PAGE_CACHE_R2?: Parameters<typeof maintainPageCache>[0];
  STORAGE_CACHE_CLEANUP_MODE?: "dry-run" | "apply";
}

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
    if (env.PAGE_CACHE_R2) {
      try {
        const readActiveBuild = async () => {
          const response = await fetch("https://hskkit.com/BUILD_ID", {redirect: "error", signal: AbortSignal.timeout(15000), headers: {"Cache-Control": "no-cache"}});
          if (!response.ok) throw new Error("ACTIVE_BUILD_UNAVAILABLE");
          return (await response.text()).trim();
        };
        const summary = await maintainPageCache(env.PAGE_CACHE_R2, {
          mode: env.STORAGE_CACHE_CLEANUP_MODE === "apply" ? "apply" : "dry-run",
          readActiveBuild,
        });
        if (env.STORAGE_CACHE_CLEANUP_MODE === "apply") {
          const cutoverAt = await legacyCutover(env.PAGE_CACHE_R2, summary.registeredBuilds);
          const legacy = await maintainLegacyCache(env.COMMERCIAL_EXPORTS_R2, {cutoverAt,registeredBuilds:summary.registeredBuilds,activeBuild:summary.activeBuild,maxDeletes:500-summary.inspectedObjects,readActiveBuild});
          await env.PAGE_CACHE_R2.put("system/maintenance/legacy-latest.json", JSON.stringify({...legacy,checkedAt:new Date().toISOString(),cutoverAt}), {httpMetadata:{contentType:"application/json"}});
        }
        console.log("storage_cache_cleanup", JSON.stringify(summary));
      } catch {
        // No sensitive object names, bindings, exception messages, or credentials.
        console.error("storage_cache_cleanup_blocked");
        await env.PAGE_CACHE_R2.put("system/maintenance/cache-latest.json", JSON.stringify({schemaVersion:1,status:"blocked",checkedAt:new Date().toISOString()}), {httpMetadata:{contentType:"application/json"}}).catch(()=>undefined);
      }
    }
  },
};

export default commercialExportWorker;
