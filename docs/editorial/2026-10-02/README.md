# HSKKit editorial release — 2026-10-02

Three English posts were published directly into the production `hskkit-learning` D1 blog tables. Their source Markdown, metadata, and original WebP artwork are preserved here. This is a **content release**, not a Workers code deployment.

## Public URLs

- https://hskkit.com/blog/hsk-1-2-first-graded-reader
- https://hskkit.com/blog/hsk-handwriting-paper-computer-guide
- https://hskkit.com/blog/hsk6-fluency-real-life-self-test

Image objects in `hskkit-blog-media`:

- `blog/20261002/hsk-1-2-first-graded-reader.webp`
- `blog/20261002/hsk-handwriting-paper-computer-guide.webp`
- `blog/20261002/hsk6-fluency-real-life-self-test.webp`

Blog post IDs follow `blog-{slug}-20261002`. Version 1 is the original publication; the HSK 6 post has version 2 to correct a nested Markdown-emphasis rendering problem. The current authoritative copy of each article is the `.md` file here. Remote D1 versions and audit logs are retained independently.

## Production acceptance

All three detail pages returned HTTP 200 with the expected heading, article body, canonical URL, image/webp, blog-list appearance, and sitemap inclusion, three consecutive checks. Browser inspection confirmed each unique hero image loaded. No Workers deployment was needed. Acceptance preceded creation of the rollback label.

## Operational rollback (requires a separate authorized production action)

**Git tag alone does not revert D1 or R2.** To withdraw this release, first check whether any of these three posts have received later edits (compare current revision and published version with the baseline below), then archive only these three posts via an authorized database change. Expected baseline: first and second posts `revision=1`, `published_version_number=1`; HSK 6 post `revision=2`, `published_version_number=2`. Do not run a blind rollback after later editorial changes. A draft state excludes these posts from the public blog query; keep version history and audit logs for recovery. R2 images may remain unused and should not be deleted without a separate decision.

If the baseline still matches, update each `blog_posts` row with `status='draft'`, `published_version_number=NULL`, `published_at=NULL`, `revision=revision+1`, and a fresh `updated_at`. Add an audit event for withdrawal. Confirm all three pages no longer display the posts, the blog index and sitemap no longer include them, and other posts still work. Reverse the change by re-publishing the corresponding stored version snapshots through the editorial workflow. The separate SQL template `rollback.sql` documents the narrowly scoped conditions; **do not run it as part of release acceptance**.
