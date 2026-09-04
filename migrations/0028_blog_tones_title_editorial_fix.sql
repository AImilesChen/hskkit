-- Correct the Chinese tones guide title after production editorial QA.
-- Preserve immutable version 1 and publish a version 2 snapshot.

UPDATE blog_posts
SET
  title = 'Chinese Tones Guide: Hear and Produce Mandarin Tones More Reliably',
  content_markdown = replace(
    content_markdown,
    '# Chinese Tones Guide: Hear and Produce Mandarin Tone More Reliably',
    '# Chinese Tones Guide: Hear and Produce Mandarin Tones More Reliably'
  ),
  revision = 2,
  published_version_number = 2,
  updated_at = '2026-09-04T17:08:29.000Z'
WHERE id = 'blog-chinese-tones-guide'
  AND revision = 1;

INSERT OR IGNORE INTO blog_post_versions(
  id,
  post_id,
  version_number,
  snapshot_json,
  created_by_user_id,
  created_at
)
SELECT
  'blog-chinese-tones-guide-v2',
  p.id,
  2,
  json_object(
    'id', p.id,
    'slug', p.slug,
    'title', p.title,
    'excerpt', p.excerpt,
    'contentMarkdown', p.content_markdown,
    'category', p.category,
    'hskLevel', p.hsk_level,
    'featuredImageKey', p.featured_image_key,
    'featuredImageAlt', p.featured_image_alt,
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
  p.author_user_id,
  '2026-09-04T17:08:29.000Z'
FROM blog_posts p
WHERE p.id = 'blog-chinese-tones-guide'
  AND p.revision = 2;

INSERT OR IGNORE INTO blog_audit_logs(
  id,
  actor_user_id,
  actor_email,
  action,
  post_id,
  metadata_json,
  created_at
)
VALUES(
  'blog-chinese-tones-guide-audit-v2',
  'hskkit-editorial',
  'editorial@hskkit.com',
  'publish',
  'blog-chinese-tones-guide',
  '{"source":"production editorial QA","version":2,"change":"pluralize tones in title"}',
  '2026-09-04T17:08:29.000Z'
);
