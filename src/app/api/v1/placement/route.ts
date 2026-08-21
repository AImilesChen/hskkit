import { NextRequest, NextResponse } from "next/server";
import {
  getPlacementResult,
  getPlacementSession,
  placementBody,
  placementFailure,
  runPlacementAction,
  shortPlacementValue,
  type PlacementAction,
} from "@/lib/placement/server";

export async function GET(req: NextRequest) {
  const resultId = shortPlacementValue(req.nextUrl.searchParams.get("resultId"), 160);
  return resultId ? getPlacementResult(req, resultId) : getPlacementSession(req);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await placementBody(req);
  } catch (error) {
    return placementFailure(req, error instanceof Error ? error.message : "INVALID_JSON");
  }
  const action = shortPlacementValue(body.action, 40) as PlacementAction | undefined;
  const payload = body.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : {};
  if (!action || !["start", "answer", "submit", "restart"].includes(action)) {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  }
  return runPlacementAction(req, action, payload);
}
