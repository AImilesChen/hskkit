export default function sitemap() {
  const baseUrl = "https://hskkit.com";
  const routes = [
    "",
    "/hsk-levels",
    "/hsk-level-test",
    "/hsk-1-vocabulary",
    "/hsk-1-practice-test",
    "/hsk-2-vocabulary",
    "/hsk-2-practice-test",
    "/hsk-3-vocabulary",
    "/new-hsk-3-0",
    "/privacy-policy",
    "/terms-of-service",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
