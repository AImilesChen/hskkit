"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AiAssist from "@/app/components/ai-assist";
import HomeIcon, { type HomeIconName } from "@/app/components/home-icon";
import { calculatePlannerStreak, estimatePlannerCapacity, normalizePlannerCompletions, type StudyPlan } from "@/lib/planner/domain";

type PlannerData = {
  latest: StudyPlan | null;
  versions: StudyPlan[];
  realSignals: { placementLevel?: number; weakPoints: string[]; dueCards: number };
  scope: "guest" | "account";
};
type RequestState = "loading" | "ready" | "saving" | "success" | "error";
type Celebration = "weekly" | "goal" | null;

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const sourceLabels: Record<string, string> = { srs: "Due review", "weak-point": "Weak area", goal: "Goal practice" };
const sourceIcons: Record<string, HomeIconName> = { srs: "review", "weak-point": "target", goal: "book" };

function defaultDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString().slice(0, 10);
}
function safeMessage(value: unknown) {
  return typeof value === "string" && value.length < 180 && !/^[A-Z0-9_]+$/.test(value) ? value : "Planner is temporarily unavailable.";
}
async function readJsonResponse(response: Response) {
  const body = await response.text();
  if (!body) throw new Error("Planner is temporarily unavailable. Please retry.");
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Planner is temporarily unavailable. Please retry.");
  }
}
function midpointDate(targetDate: string) {
  const start = new Date();
  const target = new Date(`${targetDate}T12:00:00.000Z`);
  return new Date(start.getTime() + Math.max(0, target.getTime() - start.getTime()) / 2).toISOString().slice(0, 10);
}
function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function hasCompleted(record: Record<string, string | null>, taskId: string) {
  return Object.prototype.hasOwnProperty.call(record, taskId);
}

