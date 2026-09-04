-- Stage C/D/E: public discovery metadata and one real published launch article.
ALTER TABLE blog_posts ADD COLUMN category TEXT NOT NULL DEFAULT 'Study Guides';
ALTER TABLE blog_posts ADD COLUMN hsk_level INTEGER CHECK (hsk_level IS NULL OR (hsk_level BETWEEN 1 AND 9));

CREATE INDEX IF NOT EXISTS idx_blog_posts_publication ON blog_posts(status, published_at DESC, published_version_number);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category, status, published_at DESC);

INSERT OR IGNORE INTO blog_posts(
  id, slug, title, excerpt, content_markdown, category, hsk_level,
  featured_image_key, featured_image_alt, status, revision, published_version_number,
  author_user_id, published_at, created_at, updated_at
) VALUES (
  'blog-hsk-daily-review-habit',
  'how-to-build-a-daily-hsk-review-habit',
  'How to Build a Daily HSK Review Habit That Actually Sticks',
  'A practical HSK 3.0 review routine for choosing the right workload, rating memory honestly, correcting mistakes, and keeping daily study sustainable.',
  '# How to Build a Daily HSK Review Habit That Actually Sticks

A useful HSK review habit is not a promise to study for an hour every day. It is a small, repeatable loop: see what is due, recall before revealing the answer, rate the memory honestly, fix real mistakes, and stop when the planned session is complete.

This guide uses HSK 3 as an example, but the routine works at every HSK 3.0 level.

## Start with a workload you can finish

Open **Today** and choose a task count that fits the time you really have. A short completed session is more useful than an ambitious queue you abandon halfway through.

| Available time | Suggested focus | Good stopping point |
| --- | --- | --- |
| 5 minutes | Due Review items | Finish the selected queue |
| 10 minutes | Review plus a few new words | Stop after one complete cycle |
| 15–20 minutes | Review, practice, then mistakes | Finish corrections before adding more |

Use the estimate as a budget, not a test. If recall is slow today, reduce the next session rather than rushing the answers.

## Recall before you reveal

For each word, pause long enough to retrieve its meaning, pronunciation, or use from memory. Then reveal the answer and compare it with what you actually remembered.

A good review prompt should make you do one clear action:

- recognise a Chinese word and recall its meaning;
- hear audio and identify the word;
- choose the right word in a sentence;
- produce the pronunciation or meaning without seeing it first.

Do not turn every card into a long study project. If one item exposes a bigger gap, rate it honestly and continue. You can repair the gap in practice or in the mistakes queue.

## Choose the memory rating honestly

The rating describes your recall **before** the answer appeared.

| Rating | Choose it when | What it tells the schedule |
| --- | --- | --- |
| Again | You did not recall it or answered incorrectly | Show it again soon |
| Hard | You recalled it slowly or with major uncertainty | Keep the next interval short |
| Good | You recalled it correctly with useful effort | Increase the interval normally |
| Easy | Recall was immediate and stable | Increase the interval more |

Avoid choosing Easy simply because the answer looks familiar after it is revealed. Familiarity is not the same as retrieval.

## Match the technique to the HSK task

At HSK 1–2, keep the prompt concrete. Say the word aloud, connect it to a simple image or action, and use one short example sentence.

At HSK 3–4, pay more attention to word combinations and sentence position. When two words seem similar, record the contrast that changes the correct choice.

At HSK 5–6, review words in context and notice register, collocation, and connector patterns. For reading errors, identify the exact phrase that changed the meaning.

At HSK 7–9, separate recognition from production. Advanced words may look familiar in an article but still be unavailable when you need to write or speak. Use focused practice for that gap.

Listening mistakes need a different repair: replay once without text, identify the sound or boundary you missed, then replay with the transcript. Reading mistakes should be traced to the word, grammar relation, or inference that caused the wrong answer.

## Correct mistakes as mistakes

The **Mistakes** page is not another generic review list. It is where you repair answers that were actually wrong.

For each mistake:

1. identify why the original answer failed;
2. retry without copying the previous answer;
3. read the explanation only after the retry;
4. continue until the correction is complete;
5. return to the mistake book when you want to inspect the remaining items.

A correction should update the learning record so Today reflects what is still due. If the same type of error repeats, choose a short focused practice set instead of adding many unrelated new words.

## Use a weekly check, not a daily guilt score

At the end of a session, look at what actually happened: completed items, accuracy, time spent, and remaining mistakes. One difficult day is normal. The useful signal is whether the queue is staying manageable across the week.

If due items grow for several days, lower the number of new words temporarily. If reviews feel consistently easy, keep the same daily rhythm and allow the schedule to lengthen naturally.

## Frequently asked questions

### Should I clear every due item every day?

Not necessarily. Choose a realistic amount and complete it carefully. A stable routine is better than rushing a large queue with inaccurate ratings.

### What if I keep choosing Again for the same word?

Open the word in context, compare it with similar words, and use a focused practice task. Repeating the identical prompt without understanding the confusion may not repair the memory.

### Can I use this routine on a phone?

Yes. Today, Review, and Mistakes are designed for short sessions. Keep the selected queue small enough to finish without switching tasks repeatedly.

### Is the memory rating an official HSK score?

No. It is scheduling input for your personal learning record. It does not predict or certify an official exam result.',
  'Study Guides', 3,
  NULL, NULL, 'published', 1, 1,
  'hskkit-editorial', '2026-09-04T14:25:00.000Z', '2026-09-04T14:25:00.000Z', '2026-09-04T14:25:00.000Z'
);

INSERT OR IGNORE INTO blog_post_versions(
  id, post_id, version_number, snapshot_json, created_by_user_id, created_at
)
SELECT
  'blog-hsk-daily-review-habit-v1', p.id, 1,
  json_object(
    'id', p.id,
    'slug', p.slug,
    'title', p.title,
    'excerpt', p.excerpt,
    'contentMarkdown', p.content_markdown,
    'category', p.category,
    'hskLevel', p.hsk_level,
    'status', p.status,
    'displayStatus', p.status,
    'revision', p.revision,
    'publishedVersionNumber', p.published_version_number,
    'pendingChanges', json('false'),
    'authorUserId', p.author_user_id,
    'publishedAt', p.published_at,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  ),
  p.author_user_id, p.created_at
FROM blog_posts p
WHERE p.id = 'blog-hsk-daily-review-habit';

INSERT OR IGNORE INTO blog_audit_logs(id, actor_user_id, actor_email, action, post_id, metadata_json, created_at)
VALUES(
  'blog-hsk-daily-review-habit-audit-v1',
  'hskkit-editorial',
  'editorial@hskkit.com',
  'publish',
  'blog-hsk-daily-review-habit',
  '{"source":"production launch migration","version":1}',
  '2026-09-04T14:25:00.000Z'
);
