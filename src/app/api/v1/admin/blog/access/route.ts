import { blogError, requireBlogAdmin } from "@/lib/blog/access";
export const dynamic = "force-dynamic";
export async function GET(){try{const admin=await requireBlogAdmin();return Response.json({allowed:true,email:admin.email},{headers:{"cache-control":"private, no-store"}});}catch(error){return blogError(error);}}
