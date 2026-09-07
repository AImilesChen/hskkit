#!/usr/bin/env node
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const requested = process.argv[2] ?? "--dry-run";
const action = requested === "--apply" ? "backfill" : requested === "--dry-run" ? "verify" : requested.replace(/^--/, "");
const root = resolve(import.meta.dirname, "..");
const work = resolve(root, ".placement-migration");
const sourceDump = resolve(work, "learning_states.sql");
const sourceDbPath = resolve(work, "learning_states.sqlite");
const manifestPath = resolve(work, "manifest.json");
const wrangler = resolve(root, "node_modules/.bin/wrangler");
const q = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const run = (args, options = {}) => execFileSync(wrangler, args, { cwd: root, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit", maxBuffer: 64 * 1024 * 1024 });
const expiry = (session) => session.expiresAt ?? new Date(Date.parse(session.createdAt) + 7 * 24 * 60 * 60_000).toISOString();
const canonical = (value) => JSON.stringify(value);
const sessionUpdatedAt = (session) => [session.createdAt, session.submittedAt, ...(session.answers ?? []).map((answer) => answer.answeredAt)].filter(Boolean).sort().at(-1);
const sleep = (milliseconds) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

function parseResults(output) {
  const parsed = JSON.parse(output);
  return parsed[0]?.results ?? parsed.result?.[0]?.results ?? [];
}

function sourceRemoteQuery(sql) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return parseResults(run(["d1", "execute", "hskkit-learning", "--remote", "--command", sql, "--json"], { capture: true }));
    } catch (error) {
      lastError = error;
      if (attempt < 4) sleep((attempt + 1) * 2_000);
    }
  }
  throw lastError;
}

