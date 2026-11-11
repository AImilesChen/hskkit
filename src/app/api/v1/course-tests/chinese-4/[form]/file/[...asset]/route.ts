import { NextRequest } from "next/server";
import { serveCourseAsset } from "@/lib/course-exams/server";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ form: string; asset: string[] }> };
export async function GET(req: NextRequest, { params }: Params) {
  const { form, asset } = await params;
  return serveCourseAsset(req, form, asset.join("/"), 4);
}
export const HEAD = GET;
