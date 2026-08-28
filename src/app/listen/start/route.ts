import { NextRequest, NextResponse } from "next/server";
import { listeningSession, type ListeningLibrarySize } from "@/lib/learning/listening-library";

export function GET(request: NextRequest) {
  const level = Number.parseInt(request.nextUrl.searchParams.get("level") ?? "", 10);
  const size: ListeningLibrarySize = request.nextUrl.searchParams.get("size") === "20" ? 20 : 10;
  if (!Number.isInteger(level) || level < 1 || level > 9) return new NextResponse(null, { status: 307, headers: { location: "/listen" } });
  const seed = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const session = listeningSession(level, size, seed);
  const first = session.questions[0];
  return new NextResponse(null, { status: 307, headers: { location: `/listen/advanced/${first.slug}?size=${size}&seed=${seed}&position=0` } });
}
