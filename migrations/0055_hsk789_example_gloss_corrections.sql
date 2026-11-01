-- Align four reviewed advanced glosses with the active catalog and syllabus POS.
-- Preserve migration 0053; update both existing and fresh search databases.

UPDATE catalog_search_index
SET meaning='overbearing; domineering',
    search_english='overbearing;domineering',
    search_text='霸道霸道 badao overbearing;domineering'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.05448.v1';

UPDATE catalog_search_index
SET meaning='dialectical; to investigate through reasoning',
    search_english='dialectical;toinvestigatethroughreasoning',
    search_text='辩证辯證 bianzheng dialectical;toinvestigatethroughreasoning'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.05629.v1';

UPDATE catalog_search_index
SET meaning='to mark; to label; to indicate',
    search_english='tomark;tolabel;toindicate',
    search_text='标標 biao tomark;tolabel;toindicate'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.05631.v1';

UPDATE catalog_search_index
SET meaning='beautiful; pretty; good-looking',
    search_english='beautiful;pretty;goodlooking',
    search_text='标致標致 biaozhi beautiful;pretty;goodlooking'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.05641.v1';
