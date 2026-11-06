import { processCommercialExport } from "../src/lib/commercial/processor";
import { retryDelaySeconds } from "../src/lib/commercial/queue-retry";
import { clearExportObjectKey, commerceDb, expireReadyExports, getExportJob } from "../src/lib/commercial/storage";
import { legacyCutover, maintainLegacyCache, maintainPageCache, registerBoundRelease, registerBoundHistory } from "../src/lib/storage/cache-retention";
import { cleanupExpiredExportObjects } from "../src/lib/storage/export-cleanup";

interface CommercialExportMessage {
  jobId: string;
}

interface CommercialExportEnv extends CloudflareEnv {
  PAGE_CACHE_R2?: Parameters<typeof maintainPageCache>[0];
  STORAGE_CACHE_CLEANUP_MODE?: "dry-run" | "apply";
  STORAGE_SITE_BUILD?: string;
  STORAGE_SITE_VERSION?: string;
  STORAGE_SITE_DEPLOYED_AT?: string;
  STORAGE_SITE_HISTORY?: string;
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
      let phase = "register-release";
      try {
        const readActiveBuild = async () => {
          const response = await fetch("https://hskkit.com/BUILD_ID", {redirect: "error", signal: AbortSignal.timeout(15000), headers: {"Cache-Control": "no-cache", "User-Agent": "HSKKit-Release-Verification/1.0"}});
          if (!response.ok) throw new Error(`ACTIVE_BUILD_HTTP_${response.status}`);
          const build = (await response.text()).trim();
          if (!/^[A-Za-z0-9_-]{21}$/.test(build)) throw new Error("ACTIVE_BUILD_INVALID_RESPONSE");
          return build;
        };
        const release = {build:env.STORAGE_SITE_BUILD??"",version:env.STORAGE_SITE_VERSION??"",deployedAt:Number(env.STORAGE_SITE_DEPLOYED_AT)};
        await registerBoundRelease(env.PAGE_CACHE_R2, release, readActiveBuild);
        phase = "register-history";
        await registerBoundHistory(env.PAGE_CACHE_R2, JSON.parse(env.STORAGE_SITE_HISTORY??"[]"), release, readActiveBuild);
        phase = "retain-current-bucket";
        const summary = await maintainPageCache(env.PAGE_CACHE_R2, {
          mode: env.STORAGE_CACHE_CLEANUP_MODE === "apply" ? "apply" : "dry-run",
          readActiveBuild,
        });
        if (env.STORAGE_CACHE_CLEANUP_MODE === "apply") {
          phase = "retain-legacy-bucket";
          const cutoverAt = await legacyCutover(env.PAGE_CACHE_R2, summary.registeredBuilds);
          const legacy = await maintainLegacyCache(env.COMMERCIAL_EXPORTS_R2, {cutoverAt,registeredBuilds:summary.registeredBuilds,activeBuild:summary.activeBuild,maxDeletes:500-summary.inspectedObjects,readActiveBuild});
          await env.PAGE_CACHE_R2.put("system/maintenance/legacy-latest.json", JSON.stringify({...legacy,checkedAt:new Date().toISOString(),cutoverAt}), {httpMetadata:{contentType:"application/json"}});
        }
        console.log("storage_cache_cleanup", JSON.stringify(summary));
      } catch (error) {
        // No sensitive object names, bindings, exception messages, or credentials.
        const message = error instanceof Error ? error.message : "";
        const reason = /^[A-Z][A-Z_0-9]{1,80}$/.test(message) ? message : "REMOTE_OPERATION_FAILED";
        console.error("storage_cache_cleanup_blocked");
        await env.PAGE_CACHE_R2.put("system/maintenance/cache-latest.json", JSON.stringify({schemaVersion:1,status:"blocked",phase,reason,checkedAt:new Date().toISOString()}), {httpMetadata:{contentType:"application/json"}}).catch(()=>undefined);
      }
    }
  },
};

export default commercialExportWorker;
