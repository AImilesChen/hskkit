import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const routeStartedAt = performance.now();
  const handler = await import("./read");
  return handler.getLearningResponse(req, {
    routeStartedAt,
    moduleLoadedAt: performance.now(),
  });
}

export async function POST(req: NextRequest) {
  const handler = await import("./write");
  return handler.POST(req);
}
