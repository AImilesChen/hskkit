// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
	// Persist public static/ISR output across Worker isolates. Private routes
	// remain force-dynamic/no-store and never enter this cache.
	incrementalCache: r2IncrementalCache,
});
