import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build, transform } from 'esbuild';
import { addWordToReview, applyDailyItemAction, assertCurrentDailySession, assertTodayLearnItemMatches, emptyLearningState, type LearningState } from '../src/lib/learning/domain.ts';
import { todayContentByAssetId, todayMeaningCheck } from '../src/lib/learning/today-content.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: { contents: `export {getDictionaryWordsByIds, getDictionaryLearningContext} from './src/lib/dictionary/p2-server.ts';`, resolveDir: root, loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'],
  plugins: [{ name: 'server-marker', setup(builder) {
    builder.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'empty' }));
    builder.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'js' }));
  } }],
});
const module = { exports: {} as typeof import('../src/lib/dictionary/p2-server.ts') };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const dictionary = module.exports;

// Execute the route's actual mutation branch with fixture state, without HTTP,
// authentication or persistence. Keep its validation and review creation intact.
const route = await readFile(new URL('../src/app/api/v1/learning/route.ts', import.meta.url), 'utf8');
const branch = route.split('} else if (action === "complete_item" || action === "skip_item" || action === "restore_item") {')[1].split('} else if (action === "configure_today") {')[0];
assert.ok(branch);
const compiled = await transform(`async function complete(state, payload, key, deps) {
  ${route.match(/const short = [^\r\n]+/)![0]}
  const {applyDailyItemAction, assertTodayLearnItemMatches, assertCurrentDailySession, addWordToReview, todayMeaningCheck, getDictionaryLearningContext, getDictionaryWordsByIds, resolveTodayDictionaryItem} = deps;
  const action = 'complete_item', identity = {id:'fixture'}, tz = 0, capabilities = {dailyNewItems:10};
  const view = state => ({state,session:state.dailySessions[0]});
  let usageCharge;
  ${branch}
  return {state,usageCharge};
}`, { loader: 'ts', target: 'node22' });
const complete = new Function(`${compiled.code}; return complete;`)() as (state: LearningState, payload: Record<string, unknown>, key: string, deps: unknown) => Promise<{state: LearningState; usageCharge?: unknown}>;
const deps = {applyDailyItemAction, assertTodayLearnItemMatches, assertCurrentDailySession, addWordToReview, todayMeaningCheck, ...dictionary, resolveTodayDictionaryItem: todayContentByAssetId};
const ids = ['hsk3.word.l2.0371.v1', 'hsk3.word.l2.0370.v1', 'hsk2025.word.l2.0301.v1'];
function fixture() {
  const state = emptyLearningState();
  state.dailySessions.push({id:'day-fixture', ownerId:'fixture', localDay:'2026-11-12', ruleVersion:'today-v10', createdAt:'2026-11-12T08:00:00Z', items:ids.map(assetId => {
    const word = todayContentByAssetId(assetId)!;
    return {id:`learn:${assetId}`, kind:'learn' as const, contentId:word.contentId, contentVersion:word.contentVersion, status:'pending' as const, isContinuing:true};
  })});
  return state;
}
function payload(state: LearningState, assetId = ids[0]) {
  return {sessionId:state.dailySessions[0].id, itemId:`learn:${assetId}`, assetId, answer:todayMeaningCheck(todayContentByAssetId(assetId)!)!.correctAnswer, attempts:1};
}

test('retired green words and a current word complete in order and each create a scheduled review', async () => {
  assert.equal(await dictionary.getDictionaryLearningContext(ids[0]), null);
  let state = fixture();
  for (const [index, assetId] of ids.entries()) {
    const result = await complete(state, payload(state, assetId), `complete-${index}`, deps);
    state = result.state;
    assert.equal(state.dailySessions[0].items[index].status, 'completed');
    assert.equal(state.dailySessions[0].items[index].learnCheck?.firstTryCorrect, true);
    assert.equal(state.dailySessions[0].items.find(item => item.status === 'pending')?.id, ids[index + 1] ? `learn:${ids[index + 1]}` : undefined);
    assert.equal(state.cards.length, index + 1);
    assert.equal(state.cards[index].contentId, `word:${assetId}`);
    assert.equal(state.cards[index].intervalDays, 1);
    assert.equal(result.usageCharge, undefined);
  }
});

test('wrong answers, changed word versions and out-of-order submissions remain rejected without changing progress', async () => {
  const state = fixture();
  const before = JSON.stringify(state);
  await assert.rejects(complete(state, {...payload(state), answer:'A'}, 'wrong', deps), /TODAY_LEARN_CHECK_REQUIRED/);
  const changed = structuredClone(state);
  changed.dailySessions[0].items[0].contentVersion = 'different-version';
  await assert.rejects(complete(changed, payload(changed), 'version', deps), /TODAY_LEARN_WORD_MISMATCH/);
  await assert.rejects(complete(state, payload(state, ids[1]), 'order', deps), /ITEM_OUT_OF_ORDER/);
  assert.equal(JSON.stringify(state), before);
});

test('replaying a completed submission preserves its review card and progress', async () => {
  const state = fixture();
  const request = payload(state);
  const first = await complete(state, request, 'same-key', deps);
  const replay = await complete(first.state, request, 'same-key', deps);
  assert.deepEqual(replay.state, first.state);
});
