-- Manual, separately authorized D1 withdrawal TEMPLATE. NOT executed during release.
-- Preflight in production: confirm these are the only rows, with exactly the expected
-- revision and published_version_number; inspect for later editorial edits first.
SELECT slug, status, revision, published_version_number
FROM blog_posts
WHERE slug IN ('hsk-1-2-first-graded-reader',
               'hsk-handwriting-paper-computer-guide',
               'hsk6-fluency-real-life-self-test');

-- Only run after preflight. The WHERE clause prevents overwriting later edits.
-- Require exactly 3 changed rows; otherwise STOP and reconcile, do not retry blindly.
UPDATE blog_posts
SET status='draft', published_version_number=NULL, published_at=NULL,
    revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE status='published'
  AND ((slug IN ('hsk-1-2-first-graded-reader',
                       'hsk-handwriting-paper-computer-guide')
        AND revision=1 AND published_version_number=1)
    OR (slug='hsk6-fluency-real-life-self-test'
        AND revision=2 AND published_version_number=2));

-- Record a separate authorized withdrawal audit event with the actor and reason
-- according to the blog's production editorial audit workflow.
-- Verify the three public URLs, blog list, sitemap, and unaffected other posts.
