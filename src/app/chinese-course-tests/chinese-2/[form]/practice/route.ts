import { NextRequest } from "next/server";
import { isCourseForm } from "@/lib/course-exams/catalog";
import { courseAccessPage, serveCourseAsset } from "@/lib/course-exams/server";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ form: string }> };
export async function GET(req: NextRequest, { params }: Params) {
  const { form } = await params;
  if (!isCourseForm(form)) return new Response(null, { status: 404 });
  const response = await serveCourseAsset(req, form, "index.html", 2);
  return response.ok ? response : courseAccessPage(form, response.status, req.method === "HEAD", 2);
}
export const HEAD = GET;
