import { NextRequest, NextResponse } from "next/server";
import {
  getPlacementSession,
  placementBody,
  placementFailure,
  runPlacementAction,
  shortPlacementValue,
} from "@/lib/placement/server";

export async function GET(req: NextRequest) {
  return getPlacementSession(req);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await placementBody(req);
  } catch (error) {
    return placementFailure(req, error instanceof Error ? error.message : "INVALID_JSON");
  }
  const idempotencyKey = shortPlacementValue(body.idempotencyKey, 100);
  if (!idempotencyKey) return NextResponse.json({ error: "INVALID_PLACEMENT_REQUEST" }, { status: 422 });
  return runPlacementAction(req, "start", { idempotencyKey });
}
