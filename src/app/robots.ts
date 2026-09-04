export const dynamic = "force-static";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/account/"] },
    sitemap: "https://hskkit.com/sitemap.xml",
  };
}
