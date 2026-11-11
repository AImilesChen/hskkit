export type WorkspaceItem = {
  id: string;
  kind: 'review' | 'learn' | 'listen' | 'practice' | 'summary';
  status: 'pending' | 'completed' | 'skipped';
  estimatedMinutes?: number;
  deferred?: boolean;
  isContinuing?: boolean;
  contentId?: string;
  contentVersion?: string;
  dimension?: string;
  title?: string;
  learnContent?: { hanzi: string; pinyin: string; meaning: string; audioSrc?: string };
  learnCheck?: { attempts: number; firstTryCorrect: boolean };
};
export type WorkspacePracticeInfo = { contentId: string; version: string; count: number };

export function todayTaskPreview(items: readonly WorkspaceItem[], item: WorkspaceItem, practiceInfo: readonly WorkspacePracticeInfo[] = []) {
  const visible = items.filter(entry => !entry.deferred && (entry.kind === 'summary' || (entry.estimatedMinutes ?? 0) > 0));
  const index = visible.findIndex(entry => entry.id === item.id);
  const earlier = index < 0 ? [] : visible.slice(0, index).filter(entry => entry.kind !== 'summary' && entry.status === 'pending');
  const group = todayWorkspaceStages(visible.map((entry, position) => ({ item: entry, index: position }))).find(stage => stage.entries.some(entry => entry.item.id === item.id));
  const peers = group?.entries.map(entry => entry.item) ?? [item];
  const questionCount = item.kind === 'practice' ? practiceInfo.find(info => info.contentId === item.contentId && info.version === item.contentVersion)?.count : undefined;
  return {
    earlier: earlier.length,
    nextTitle: earlier[0]?.title,
    minutes: item.estimatedMinutes ?? 0,
    groupMinutes: peers.reduce((sum, entry) => sum + (entry.estimatedMinutes ?? 0), 0),
    groupTotal: peers.length,
    wordAudio: peers.filter(entry => entry.kind === 'listen' && entry.dimension === 'audio').length,
    contextAudio: peers.filter(entry => entry.kind === 'listen' && entry.dimension === 'context_audio').length,
    questionCount,
  };
}

export function todaySessionRecap(items: readonly WorkspaceItem[]) {
  const seen = new Set<string>();
  return items.flatMap(item => {
    if (item.kind !== 'learn' || item.status !== 'completed' || item.deferred || !item.learnContent) return [];
    const key = `${item.contentId ?? item.id}:${item.contentVersion ?? ''}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: item.id, ...item.learnContent, checked: Boolean(item.learnCheck), needsPractice: Boolean(item.learnCheck && (!item.learnCheck.firstTryCorrect || item.learnCheck.attempts > 1)) }];
  });
}

export function todayRecapHidden(active?: Pick<WorkspaceItem, 'kind' | 'id'>, memoryCheckOpen = false) {
  return Boolean(active && (active.kind !== 'learn' || memoryCheckOpen));
}
export type WorkspaceStageState = 'current' | 'completed' | 'finished' | 'later';

// Discard a record selection when the server advances the active step.
export function todayWorkspaceSelection<T extends Pick<WorkspaceItem, 'id' | 'status' | 'kind'>>(
  items: readonly T[], activeId?: string, selection?: { id: string; activeId?: string } | null,
) {
  const requested = selection && selection.activeId === activeId ? items.find(item => item.id === selection.id) : undefined;
  return requested ?? items.find(item => item.id === activeId)
    ?? items.find(item => item.kind === 'summary') ?? items[0];
}

export function todayWorkspaceStages<T extends WorkspaceItem>(entries: readonly { item: T; index: number }[], activeId?: string) {
  const groups: { key: string; kind: T['kind']; entries: { item: T; index: number }[] }[] = [];
  for (const entry of entries) {
    if (entry.item.deferred || (entry.item.kind !== 'summary' && (entry.item.estimatedMinutes ?? 0) <= 0)) continue;
    const last = groups.at(-1);
    // Consecutive groups preserve the server's actual order, including resumed work.
    if (last?.kind === entry.item.kind) last.entries.push(entry);
    else groups.push({ key: `${entry.item.kind}:${entry.item.id}`, kind: entry.item.kind, entries: [entry] });
  }
  return groups.map(group => {
    const items = group.entries.map(entry => entry.item);
    const completed = items.filter(item => item.status === 'completed').length;
    const moved = items.filter(item => item.status === 'skipped').length;
    const pending = items.filter(item => item.status === 'pending');
    const state: WorkspaceStageState = pending.some(item => item.id === activeId) ? 'current'
      : completed === items.length ? 'completed' : pending.length === 0 ? 'finished' : 'later';
    return { ...group, completed, moved, total: items.length, remainingMinutes: pending.reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0), state };
  });
}
export const todayStageCopy = {
  review: { title: 'Review', icon: 'review', unit: 'cards' },
  learn: { title: 'Vocabulary', icon: 'book', unit: 'words' },
  listen: { title: 'Listening', icon: 'headphones', unit: 'checks' },
  practice: { title: 'Practice', icon: 'pencil', unit: 'tasks' },
  summary: { title: 'Today’s summary', icon: 'file', unit: 'summary' },
} as const;

export function todayWorkspaceWordLabel(items: readonly WorkspaceItem[]) {
  const words=items.filter(item=>item.kind==='learn'&&!item.deferred);
  const continuing=words.filter(item=>item.isContinuing).length;
  const fresh=words.length-continuing;
  if(!words.length)return 'No vocabulary steps planned';
  return [continuing ? `${continuing} continuing ${continuing===1?'word':'words'}` : '', fresh ? `${fresh} new ${fresh===1?'word':'words'}` : ''].filter(Boolean).join(' · ');
}
