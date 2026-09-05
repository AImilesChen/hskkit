-- Keep production image descriptions aligned with the five updated photographic covers.
UPDATE blog_posts
SET featured_image_key = CASE slug
  WHEN 'is-chinese-hard-to-learn' THEN 'blog/visual-20260905/is-chinese-hard-to-learn.webp'
  WHEN 'chinese-pinyin-guide' THEN 'blog/visual-20260905/chinese-pinyin-guide.webp'
  WHEN 'how-to-memorize-chinese-characters' THEN 'blog/visual-20260905/how-to-memorize-chinese-characters.webp'
  WHEN 'how-to-prepare-for-the-hsk' THEN 'blog/visual-20260905/how-to-prepare-for-the-hsk.webp'
  WHEN 'common-chinese-learning-mistakes' THEN 'blog/visual-20260905/common-chinese-learning-mistakes.webp'
  ELSE featured_image_key
END,
featured_image_alt = CASE slug
  WHEN 'is-chinese-hard-to-learn' THEN 'Independent learner working through a difficult Chinese study session at a desk'
  WHEN 'chinese-pinyin-guide' THEN 'Learner wearing a headset practises the four Mandarin tones mā, má, mǎ, and mà'
  WHEN 'how-to-memorize-chinese-characters' THEN 'Physical Chinese character memory cards showing 想, xiǎng, and the mnemonic 木 plus 目 plus 心'
  WHEN 'how-to-prepare-for-the-hsk' THEN 'HSK learner reviewing notes beside a laptop and exam-preparation stationery'
  WHEN 'common-chinese-learning-mistakes' THEN 'Online language lesson with a teacher on screen and a learner taking correction notes'
  ELSE featured_image_alt
END,
updated_at = CURRENT_TIMESTAMP
WHERE slug IN (
  'is-chinese-hard-to-learn',
  'chinese-pinyin-guide',
  'how-to-memorize-chinese-characters',
  'how-to-prepare-for-the-hsk',
  'common-chinese-learning-mistakes'
);
