-- Remove machine-readable lexical sense markers from four HSK 3.0 display spellings.
-- The distinct sense rows and IDs remain unchanged.

UPDATE content_assets
SET hanzi = '称', traditional = '稱'
WHERE release_id = 'hsk3-content-truth-v5'
  AND id IN ('hsk3.word.l2.0062.v1', 'hsk3.word.l5.0101.v1')
  AND hanzi IN ('称1', '称2', '称¹', '称²');

UPDATE content_assets
SET hanzi = '面', traditional = '面'
WHERE release_id = 'hsk3-content-truth-v5'
  AND id = 'hsk3.word.l2.0377.v1'
  AND hanzi IN ('面1', '面¹');

UPDATE content_assets
SET hanzi = '面', traditional = '麵'
WHERE release_id = 'hsk3-content-truth-v5'
  AND id = 'hsk3.word.l2.0378.v1'
  AND hanzi IN ('面2', '面²');

UPDATE catalog_search_index
SET hanzi = '称', traditional = '稱', search_hanzi = '称稱', search_text = '称稱 ' || search_pinyin || ' ' || search_english
WHERE release_id = 'hsk3-content-truth-v5'
  AND id IN ('hsk3.word.l2.0062.v1', 'hsk3.word.l5.0101.v1')
  AND hanzi IN ('称1', '称2', '称¹', '称²');

UPDATE catalog_search_index
SET hanzi = '面', traditional = '面', search_hanzi = '面面', search_text = '面面 ' || search_pinyin || ' ' || search_english
WHERE release_id = 'hsk3-content-truth-v5'
  AND id = 'hsk3.word.l2.0377.v1'
  AND hanzi IN ('面1', '面¹');

UPDATE catalog_search_index
SET hanzi = '面', traditional = '麵', search_hanzi = '面麵', search_text = '面麵 ' || search_pinyin || ' ' || search_english
WHERE release_id = 'hsk3-content-truth-v5'
  AND id = 'hsk3.word.l2.0378.v1'
  AND hanzi IN ('面2', '面²');
