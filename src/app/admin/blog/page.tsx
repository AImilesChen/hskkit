import type { Metadata } from "next";
import { forbidden, unauthorized } from "next/navigation";
import BlogAdminClient from "./blog-admin-client";
import { BlogHttpError, requireBlogAdmin } from "@/lib/blog/access";
import { listAdminBlogPosts } from "@/lib/blog/repository";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Blog studio | HSKKit",robots:{index:false,follow:false,nocache:true}};
export default async function BlogAdminPage(){try{const admin=await requireBlogAdmin();return <BlogAdminClient initialPosts={await listAdminBlogPosts()} adminEmail={admin.email}/>;}catch(error){if(error instanceof BlogHttpError&&error.status===401)unauthorized();if(error instanceof BlogHttpError&&error.status===403)forbidden();throw error;}}
