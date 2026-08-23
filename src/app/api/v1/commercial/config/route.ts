import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { commercialPolicy, PDF_PACK_ACCESS_DAYS, PDF_PACK_CURRENCY, PDF_PACK_DOWNLOAD_LIMIT, PDF_PACK_PRICE_CENTS, PDF_PACK_REFUND_DAYS, PDF_PACK_SKU } from "@/lib/commercial/domain";

export async function GET() {
  const policy = commercialPolicy(getCloudflareContext().env);
  return NextResponse.json({ enabled: policy.enabled, mode: policy.enabled ? "test" : "disabled", stripeLive: "NO-GO", sku: PDF_PACK_SKU, amountCents: PDF_PACK_PRICE_CENTS, currency: PDF_PACK_CURRENCY, accessDays: PDF_PACK_ACCESS_DAYS, successfulDownloadLimit: PDF_PACK_DOWNLOAD_LIMIT, refundDays: PDF_PACK_REFUND_DAYS, refundCondition: "No successful download; manual review", levelsAvailable: [1,2,3,4,5,6,7], levelsUnavailable: [8,9] }, { headers: { "cache-control": "no-store" } });
}