export default function PlannerClient() {
  const [data, setData] = useState<PlannerData>();
  const [goalLevel, setGoalLevel] = useState(3);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [weeklyMinutes, setWeeklyMinutes] = useState(210);
  const [preferredDays, setPreferredDays] = useState([1, 3, 5]);
  const [requestState, setRequestState] = useState<RequestState>("loading");
  const [error, setError] = useState("");
  const [errorSource, setErrorSource] = useState<"load" | "save">("load");
  const [minimum, setMinimum] = useState<number>();
  const [suggestedTargetDate, setSuggestedTargetDate] = useState<string>();
  const [completed, setCompleted] = useState<Record<string, string | null>>({});
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState("");
  const [celebration, setCelebration] = useState<Celebration>(null);
  const key = useRef<string | undefined>(undefined);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const celebrationClose = useRef<HTMLButtonElement>(null);
  const plan = data?.latest ?? null;

  async function load(): Promise<boolean> {
    setRequestState("loading");
    setError("");
    try {
      const response = await fetch("/api/v1/planner", { cache: "no-store", signal: AbortSignal.timeout(12_000) });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(safeMessage(payload?.error));
      setData(payload);
      if (payload.latest) {
        setSettingsOpen(false);
        setGuideOpen(localStorage.getItem("planner-how-to-dismissed") !== "true");
        setGoalLevel(payload.latest.inputs.goalLevel);
        setTargetDate(payload.latest.inputs.targetDate);
        setWeeklyMinutes(payload.latest.inputs.weeklyMinutes);
        setPreferredDays(payload.latest.inputs.preferredDays);
      } else if (payload.realSignals?.placementLevel) {
        setSettingsOpen(true);
        setGoalLevel(payload.realSignals.placementLevel);
      } else {
        setSettingsOpen(true);
      }
      setRequestState("ready");
      return true;
    } catch {
      setRequestState("error");
      setErrorSource("load");
      setError("Planner is temporarily unavailable. Please retry.");
      return false;
    }
  }
  useEffect(() => { void load(); }, []);

  const completionKey = plan ? `planner-task-completion:${plan.id}` : "";
  const activityKey = plan ? `planner-learning-activity:${plan.ownerId}` : "";
  useEffect(() => {
    if (!completionKey) { setCompleted({}); setActivityDates([]); return; }
    try {
      const stored = JSON.parse(localStorage.getItem(completionKey) ?? "[]");
      setCompleted(normalizePlannerCompletions(stored));
    } catch { setCompleted({}); }
    try {
      const stored = JSON.parse(localStorage.getItem(activityKey) ?? "[]");
      setActivityDates(Array.isArray(stored) ? [...new Set(stored.filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)))].sort() : []);
    } catch { setActivityDates([]); }
  }, [activityKey, completionKey]);

  useEffect(() => {
    const placement = data?.realSignals.placementLevel;
    const startingLevel = plan?.signals?.placementLevel;
    if (!plan || !placement || !startingLevel || startingLevel >= plan.inputs.goalLevel || placement < plan.inputs.goalLevel) return;
    const rewardKey = `planner-reward:goal:${plan.inputs.goalLevel}`;
    if (localStorage.getItem(rewardKey) === "shown") return;
    localStorage.setItem(rewardKey, "shown");
    setCelebration("goal");
  }, [data?.realSignals.placementLevel, plan]);

  useEffect(() => {
    if (!celebration) return;
    celebrationClose.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setCelebration(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [celebration]);

  useEffect(() => () => { if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current); }, []);

  const preview = useMemo(() => estimatePlannerCapacity({
    goalLevel,
    targetDate,
    weeklyMinutes,
    preferredDays,
    placementLevel: data?.realSignals.placementLevel,
    dueCards: data?.realSignals.dueCards ?? 0,
    weakPointCount: data?.realSignals.weakPoints.length ?? 0,
    now: new Date().toISOString(),
  }), [data, goalLevel, preferredDays, targetDate, weeklyMinutes]);
  const isDirty = !plan || plan.inputs.goalLevel !== goalLevel || plan.inputs.targetDate !== targetDate || plan.inputs.weeklyMinutes !== weeklyMinutes || plan.inputs.preferredDays.join(",") !== preferredDays.join(",");

  function toggleDay(day: number) {
    setPreferredDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }
  function toggleTask(taskId: string) {
    const next = { ...completed };
    const wasComplete = hasCompleted(completed, taskId);
    const removedDate = wasComplete ? next[taskId] : undefined;
    if (wasComplete) delete next[taskId];
    else next[taskId] = localDateKey();
    setCompleted(next);
    if (completionKey) localStorage.setItem(completionKey, JSON.stringify(next));

    if (wasComplete && removedDate && !Object.values(next).includes(removedDate)) {
      const nextDates = activityDates.filter((date) => date !== removedDate);
      setActivityDates(nextDates);
      if (activityKey) localStorage.setItem(activityKey, JSON.stringify(nextDates));
    } else if (!wasComplete && activityKey) {
      const nextDates = [...new Set([...activityDates, localDateKey()])].sort();
      setActivityDates(nextDates);
      localStorage.setItem(activityKey, JSON.stringify(nextDates));
    }

    const taskIds = plan?.sessions.flatMap((session) => session.tasks.map((task) => task.id)) ?? [];
    const nextCount = taskIds.filter((id) => hasCompleted(next, id)).length;
    setTaskFeedback(wasComplete ? "Task marked incomplete." : nextCount === 1 ? "First task complete. Your learning streak has started." : "Task complete. Weekly progress updated.");
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setTaskFeedback(""), 3200);
    if (!wasComplete && taskIds.length > 0 && nextCount === taskIds.length && plan) {
      const rewardKey = `planner-reward:weekly:${plan.id}`;
      if (localStorage.getItem(rewardKey) !== "shown") {
        localStorage.setItem(rewardKey, "shown");
        setCelebration("weekly");
      }
    }
  }

  async function save() {
    if (requestState === "saving") return;
    setRequestState("saving");
    setErrorSource("save");
    let finalState: RequestState = "error";
    setError("");
    setMinimum(undefined);
    setSuggestedTargetDate(undefined);
    const idempotencyKey = key.current ?? crypto.randomUUID();
    key.current = idempotencyKey;
    try {
      const response = await fetch("/api/v1/planner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          action: plan ? "edit" : "generate",
          baseVersion: plan?.version,
          idempotencyKey,
          goalLevel,
          targetDate,
          weeklyMinutes,
          preferredDays,
        }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        if (payload.error === "PLAN_INFEASIBLE") {
          setMinimum(payload.minimumWeeklyMinutes);
          setSuggestedTargetDate(payload.suggestedTargetDate);
          throw new Error("This target needs more time. Adjust your weekly minutes or target date, then retry.");
        }
        if (response.status === 409) {
          key.current = undefined;
          const refreshed = await load();
          if (!refreshed) throw new Error("Your plan changed in another session, but we couldn’t reload it. Retry to refresh.");
          setErrorSource("save");
          throw new Error("Your plan changed in another session. We loaded the latest version; review it and retry.");
        }
        throw new Error("We couldn’t save this plan. No new version was created.");
      }
      key.current = undefined;
      const refreshed = await load();
      if (!refreshed) throw new Error("Your plan was saved, but the latest version could not be loaded. Retry to refresh it.");
      finalState = "success";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t save this plan.");
    } finally {
      setRequestState(finalState);
    }
  }

  if (!data) return <section className="card planner-load-state" aria-live="polite">
    {requestState === "loading" ? <><span className="planner-spinner" aria-hidden="true"/><p role="status">Loading your progress and due reviews…</p></> : <><p role="alert">{error}</p><button className="btn secondary" type="button" onClick={() => void load()}>Retry</button></>}
  </section>;

  const tasks = plan?.sessions.flatMap((session) => session.tasks) ?? [];
  const completeCount = tasks.filter((task) => hasCompleted(completed, task.id)).length;
  const completedMinutes = tasks.filter((task) => hasCompleted(completed, task.id)).reduce((sum, task) => sum + task.minutes, 0);
  const scheduledMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const progress = tasks.length ? Math.round(completeCount / tasks.length * 100) : 0;
  const nextTask = tasks.find((task) => !hasCompleted(completed, task.id));
  const streak = calculatePlannerStreak(activityDates, localDateKey());
  const midpoint = midpointDate(plan?.inputs.targetDate ?? targetDate);
  const feasibilityLabel = !plan && !data.realSignals.placementLevel ? "Estimate only" : preview.status === "infeasible" ? "Needs adjustment" : preview.status === "tight" ? "Tight but possible" : preview.status === "feasible" ? "On track" : "Check your inputs";

  return <div className={`planner-workspace planner-layout ${plan ? "has-plan" : ""}`}>
    <section className="card planner-form">
      <details className="planner-settings" open={settingsOpen || !plan} onToggle={(event) => setSettingsOpen(event.currentTarget.open)}>
        <summary><HomeIcon name="target"/><span>Edit plan settings</span><small>{weeklyMinutes} min/week · {preferredDays.length} days</small></summary>
        <div className="planner-settings-content">
      <div className="planner-section-heading"><span className="planner-icon"><HomeIcon name="target"/></span><div><span className="eyebrow">Your goal</span><h2>{plan ? "Adjust your plan" : "Set your target"}</h2></div></div>
      <div className="planner-signals">
        <div><HomeIcon name="target"/><strong>{data.realSignals.placementLevel ? `HSK ${data.realSignals.placementLevel}` : "Not set"}</strong><span>Starting level</span>{!data.realSignals.placementLevel && <Link href="/placement">Start level check</Link>}</div>
        <div><HomeIcon name="review"/><strong>{data.realSignals.dueCards}</strong><span>Due reviews</span></div>
        <div><HomeIcon name="route"/><strong>{data.realSignals.weakPoints.length}</strong><span>Weak areas</span></div>
      </div>
      <div className="planner-fields">
        <label>Target HSK level<select value={goalLevel} onChange={(event) => setGoalLevel(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>HSK {index + 1}</option>)}</select></label>
        <label>Target date<input type="date" value={targetDate} min={new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)} onChange={(event) => setTargetDate(event.target.value)}/></label>
        <label>Minutes each week<input type="number" min="15" max="2100" step="15" value={weeklyMinutes} onChange={(event) => setWeeklyMinutes(Number(event.target.value))}/></label>
      </div>
      <fieldset><legend>Study days</legend><div className="planner-days">{dayNames.map((name, day) => <label key={name}><input type="checkbox" checked={preferredDays.includes(day)} onChange={() => toggleDay(day)}/><span>{name}</span></label>)}</div></fieldset>
      {data.realSignals.weakPoints.length > 0 && <details className="planner-weak"><summary>{data.realSignals.weakPoints.length} weak areas will receive extra practice</summary><p>{data.realSignals.weakPoints.join(", ")}</p></details>}
      {error && <div className="step7-alert error" role="alert"><strong>{error}</strong>{minimum && <p>Try at least {minimum} minutes per week.</p>}<div className="step7-actions">{minimum && minimum <= 2100 && <button className="btn secondary" type="button" onClick={() => setWeeklyMinutes(minimum)}>Use {minimum} min/week</button>}{suggestedTargetDate && <button className="btn secondary" type="button" onClick={() => setTargetDate(suggestedTargetDate)}>Move target to {suggestedTargetDate}</button>}<button className="btn secondary" type="button" onClick={() => void (errorSource === "load" ? load() : save())}>Retry</button></div></div>}
      <button className="btn planner-generate" disabled={requestState === "saving" || preferredDays.length === 0 || preview.status === "invalid" || (!!plan && !isDirty)} onClick={() => void save()}>{requestState === "saving" ? <><span className="planner-spinner" aria-hidden="true"/>Checking capacity…</> : <><HomeIcon name="calendar"/>{!plan ? "Create my weekly plan" : isDirty ? "Update weekly plan" : "Plan is up to date"}</>}</button>
      <p className={`planner-save-note ${plan && isDirty ? "unsaved" : ""}`}>{!plan ? data.scope === "account" ? "Preview only. Create the plan to save weekly tasks to your account." : <>Preview only. Guests can try Planner and save weekly tasks on this device. <Link href="/login?returnTo=%2Fplanner">Sign in to save it across devices.</Link></> : isDirty ? "Unsaved changes. Update the plan to rebuild your weekly tasks." : data.scope === "account" ? `Plan v${plan.version} saved to your account.` : `Plan v${plan.version} saved on this device.`}</p>
        </div>
      </details>
    </section>

    <section className="planner-result" aria-live="polite">
      {plan && <>
        <section className="card planner-progress">
          <div className="planner-heading"><div><span className="eyebrow">Weekly progress</span><h2>{completeCount} of {tasks.length} tasks complete</h2></div><strong>{progress}%</strong></div>
          {nextTask ? <div className="planner-next"><span className="planner-task-icon"><HomeIcon name={sourceIcons[nextTask.source] ?? "book"}/></span><div><small>Next task</small><strong>{nextTask.title}</strong></div><Link href={nextTask.href}>Start next task<HomeIcon name="arrow"/></Link></div> : <p className="planner-week-complete"><HomeIcon name="check"/>All weekly tasks complete.</p>}
          <div className="planner-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }}/></div>
          <div className="planner-momentum" aria-label="Learning momentum"><div><strong>{completedMinutes}</strong><span>Minutes complete</span><small>of {scheduledMinutes} scheduled</small></div><div><strong>{streak.activeDays}</strong><span>Study days</span><small>with a completed plan task</small></div><div><strong>{streak.current}</strong><span>Learning streak</span><small>consecutive study days</small></div></div>
          {taskFeedback && <p className="planner-task-feedback" role="status"><HomeIcon name="check"/>{taskFeedback}</p>}
        </section>
        <details className="card planner-how" open={guideOpen} onToggle={(event) => { setGuideOpen(event.currentTarget.open); if (!event.currentTarget.open) localStorage.setItem("planner-how-to-dismissed", "true"); }}>
          <summary><span><HomeIcon name="route"/>How to use this plan</span><small>{guideOpen ? "Hide guide" : "Show guide"}</small></summary>
          <div className="planner-how-content"><div><span>1</span><strong>Your plan is ready</strong><small>Start from the single next-task action above.</small></div><div><span>2</span><strong>Mark tasks complete</strong><small>Completion updates your real weekly progress.</small></div><div><span>3</span><strong>Return to see progress</strong><small>Your next task and learning streak stay here.</small></div></div>
        </details>
        <section className="planner-week"><div className="planner-section-heading"><span className="planner-icon"><HomeIcon name="calendar"/></span><div><span className="eyebrow">This week</span><h2>Your study timeline</h2></div></div><div className="planner-sessions">{plan.sessions.map((session) => <article className="card" key={session.day}><div className="planner-session-head"><div><span>{dayNames[session.day]}</span><h3>{session.minutes} minute session</h3></div><strong>{session.tasks.filter((task) => hasCompleted(completed, task.id)).length}/{session.tasks.length}</strong></div><div className="planner-task-list">{session.tasks.map((task) => <div className={`planner-task ${hasCompleted(completed, task.id) ? "complete" : ""}`} key={task.id}><label><input type="checkbox" checked={hasCompleted(completed, task.id)} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} complete`}/><span className="planner-task-check"><HomeIcon name="check"/></span></label><span className="planner-task-icon"><HomeIcon name={sourceIcons[task.source] ?? "book"}/></span><div><strong>{task.title}</strong><small>{task.minutes} min · {sourceLabels[task.source] ?? "Practice"}</small></div><Link className="planner-task-link" href={task.href} aria-label={`Start ${task.title}`}>Start<HomeIcon name="arrow"/></Link></div>)}</div></article>)}</div></section>
      </>}
      <div className={`planner-preview card status-${preview.status}`}>
        <div className="planner-heading"><div><span className="eyebrow">{plan ? "Plan details" : "Plan preview"}</span><h2>{plan ? `HSK ${plan.inputs.goalLevel} plan · v${plan.version}` : `Your path to HSK ${goalLevel}`}</h2></div><span className="planner-feasibility"><HomeIcon name={preview.status === "infeasible" ? "timer" : "check"}/>{feasibilityLabel}</span></div>
        <div className="planner-preview-metrics"><div><strong>{preview.weeks || "—"}</strong><span>weeks</span></div><div><strong>{preferredDays.length}</strong><span>days/week</span></div><div><strong>{preview.minutesPerStudyDay || "—"}</strong><span>min/study day</span></div></div>
        <div className="planner-feasibility-copy"><strong>Plan feasibility</strong><p>{preview.status === "infeasible" ? `Your current goal needs about ${preview.minimumWeeklyMinutes} minutes each week.` : `${weeklyMinutes} weekly minutes can cover due reviews, weak areas and goal practice.`}</p></div>
        <div className="planner-allocation" aria-label="Weekly allocation">
          <div className="planner-allocation-head"><strong>Weekly allocation</strong><span>{weeklyMinutes} min</span></div>
          <div className="planner-allocation-bar" role="img" aria-label={`${preview.allocation.srs} minutes reviews, ${preview.allocation.weakPoints} minutes weak areas, ${preview.allocation.goal} minutes goal practice`}><span className="review" style={{ width: `${weeklyMinutes ? preview.allocation.srs / weeklyMinutes * 100 : 0}%` }}/><span className="weakness" style={{ width: `${weeklyMinutes ? preview.allocation.weakPoints / weeklyMinutes * 100 : 0}%` }}/><span className="goal" style={{ width: `${weeklyMinutes ? preview.allocation.goal / weeklyMinutes * 100 : 0}%` }}/></div>
          <div className="planner-allocation-legend"><span><i className="review"/>Reviews {preview.allocation.srs}m</span><span><i className="weakness"/>Weak areas {preview.allocation.weakPoints}m</span><span><i className="goal"/>Goal {preview.allocation.goal}m</span>{preview.allocation.open > 0 && <span><i className="open"/>Flexible {preview.allocation.open}m</span>}</div>
        </div>
      </div>

      {plan ? <div className="planner-execution">
        <section className="card planner-milestones"><div className="planner-section-heading"><span className="planner-icon"><HomeIcon name="route"/></span><div><span className="eyebrow">Plan milestones</span><h2>Stay oriented from start to target</h2></div></div><ol><li><span/><div><strong>Start this week</strong><small>Complete the first scheduled session.</small></div></li><li><span/><div><strong>Midpoint review</strong><small><time dateTime={midpoint}>{midpoint}</time> · Review completion and adjust your availability.</small></div></li><li><span/><div><strong>Target date</strong><small><time dateTime={plan.inputs.targetDate}>{plan.inputs.targetDate}</time> · Reach your selected HSK goal.</small></div></li></ol></section>
        {(plan.warnings.includes("SRS_LOAD_HIGH") || plan.warnings.includes("TARGET_LEVEL_CONTENT_GAP")) && <div className="step7-alert warning" role="alert"><strong>Plan note</strong><p>{plan.warnings.includes("SRS_LOAD_HIGH") ? "Due reviews take a large share of this week. Complete them first or add more study time." : `Your HSK ${plan.inputs.goalLevel} target uses the highest approved foundation currently available.`}</p></div>}
        <details className="planner-history"><summary>Previous plan versions ({data.versions.length})</summary>{data.versions.map((version) => <p key={version.id}><strong>v{version.version}</strong> · {version.inputs.weeklyMinutes} min/week · <time>{new Date(version.createdAt).toLocaleString()}</time></p>)}</details>
        <AiAssist feature="study_plan"/>
      </div> : <section className="card planner-empty"><HomeIcon name="route"/><h2>Your weekly tasks will appear here</h2><p>Adjust the inputs and watch the preview update. Create the plan when the timing feels realistic.</p><Link href="/today">See how Today works<HomeIcon name="arrow"/></Link></section>}
    </section>
    {celebration && <div className="planner-celebration" role="dialog" aria-modal="true" aria-labelledby="planner-celebration-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setCelebration(null); }}>
      <div className="planner-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index}/>)}</div>
      <div className="planner-celebration-panel"><span className="planner-celebration-icon"><HomeIcon name={celebration === "goal" ? "target" : "check"}/></span><span className="eyebrow">Milestone reached</span><h2 id="planner-celebration-title">{celebration === "goal" ? `You reached your HSK ${plan?.inputs.goalLevel} goal` : "Weekly goal complete"}</h2><p>{celebration === "goal" ? "Your latest placement result now meets the target in this plan. Choose a new goal when you are ready." : `You completed all ${tasks.length} planned tasks and ${completedMinutes} study minutes this week.`}</p><button ref={celebrationClose} className="btn" type="button" onClick={() => setCelebration(null)}>Continue learning</button></div>
    </div>}
    <p className="planner-live-status" role="status" aria-live="polite">{requestState === "saving" ? "Checking capacity and building your weekly plan…" : requestState === "success" ? "Your plan was saved successfully and is ready to use." : taskFeedback}</p>
  </div>;
}
