import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleCatalogWordsRequest } from "@/lib/content/catalog-route";

export async function GET(request: Request) {
  return handleCatalogWordsRequest(request, getCloudflareContext().env.LEARNING_DB);
}
