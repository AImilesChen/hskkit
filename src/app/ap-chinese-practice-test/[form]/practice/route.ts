import { NextRequest } from "next/server";
import { isApForm } from "@/lib/ap-exams/catalog";
import { apAccessPage, serveApAsset } from "@/lib/ap-exams/server";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ form: string }> };
export async function GET(req: NextRequest, { params }: Params) {
  const { form } = await params;
  if (!isApForm(form)) return new Response(null, { status: 404 });
  const response = await serveApAsset(req, form, "index.html");
  return response.ok ? response : apAccessPage(form, response.status, req.method === "HEAD");
}
export const HEAD = GET;
