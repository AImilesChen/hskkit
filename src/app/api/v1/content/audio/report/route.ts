import { NextResponse } from "next/server";
import { db } from "@/lib/learning/storage";
import { publishedAudioAssets } from "@/lib/content/published-content";

const issueTypes = new Set(["playback", "wrong_audio", "pronunciation", "license", "other"]);

export async function POST(request: Request) {
  let input: { audioAssetId?: unknown; issueType?: unknown; details?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const audioAssetId = typeof input.audioAssetId === "string" ? input.audioAssetId.trim() : "";
  const issueType = typeof input.issueType === "string" ? input.issueType.trim() : "";
  const details = typeof input.details === "string" ? input.details.trim() : "";
  if (!audioAssetId || !publishedAudioAssets.some((asset) => asset.id === audioAssetId)) {
    return NextResponse.json({ error: "AUDIO_ASSET_NOT_PUBLISHED" }, { status: 404 });
  }
  if (!issueTypes.has(issueType) || details.length > 500) {
    return NextResponse.json({ error: "INVALID_REPORT" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await (await db()).prepare(
    "INSERT INTO audio_issue_reports(id,audio_asset_id,issue_type,details,status,created_at) VALUES(?,?,?,?,'open',?)",
  ).bind(id, audioAssetId, issueType, details, createdAt).run();

  return NextResponse.json({ reportId: id, status: "open" }, { status: 202 });
}
