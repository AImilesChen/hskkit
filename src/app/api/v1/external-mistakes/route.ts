import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import type { ImageMistakeOutput } from "@/lib/ai/domain";
import { readBoundedJsonObject } from "@/lib/ai/request";

const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
const validId = (value: unknown) => typeof value === "string" && /^[a-f0-9-]{36}$/.test(value);

async function context() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return null;
  return { db: (await getCloudflareContext({ async: true })).env.LEARNING_DB, ownerId: `user:${identity.account.userId}` };
}

export async function GET() {
  const access = await context();
  if (!access) return reply({ error: "AI_ACCOUNT_REQUIRED" }, 401);
  const rows = await access.db.prepare("SELECT id,question,answer,explanation,learner_mistake AS learnerMistake,next_step AS nextStep,confidence,created_at AS createdAt FROM external_image_mistakes WHERE owner_id=? ORDER BY created_at DESC LIMIT 30").bind(access.ownerId).all();
  return reply({ mistakes: rows.results });
}

export async function POST(req: NextRequest) {
  const access = await context();
  if (!access) return reply({ error: "AI_ACCOUNT_REQUIRED" }, 401);
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return reply({ error: "INVALID_ORIGIN" }, 403);
  let body: unknown;
  try { body = await readBoundedJsonObject(req, 512); } catch { return reply({ error: "INVALID_JSON" }, 400); }
  const operationId = typeof body === "object" && body !== null && "operationId" in body ? body.operationId : undefined;
  if (!validId(operationId)) return reply({ error: "INVALID_OPERATION_ID" }, 422);
  const operation = await access.db.prepare("SELECT response_json FROM ai_operations WHERE id=? AND owner_id=? AND feature='image_mistake' AND status='succeeded' AND NOT EXISTS(SELECT 1 FROM image_mistake_corrections WHERE operation_id=ai_operations.id AND status='reserved')").bind(operationId, access.ownerId).first<{ response_json: string | null }>();
  if (!operation?.response_json) return reply({ error: "ANALYSIS_NOT_FOUND" }, 404);
  let output: ImageMistakeOutput;
  try { output = JSON.parse(operation.response_json); } catch { return reply({ error: "ANALYSIS_UNAVAILABLE" }, 409); }
  if (output.kind !== "image_mistake") return reply({ error: "ANALYSIS_UNAVAILABLE" }, 409);
  const now = new Date().toISOString();
  await access.db.prepare("INSERT OR IGNORE INTO external_image_mistakes(id,owner_id,operation_id,question,answer,explanation,learner_mistake,next_step,confidence,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), access.ownerId, operationId, output.question, output.answer, output.explanation, output.learnerMistake, output.nextStep, output.confidence, now, now).run();
  return reply({ saved: true }, 201);
}

export async function DELETE(req: NextRequest) {
  const access = await context();
  if (!access) return reply({ error: "AI_ACCOUNT_REQUIRED" }, 401);
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return reply({ error: "INVALID_ORIGIN" }, 403);
  const id = new URL(req.url).searchParams.get("id");
  if (!validId(id)) return reply({ error: "INVALID_MISTAKE_ID" }, 422);
  await access.db.prepare("DELETE FROM external_image_mistakes WHERE id=? AND owner_id=?").bind(id, access.ownerId).run();
  return reply({ deleted: true });
}