function exportSourceByPage() {
  const db = new DatabaseSync(sourceDbPath);
  db.exec("CREATE TABLE learning_states(owner_id TEXT PRIMARY KEY,state_json TEXT NOT NULL,revision INTEGER NOT NULL)");
  const insert = db.prepare("INSERT INTO learning_states(owner_id,state_json,revision) VALUES(?,?,?)");
  let cursor = "";
  for (;;) {
    const rows = sourceRemoteQuery(`SELECT owner_id,state_json,revision FROM learning_states WHERE owner_id>${q(cursor)} ORDER BY owner_id LIMIT 5`);
    if (rows.length === 0) break;
    db.exec("BEGIN");
    try {
      for (const row of rows) insert.run(row.owner_id, row.state_json, Number(row.revision));
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    cursor = rows.at(-1).owner_id;
  }
  return db;
}

function exportSource() {
  mkdirSync(work, { recursive: true });
  rmSync(sourceDump, { force: true });
  rmSync(sourceDbPath, { force: true });
  try {
    run(["d1", "export", "hskkit-learning", "--remote", "--table", "learning_states", "--output", sourceDump, "--skip-confirmation"]);
  } catch (error) {
    console.warn("Bulk D1 export failed; falling back to bounded five-owner keyset pages.");
    return exportSourceByPage();
  }
  const db = new DatabaseSync(sourceDbPath);
  db.exec(readFileSync(sourceDump, "utf8"));
  return db;
}

function placementOwners(db) {
  return db.prepare("SELECT owner_id,state_json,revision FROM learning_states ORDER BY owner_id").all()
    .map((row) => ({ ...row, state: JSON.parse(row.state_json) }))
    .filter((row) => (row.state.placementSessions?.length ?? 0) > 0 || (row.state.placementResults?.length ?? 0) > 0);
}

function statementsFor(row, targetRevision) {
  const now = new Date().toISOString();
  const assertionId = `migration:${row.owner_id}`;
  const statements = [
    `INSERT INTO placement_owner_revisions(owner_id,revision,migrated_at,updated_at) SELECT ${q(row.owner_id)},${Number(row.revision)},${q(now)},${q(now)} WHERE NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=${q(row.owner_id)}) ON CONFLICT(owner_id) DO UPDATE SET revision=excluded.revision,migrated_at=COALESCE(placement_owner_revisions.migrated_at,excluded.migrated_at),updated_at=excluded.updated_at WHERE placement_owner_revisions.revision=${targetRevision == null ? -1 : Number(targetRevision)} AND placement_owner_revisions.revision<excluded.revision AND NOT EXISTS(SELECT 1 FROM placement_owner_fences WHERE owner_id=excluded.owner_id);`,
    `INSERT INTO placement_cas_assertions(id,ok) VALUES(${q(assertionId)},CASE changes() WHEN 1 THEN 1 ELSE 0 END);`,
  ];
  const sessionIds = new Set();
  for (const session of row.state.placementSessions ?? []) {
    sessionIds.add(session.id);
    statements.push(`INSERT INTO placement_sessions(id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,submitted_at,result_id,adaptive_complete,adaptive_min_questions,adaptive_max_questions,updated_at) VALUES(${q(session.id)},${q(row.owner_id)},${q(session.idempotencyKey)},${q(session.questionVersion)},${q(canonical(session.questionIds))},${q(session.status)},${q(session.createdAt)},${q(expiry(session))},${q(session.submittedAt)},${q(session.resultId)},${session.adaptiveComplete == null ? "NULL" : session.adaptiveComplete ? 1 : 0},${session.adaptiveMinQuestions ?? "NULL"},${session.adaptiveMaxQuestions ?? "NULL"},${q(sessionUpdatedAt(session))}) ON CONFLICT(id) DO UPDATE SET question_ids_json=excluded.question_ids_json,status=excluded.status,expires_at=excluded.expires_at,submitted_at=excluded.submitted_at,result_id=excluded.result_id,adaptive_complete=excluded.adaptive_complete,adaptive_min_questions=excluded.adaptive_min_questions,adaptive_max_questions=excluded.adaptive_max_questions,updated_at=excluded.updated_at WHERE excluded.owner_id=placement_sessions.owner_id AND excluded.idempotency_key=placement_sessions.idempotency_key AND excluded.question_version=placement_sessions.question_version AND excluded.updated_at>placement_sessions.updated_at;`);
    for (const answer of session.answers ?? []) statements.push(`INSERT INTO placement_answers(session_id,question_id,answer,idempotency_key,answered_at) VALUES(${q(session.id)},${q(answer.questionId)},${q(answer.answer)},${q(answer.idempotencyKey)},${q(answer.answeredAt)}) ON CONFLICT(session_id,question_id) DO UPDATE SET answer=excluded.answer,idempotency_key=excluded.idempotency_key,answered_at=excluded.answered_at WHERE excluded.answered_at>placement_answers.answered_at;`);
  }
  for (const result of row.state.placementResults ?? []) {
    if (!sessionIds.has(result.sessionId)) throw new Error(`Result ${result.id} has no session; migration aborted fail-closed`);
    statements.push(`INSERT INTO placement_results(id,owner_id,session_id,submit_idempotency_key,result_json,created_at) VALUES(${q(result.id)},${q(row.owner_id)},${q(result.sessionId)},${q(result.submitIdempotencyKey)},${q(canonical(result))},${q(result.createdAt)}) ON CONFLICT(id) DO NOTHING;`);
  }
  statements.push(`DELETE FROM placement_cas_assertions WHERE id=${q(assertionId)};`);
  return statements;
}

function sourceSnapshot(rows) {
  return rows.map((row) => ({
    ownerId: row.owner_id,
    revision: Number(row.revision),
    sessions: (row.state.placementSessions ?? []).map((session) => ({
      id: session.id, ownerId: row.owner_id, idempotencyKey: session.idempotencyKey, questionVersion: session.questionVersion,
      questionIds: session.questionIds, status: session.status, createdAt: session.createdAt, expiresAt: expiry(session),
      submittedAt: session.submittedAt ?? null, resultId: session.resultId ?? null,
      adaptiveComplete: session.adaptiveComplete == null ? null : Boolean(session.adaptiveComplete),
      adaptiveMinQuestions: session.adaptiveMinQuestions ?? null, adaptiveMaxQuestions: session.adaptiveMaxQuestions ?? null,
      answers: (session.answers ?? []).map((answer) => ({ questionId: answer.questionId, answer: answer.answer, idempotencyKey: answer.idempotencyKey, answeredAt: answer.answeredAt })).sort((a, b) => a.questionId.localeCompare(b.questionId)),
    })).sort((a, b) => a.id.localeCompare(b.id)),
    results: (row.state.placementResults ?? []).map((result) => result).sort((a, b) => a.id.localeCompare(b.id)),
  })).sort((a, b) => a.ownerId.localeCompare(b.ownerId));
}

const checksum = (value) => createHash("sha256").update(canonical(value)).digest("hex");

function remoteQuery(sql) {
  const output = run(["d1", "execute", "hskkit-placement", "--remote", "--command", sql, "--json"], { capture: true });
  return parseResults(output);
}

function targetSnapshot() {
  const owners = remoteQuery("SELECT owner_id,revision FROM placement_owner_revisions ORDER BY owner_id");
  const sessions = remoteQuery("SELECT id,owner_id,idempotency_key,question_version,question_ids_json,status,created_at,expires_at,submitted_at,result_id,adaptive_complete,adaptive_min_questions,adaptive_max_questions FROM placement_sessions ORDER BY owner_id,id");
  const answers = remoteQuery("SELECT session_id,question_id,answer,idempotency_key,answered_at FROM placement_answers ORDER BY session_id,question_id");
  const results = remoteQuery("SELECT owner_id,result_json FROM placement_results ORDER BY owner_id,id");
  return owners.map((owner) => ({
    ownerId: owner.owner_id,
    revision: Number(owner.revision),
    sessions: sessions.filter((session) => session.owner_id === owner.owner_id).map((session) => ({
      id: session.id, ownerId: session.owner_id, idempotencyKey: session.idempotency_key, questionVersion: session.question_version,
      questionIds: JSON.parse(session.question_ids_json), status: session.status, createdAt: session.created_at, expiresAt: session.expires_at,
      submittedAt: session.submitted_at ?? null, resultId: session.result_id ?? null,
      adaptiveComplete: session.adaptive_complete == null ? null : Boolean(session.adaptive_complete),
      adaptiveMinQuestions: session.adaptive_min_questions ?? null, adaptiveMaxQuestions: session.adaptive_max_questions ?? null,
      answers: answers.filter((answer) => answer.session_id === session.id).map((answer) => ({ questionId: answer.question_id, answer: answer.answer, idempotencyKey: answer.idempotency_key, answeredAt: answer.answered_at })),
    })),
    results: results.filter((result) => result.owner_id === owner.owner_id).map((result) => JSON.parse(result.result_json)),
  }));
}

function coverageIssues(expectedOwners, actualOwners, fences = [], label = "source") {
  const actualByOwner = new Map(actualOwners.map((owner) => [owner.ownerId, owner]));
  const fenceByOwner = new Map(fences.map((fence) => [fence.owner_id, fence]));
  const issues = [];
  for (const expectedOwner of expectedOwners) {
    const fence = fenceByOwner.get(expectedOwner.ownerId);
    if (fence?.state === "deleted") continue;
    const destinationOwnerId = fence?.state === "merged" ? fence.target_owner_id : expectedOwner.ownerId;
    const actualOwner = actualByOwner.get(destinationOwnerId);
    if (!actualOwner) { issues.push(`${label}:missing-owner:${expectedOwner.ownerId}`); continue; }
    if (actualOwner.revision < expectedOwner.revision) issues.push(`${label}:revision-regressed:${expectedOwner.ownerId}`);
    const actualSessions = new Map(actualOwner.sessions.map((session) => [session.id, session]));
    for (const expectedSession of expectedOwner.sessions) {
      const actualSession = actualSessions.get(expectedSession.id);
      if (!actualSession) { issues.push(`${label}:missing-session:${expectedSession.id}`); continue; }
      if (actualSession.idempotencyKey !== expectedSession.idempotencyKey || actualSession.questionVersion !== expectedSession.questionVersion || actualSession.createdAt !== expectedSession.createdAt) issues.push(`${label}:session-identity-mismatch:${expectedSession.id}`);
      if (!expectedSession.questionIds.every((id) => actualSession.questionIds.includes(id))) issues.push(`${label}:missing-question:${expectedSession.id}`);
      if (expectedSession.status !== "in_progress" && actualSession.status !== expectedSession.status) issues.push(`${label}:session-status-regressed:${expectedSession.id}`);
      const actualAnswers = new Map(actualSession.answers.map((answer) => [answer.questionId, answer]));
      for (const expectedAnswer of expectedSession.answers) {
        const actualAnswer = actualAnswers.get(expectedAnswer.questionId);
        if (!actualAnswer) { issues.push(`${label}:missing-answer:${expectedSession.id}:${expectedAnswer.questionId}`); continue; }
        if (actualAnswer.answeredAt < expectedAnswer.answeredAt || (actualAnswer.answeredAt === expectedAnswer.answeredAt && actualAnswer.answer !== expectedAnswer.answer)) issues.push(`${label}:answer-regressed:${expectedSession.id}:${expectedAnswer.questionId}`);
      }
    }
    const actualResults = new Map(actualOwner.results.map((result) => [result.id, result]));
    for (const expectedResult of expectedOwner.results) {
      const actualResult = actualResults.get(expectedResult.id);
      if (!actualResult || canonical(actualResult) !== canonical(expectedResult)) issues.push(`${label}:result-mismatch:${expectedResult.id}`);
    }
  }
  return issues;
}

if (action === "rollback") {
  execFileSync(process.execPath, [resolve(root, "scripts/rollback-placement.mjs")], { cwd: root, stdio: "inherit", env: process.env });
  process.exit(0);
}
if (!new Set(["backfill", "verify"]).has(action)) throw new Error("Usage: migrate-placement-db.mjs [--dry-run|--apply|--rollback]");

const baselineSnapshot = action === "backfill" ? targetSnapshot() : [];
const source = exportSource();
const rows = placementOwners(source);
const expectedSnapshot = sourceSnapshot(rows);
const expected = {
  owners: rows.length,
  sessions: rows.reduce((sum, row) => sum + (row.state.placementSessions?.length ?? 0), 0),
  answers: rows.reduce((sum, row) => sum + (row.state.placementSessions ?? []).reduce((inner, session) => inner + (session.answers?.length ?? 0), 0), 0),
  results: rows.reduce((sum, row) => sum + (row.state.placementResults?.length ?? 0), 0),
  checksum: checksum(expectedSnapshot),
};

if (action === "backfill") {
  const targetRevisions = new Map(remoteQuery("SELECT owner_id,revision FROM placement_owner_revisions").map((row) => [row.owner_id, Number(row.revision)]));
  for (const [index, row] of rows.entries()) {
    const targetRevision = targetRevisions.get(row.owner_id);
    if (targetRevision != null && targetRevision >= Number(row.revision)) continue;
    const file = resolve(work, `backfill-${String(index + 1).padStart(3, "0")}.sql`);
    writeFileSync(file, `${statementsFor(row, targetRevision).join("\n")}\n`);
    // Wrangler's remote file import is atomic and rejects explicit BEGIN/COMMIT.
    run(["d1", "execute", "hskkit-placement", "--remote", "--file", file]);
  }
}

const actualSnapshot = targetSnapshot();
const normalizedActual = {
  owners: actualSnapshot.length,
  sessions: actualSnapshot.reduce((sum, owner) => sum + owner.sessions.length, 0),
  answers: actualSnapshot.reduce((sum, owner) => sum + owner.sessions.reduce((inner, session) => inner + session.answers.length, 0), 0),
  results: actualSnapshot.reduce((sum, owner) => sum + owner.results.length, 0),
  checksum: checksum(actualSnapshot),
};
const orphanRow = remoteQuery("SELECT (SELECT COUNT(*) FROM placement_sessions s LEFT JOIN placement_owner_revisions o ON o.owner_id=s.owner_id WHERE o.owner_id IS NULL) sessionsWithoutOwner,(SELECT COUNT(*) FROM placement_answers a LEFT JOIN placement_sessions s ON s.id=a.session_id WHERE s.id IS NULL) answersWithoutSession,(SELECT COUNT(*) FROM placement_results r LEFT JOIN placement_sessions s ON s.id=r.session_id WHERE s.id IS NULL) resultsWithoutSession,(SELECT COUNT(*) FROM placement_results r LEFT JOIN placement_owner_revisions o ON o.owner_id=r.owner_id WHERE o.owner_id IS NULL) resultsWithoutOwner,(SELECT COUNT(*) FROM placement_results r JOIN placement_sessions s ON s.id=r.session_id WHERE r.owner_id<>s.owner_id) resultOwnerMismatches")[0] ?? {};
const orphanChecks = Object.fromEntries(["sessionsWithoutOwner", "answersWithoutSession", "resultsWithoutSession", "resultsWithoutOwner", "resultOwnerMismatches"].map((key) => [key, Number(orphanRow[key] ?? -1)]));
const fences = remoteQuery("SELECT owner_id,state,target_owner_id FROM placement_owner_fences ORDER BY owner_id");
const coverage = {
  sourceIssues: coverageIssues(expectedSnapshot, actualSnapshot, fences, "source"),
  baselineIssues: coverageIssues(baselineSnapshot, actualSnapshot, fences, "baseline"),
};
const ok = coverage.sourceIssues.length === 0 && coverage.baselineIssues.length === 0 && Object.values(orphanChecks).every((value) => value === 0);
writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), expected, actual: normalizedActual, coverage, orphanChecks, verification: ok ? "GO" : "NO_GO" }, null, 2));
console.log(JSON.stringify({ expected, actual: normalizedActual, coverage, orphanChecks, manifestPath, verification: ok ? "GO" : "NO_GO" }, null, 2));
if (!ok) process.exit(2);
