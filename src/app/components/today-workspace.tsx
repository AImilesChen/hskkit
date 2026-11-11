"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import HomeIcon from './home-icon';
import { TodaySessionSupport, type TodaySupportData } from './today-learning-content';
import { todayStageCopy, todayWorkspaceSelection, type WorkspaceItem, type WorkspaceStageState } from '@/lib/learning/today-workspace';

type RouteTask = WorkspaceItem & { title: string; content: ReactNode };
type RouteStage = {
  key: string; kind: WorkspaceItem['kind']; state: WorkspaceStageState;
  title: string; total: number; completed: number; moved: number; minutes: number;
  tasks: RouteTask[];
};

export function TodayWorkspace({ stages, activeId, completedStages, totalStages, currentAction, stepOptions, notes, support }: {
  stages: RouteStage[]; activeId?: string; completedStages: number; totalStages: number;
  currentAction: ReactNode; stepOptions: ReactNode; notes: ReactNode;
  support: TodaySupportData;
}) {
  const [selection, setSelection] = useState<{ id: string; activeId?: string } | null>(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef(activeId);
  useEffect(() => {
    if (previousActive.current === activeId) return;
    previousActive.current = activeId;
    const heading = headingRef.current;
    heading?.focus({ preventScroll: true });
    if (heading && (heading.getBoundingClientRect().top < 80 || heading.getBoundingClientRect().top > window.innerHeight / 2)) heading.scrollIntoView({ block: 'start' });
  }, [activeId]);
  const tasks = stages.flatMap(stage => stage.tasks);
  const selected = todayWorkspaceSelection(tasks, activeId, selection);
  const selectedStage = stages.find(stage => stage.tasks.some(task => task.id === selected?.id));
  const activeStage = stages.find(stage => stage.tasks.some(task => task.id === activeId));
  const summaryTask = tasks.find(task => task.kind === 'summary');
  const select = (id: string) => {
    setSelection({ id, activeId }); setRouteOpen(false);
    if (routeOpen) requestAnimationFrame(() => { headingRef.current?.focus({ preventScroll: true }); headingRef.current?.scrollIntoView({ block: 'start' }); });
  };
  const currentSelected = selected?.id === activeId;
  return <><div className="tw-layout">
    <aside className="tw-route" aria-label="Today learning route" data-mobile-open={routeOpen}>
      <button type="button" className="tw-route-toggle" aria-expanded={routeOpen} aria-controls="today-route-list" onClick={() => setRouteOpen(open => !open)}><HomeIcon name={todayStageCopy[activeStage?.kind ?? 'summary'].icon} /><span><strong>{activeStage?.title ?? 'Today’s summary'}</strong><span>{routeOpen ? 'Hide learning route' : 'View learning route'}</span></span><HomeIcon name="route" /></button>
      <div id="today-route-list" className="tw-route-body">
        <div className="tw-route-heading"><h2>Your learning route</h2><p>{completedStages}/{totalStages} stages complete</p></div>
        <nav aria-label="Today task sequence">{stages.map(stage => {
          const chosen = selectedStage?.key === stage.key;
          const target = stage.tasks.find(task => task.id === activeId) ?? stage.tasks[0];
          const status = stage.state === 'current' ? 'Current' : stage.state === 'completed' ? 'Complete' : stage.state === 'finished' ? stage.completed ? 'Finished' : 'Moved' : 'Later';
          return <div key={stage.key} className={`tw-route-stage tw-kind-${stage.kind}`} data-stage-state={stage.state} data-selected={chosen}>
            <button type="button" className="tw-stage-button" aria-current={stage.state === 'current' ? 'step' : undefined} aria-expanded={chosen} onClick={() => target && select(target.id)}>
              <span className="tw-stage-icon"><HomeIcon name={stage.state === 'completed' ? 'check' : todayStageCopy[stage.kind].icon} /></span>
              <span className="tw-stage-label"><strong>{stage.title}</strong><span>{stage.kind === 'summary' ? stage.state === 'completed' ? 'Results saved' : 'After your planned steps' : `${stage.completed}/${stage.total} complete${stage.moved ? ` · ${stage.moved} moved` : ''}${stage.minutes ? ` · ${stage.minutes} min left` : ''}`}</span></span>
              <span className={`tw-state tw-state-${stage.state}`}>{status}</span>
            </button>
            {chosen && stage.tasks.length > 1 && <div className="tw-route-tasks">{stage.tasks.map(task => <button key={task.id} type="button" aria-current={task.id === selected?.id ? 'true' : undefined} onClick={() => select(task.id)}><span className={`tw-task-status tw-task-status-${task.status}`}><HomeIcon name={task.status === 'completed' ? 'check' : task.status === 'skipped' ? 'calendar' : 'arrow'} /></span><span>{task.title}</span><span className="tw-task-status-label">{task.status === 'completed' ? 'Done' : task.status === 'skipped' ? 'Moved' : task.id === activeId ? 'Current' : 'Later'}</span></button>)}</div>}
          </div>;
        })}</nav>
        {notes}
      </div>
    </aside>
    <section className={`tw-work-pane tw-kind-${selected?.kind ?? 'summary'}`} aria-label="Learning workspace">
      <div className="tw-work-heading" ref={headingRef} tabIndex={-1}><span><HomeIcon name={todayStageCopy[selected?.kind ?? 'summary'].icon} />{selectedStage?.title ?? 'Today’s summary'}</span><span>{currentSelected ? 'Current task' : selected?.status === 'completed' ? 'Saved learning record' : selected?.status === 'skipped' ? 'Moved to tomorrow' : 'Upcoming task'}</span></div>
      <div className="tw-work-content" key={selected?.id}>{selected?.content ?? <div className="tw-empty"><h2>Your next step is ready to plan.</h2><p>Adjust today’s plan to choose available learning work.</p></div>}</div>
      {activeId && <footer className="tw-work-footer">{currentSelected ? stepOptions : <><p>Your current step stays saved while you view this {selected?.status === 'completed' ? 'record' : 'task'}.</p><button type="button" className="tw-secondary" onClick={() => select(activeId)}>Return to current step<HomeIcon name="arrow" /></button></>}</footer>}
      {!activeId && selected?.kind !== 'summary' && summaryTask && <footer className="tw-work-footer"><button type="button" className="tw-secondary" onClick={() => select(summaryTask.id)}>Back to session summary<HomeIcon name="arrow"/></button></footer>}
    </section>
    {activeId && !currentSelected && <TodayContinueBar targetId="today-route-list" disabled={routeOpen}><button type="button" onClick={() => select(activeId)}>Return to current step<HomeIcon name="arrow" /></button></TodayContinueBar>}
    {activeId && currentSelected && currentAction && <TodayContinueBar targetId="today-active-task" disabled={routeOpen}>{currentAction}</TodayContinueBar>}
  </div><TodaySessionSupport data={support} onOpenRecord={id => { select(id); requestAnimationFrame(() => { headingRef.current?.focus({preventScroll:true}); headingRef.current?.scrollIntoView({block:'start'}); }); }}/></>;
}

function TodayContinueBar({ targetId, disabled, children }: { targetId: string; disabled: boolean; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);
  return <div className="tw-continuebar" data-visible={visible && !disabled} hidden={!visible || disabled}>{children}</div>;
}
