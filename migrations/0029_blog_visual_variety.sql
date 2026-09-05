-- Publish five photographic covers as immutable version 2 snapshots.
-- The guarded update is replay-safe and will not overwrite later CMS edits.

UPDATE blog_posts
SET
  featured_image_key = CASE slug
    WHEN 'is-chinese-hard-to-learn' THEN 'blog/visual-20260905/is-chinese-hard-to-learn.webp'
    WHEN 'chinese-pinyin-guide' THEN 'blog/visual-20260905/chinese-pinyin-guide.webp'
    WHEN 'how-to-memorize-chinese-characters' THEN 'blog/visual-20260905/how-to-memorize-chinese-characters.webp'
    WHEN 'how-to-prepare-for-the-hsk' THEN 'blog/visual-20260905/how-to-prepare-for-the-hsk.webp'
    WHEN 'common-chinese-learning-mistakes' THEN 'blog/visual-20260905/common-chinese-learning-mistakes.webp'
  END,
  featured_image_alt = CASE slug
    WHEN 'is-chinese-hard-to-learn' THEN 'Independent learner working through a difficult Chinese study session at a desk'
    WHEN 'chinese-pinyin-guide' THEN 'Learner wearing a headset practises the four Mandarin tones mā, má, mǎ, and mà'
    WHEN 'how-to-memorize-chinese-characters' THEN 'Physical Chinese character memory cards showing 想, xiǎng, and the mnemonic 木 plus 目 plus 心'
    WHEN 'how-to-prepare-for-the-hsk' THEN 'HSK learner reviewing notes beside a laptop and exam-preparation stationery'
    WHEN 'common-chinese-learning-mistakes' THEN 'Online language lesson with a teacher on screen and a learner taking correction notes'
  END,
  revision = 2,
  published_version_number = 2,
  updated_at = '2026-09-05T03:15:00.000Z'
WHERE slug IN (
  'is-chinese-hard-to-learn',
  'chinese-pinyin-guide',
  'how-to-memorize-chinese-characters',
  'how-to-prepare-for-the-hsk',
  'common-chinese-learning-mistakes'
)
  AND status = 'published'
  AND revision = 1
  AND published_version_number = 1
  AND featured_image_key = 'blog/launch-20260904/' || slug || '.webp';

INSERT OR IGNORE INTO blog_post_versions(
  id,
  post_id,
  version_number,
  snapshot_json,
  created_by_user_id,
  created_at
)
SELECT
  p.id || '-v2',
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
  '2026-09-05T03:15:00.000Z'
FROM blog_posts p
WHERE p.slug IN (
  'is-chinese-hard-to-learn',
  'chinese-pinyin-guide',
  'how-to-memorize-chinese-characters',
  'how-to-prepare-for-the-hsk',
  'common-chinese-learning-mistakes'
)
  AND p.status = 'published'
  AND p.revision = 2
  AND p.published_version_number = 2
  AND p.featured_image_key = 'blog/visual-20260905/' || p.slug || '.webp';

INSERT OR IGNORE INTO blog_audit_logs(
  id,
  actor_user_id,
  actor_email,
  action,
  post_id,
  metadata_json,
  created_at
)
SELECT
  p.id || '-audit-v2',
  'hskkit-editorial',
  'editorial@hskkit.com',
  'publish',
  p.id,
  json_object('source', 'blog cover diversity release', 'version', 2, 'change', 'publish licensed photographic cover'),
  '2026-09-05T03:15:00.000Z'
FROM blog_posts p
WHERE p.slug IN (
  'is-chinese-hard-to-learn',
  'chinese-pinyin-guide',
  'how-to-memorize-chinese-characters',
  'how-to-prepare-for-the-hsk',
  'common-chinese-learning-mistakes'
)
  AND p.status = 'published'
  AND p.revision = 2
  AND p.published_version_number = 2
  AND p.featured_image_key = 'blog/visual-20260905/' || p.slug || '.webp';
