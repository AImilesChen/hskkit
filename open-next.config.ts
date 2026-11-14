// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { publicWordCache } from "./src/lib/runtime/public-word-cache";

export default defineCloudflareConfig({
	// Return cached public SSG/ISR responses before importing the full Next server.
	// Dynamic account/API routes and the media middleware retain their own checks.
	enableCacheInterception: true,
	routePreloadingBehavior: "none",
	incrementalCache: publicWordCache(staticAssetsIncrementalCache, withRegionalCache(r2IncrementalCache, {
		mode: "short-lived",
		bypassTagCacheOnCacheHit: false,
		shouldLazilyUpdateOnCacheHit: false,
	})),
});
