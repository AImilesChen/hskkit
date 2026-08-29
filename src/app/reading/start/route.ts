import { NextRequest, NextResponse } from "next/server";
import { readingSession, type ReadingLibrarySize } from "@/lib/learning/reading-library";

export function GET(request: NextRequest) {
  const level = Number.parseInt(request.nextUrl.searchParams.get("level") ?? "", 10);
  const size: ReadingLibrarySize = request.nextUrl.searchParams.get("size") === "20" ? 20 : 10;
  if (!Number.isInteger(level) || level < 1 || level > 9) return new NextResponse(null, { status: 307, headers: { location: "/reading" } });
  const seed = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const session = readingSession(level, size, seed);
  return new NextResponse(null, { status: 307, headers: { location: `/reading/session/${session.questions[0].slug}?size=${size}&seed=${seed}&position=0` } });
}
