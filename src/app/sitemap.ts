export default function sitemap() {
  const baseUrl = "https://hskkit.com";
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date() },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date() },
  ];
}
