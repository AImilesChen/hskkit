import { NextRequest, NextResponse } from "next/server";
import {
  placementBody,
  placementFailure,
  runPlacementAction,
  shortPlacementValue,
} from "@/lib/placement/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown>;
  try {
    body = await placementBody(req);
  } catch (error) {
    return placementFailure(req, error instanceof Error ? error.message : "INVALID_JSON");
  }
  const { id } = await params;
  const sessionId = shortPlacementValue(id, 160);
  const idempotencyKey = shortPlacementValue(body.idempotencyKey, 100);
  if (!sessionId || !idempotencyKey) return NextResponse.json({ error: "INVALID_PLACEMENT_REQUEST" }, { status: 422 });
  if (body.finalize === true) return runPlacementAction(req, "submit", { sessionId, idempotencyKey });
  const questionId = shortPlacementValue(body.questionId, 120);
  const answer = shortPlacementValue(body.answer, 8);
  if (!questionId || !answer) return NextResponse.json({ error: "INVALID_PLACEMENT_ANSWER" }, { status: 422 });
  return runPlacementAction(req, "answer", { sessionId, questionId, answer, idempotencyKey });
}
