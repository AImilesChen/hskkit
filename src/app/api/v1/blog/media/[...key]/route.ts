import { safeMediaKey } from "@/lib/blog/domain";
import { getBlogMedia } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/access";
export const dynamic="force-dynamic"; type Context={params:Promise<{key:string[]}>};
export async function GET(_request:Request,context:Context){const key=safeMediaKey((await context.params).key.join("/"));if(!key)return new Response("Not found",{status:404});let allowAdmin=false;try{await requireBlogAdmin();allowAdmin=true;}catch{}const object=await getBlogMedia(key,allowAdmin);if(!object)return new Response("Not found",{status:404});const headers=new Headers();object.writeHttpMetadata(headers);headers.set("etag",object.httpEtag);headers.set("x-content-type-options","nosniff");headers.set("cache-control",allowAdmin?"private, no-store":"public, max-age=3600");return new Response(object.body,{headers});}
