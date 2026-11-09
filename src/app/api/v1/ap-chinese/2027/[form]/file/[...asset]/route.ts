import { NextRequest } from "next/server";
import { serveApAsset } from "@/lib/ap-exams/server";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ form: string; asset: string[] }> };
export async function GET(req: NextRequest, { params }: Params) {
  const { form, asset } = await params;
  return serveApAsset(req, form, asset.join("/"));
}
export const HEAD = GET;
