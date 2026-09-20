import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately narrow: these pages are force-static, public, user-neutral shells.
// Private/account/learning/admin/API routes must continue through the Worker.
export const PUBLIC_HTML_ROUTES = Object.freeze([
  "/",
  "/dictionary",
  "/levels",
  "/pricing",
  "/reading",
]);

function routeFile(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}

export async function publishPublicHtmlAssets({
  nextAppDir = path.resolve(".next/server/app"),
  assetsDir = path.resolve(".open-next/assets"),
} = {}) {
  const copied = [];
  for (const route of PUBLIC_HTML_ROUTES) {
    const relativeFile = routeFile(route);
    const source = path.join(nextAppDir, relativeFile);
    const destination = path.join(assetsDir, relativeFile);
    try {
      const sourceStat = await stat(source);
      if (!sourceStat.isFile() || sourceStat.size === 0) throw new Error("empty artifact");
    } catch (cause) {
      throw new Error(`Missing required public HTML artifact for ${route}: ${source}`, { cause });
    }
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    copied.push(route);
  }
  return { routes: copied, filesCopied: copied.length };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await publishPublicHtmlAssets();
  console.log(`Published ${result.filesCopied} public HTML assets: ${result.routes.join(", ")}`);
}
