import { blogError, readBlogJson, requireBlogAdmin, requireSameOrigin } from "@/lib/blog/access";
import { listBlogVersions, restoreBlogVersion } from "@/lib/blog/repository";
export const dynamic="force-dynamic"; type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,context:Context){try{await requireBlogAdmin();return Response.json({versions:await listBlogVersions((await context.params).id)},{headers:{"cache-control":"private, no-store"}});}catch(error){return blogError(error);}}
export async function POST(request:Request,context:Context){try{requireSameOrigin(request);const admin=await requireBlogAdmin();const body=await readBlogJson(request);const post=await restoreBlogVersion((await context.params).id,Number(body.versionNumber),Number(body.revision),admin.account.userId,admin.email);return Response.json({post},{headers:{"cache-control":"private, no-store"}});}catch(error){return blogError(error);}}
