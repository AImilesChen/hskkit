"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AiAssist from "@/app/components/ai-assist";
import type { StudyPlan } from "@/lib/planner/domain";

type PlannerData = { latest: StudyPlan | null; versions: StudyPlan[]; realSignals: { weakPoints: string[]; dueCards: number }; scope: "guest" | "account" };
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function defaultDate() { const date = new Date(); date.setUTCDate(date.getUTCDate() + 90); return date.toISOString().slice(0, 10); }

export default function PlannerClient() {
  const [data, setData] = useState<PlannerData>();
  const [goalLevel, setGoalLevel] = useState(3);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [weeklyMinutes, setWeeklyMinutes] = useState(210);
  const [preferredDays, setPreferredDays] = useState([1, 3, 5]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [minimum, setMinimum] = useState<number>();
  const key = useRef<string | undefined>(undefined);

  async function load() {
    const response = await fetch("/api/v1/planner", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error ?? "Planner unavailable"); return; }
    setData(payload);
    if (payload.latest) {
      setGoalLevel(payload.latest.inputs.goalLevel); setTargetDate(payload.latest.inputs.targetDate);
      setWeeklyMinutes(payload.latest.inputs.weeklyMinutes); setPreferredDays(payload.latest.inputs.preferredDays);
    }
  }
  useEffect(() => { void load(); }, []);

  function toggleDay(day: number) { setPreferredDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort()); }
  async function save() {
    if (saving) return;
    setSaving(true); setError(""); setMinimum(undefined);
    const idempotencyKey = key.current ?? crypto.randomUUID(); key.current = idempotencyKey;
    const response = await fetch("/api/v1/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: data?.latest ? "edit" : "generate", baseVersion: data?.latest?.version, idempotencyKey, goalLevel, targetDate, weeklyMinutes, preferredDays }) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) {
      if (payload.error === "PLAN_INFEASIBLE") { setMinimum(payload.minimumWeeklyMinutes); setError("This target cannot fit your real SRS load and available time. No plan was saved."); }
      else if (response.status === 409) { setError("This plan changed elsewhere. Latest version loaded; review before saving again."); key.current = undefined; await load(); }
      else setError("We couldn't save this plan. No new version was created.");
      return;
    }
    key.current = undefined; await load();
  }
  if (!data) return <section className="card"><p role="status">Loading your real SRS load and weak points…</p>{error && <p className="step7-alert error">{error}</p>}</section>;
  const plan = data.latest;
  return <div className="planner-layout">
    <section className="card planner-form"><span className="eyebrow">Real inputs</span><h2>{plan ? `Edit plan v${plan.version}` : "Build a feasible plan"}</h2><p>Your weak points are derived from unresolved mistakes. SRS load is read from due cards, not typed by you.</p>
      <div className="planner-signals"><div><strong>{data.realSignals.dueCards}</strong><span>due SRS cards</span></div><div><strong>{data.realSignals.weakPoints.length || 0}</strong><span>weak areas</span></div><div><strong>{data.scope}</strong><span>saved scope</span></div></div>
      <div className="planner-fields"><label>Target HSK level<select value={goalLevel} onChange={(event) => setGoalLevel(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>HSK {index + 1}</option>)}</select></label><label>Target date<input type="date" value={targetDate} min={new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)} onChange={(event) => setTargetDate(event.target.value)}/></label><label>Available minutes each week<input type="number" min="15" max="2100" step="15" value={weeklyMinutes} onChange={(event) => setWeeklyMinutes(Number(event.target.value))}/></label></div>
      <fieldset><legend>Available study days</legend><div className="planner-days">{dayNames.map((name, day) => <label key={name}><input type="checkbox" checked={preferredDays.includes(day)} onChange={() => toggleDay(day)}/><span>{name}</span></label>)}</div></fieldset>
      {data.realSignals.weakPoints.length > 0 && <p className="planner-weak"><strong>Current weak areas:</strong> {data.realSignals.weakPoints.join(", ")}</p>}
      {error && <div className="step7-alert error" role="alert"><strong>{error}</strong>{minimum && <p>Minimum estimated capacity: {minimum} minutes/week. Increase time or move the target date.</p>}</div>}
      <button className="btn" disabled={saving || preferredDays.length === 0} onClick={() => void save()}>{saving ? "Checking capacity…" : plan ? "Save as new version" : "Generate feasible plan"}</button>
    </section>
    <section className="planner-result">{plan ? <><div className="planner-heading"><div><span className="eyebrow">Active version</span><h2>Plan v{plan.version}</h2></div><span>{plan.inputs.weeklyMinutes} min/week</span></div><div className="planner-load"><strong>{plan.srsLoad.dueCards} due cards</strong><span>{plan.srsLoad.weeklyMinutes} min reserved for SRS</span></div>{plan.warnings.includes("SRS_LOAD_HIGH") && <div className="step7-alert warning" role="alert"><strong>High SRS load</strong><p>Due reviews use at least half of your weekly study time. Complete Review first or increase your weekly capacity.</p></div>}<div className="planner-sessions">{plan.sessions.map((session) => <article className="card" key={session.day}><div className="planner-session-head"><h3>{dayNames[session.day]}</h3><strong>{session.minutes} min</strong></div>{session.tasks.map((task) => <Link href={task.href} key={task.id}><span>{task.title}</span><small>{task.minutes} min · {task.source}</small></Link>)}</article>)}</div><details className="planner-history"><summary>Version history ({data.versions.length})</summary>{data.versions.map((version) => <p key={version.id}><strong>v{version.version}</strong> · {version.inputs.weeklyMinutes} min/week · <time>{new Date(version.createdAt).toLocaleString()}</time> · {version.status}</p>)}</details><AiAssist feature="study_plan"/></> : <div className="card"><h2>No plan yet</h2><p>Enter a real goal and schedule. HSKKit will reject a target that cannot fit your SRS maintenance and available time.</p><Link className="step7-related" href="/mistakes">Review your current weak points →</Link></div>}</section>
  </div>;
}
