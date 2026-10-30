-- Correct two Advanced 7–9 homographs whose initial glosses followed the wrong reading.
-- Keep migration 0053 immutable; this patch applies to both fresh and staged databases.
UPDATE catalog_search_index
SET meaning='in order; in sequence; close to; adjacent to',
    search_english='inorder;insequence;closeto;adjacentto',
    search_text='挨挨 ai inorder;insequence;closeto;adjacentto'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.05401.v1';

UPDATE catalog_search_index
SET meaning='to irritate the nose; to choke on smoke or a strong smell; pungent',
    search_english='toirritatethenose;tochokeonsmokeorastrongsmell;pungent',
    search_text='呛嗆 qiang toirritatethenose;tochokeonsmokeorastrongsmell;pungent'
WHERE release_id='hsk3-hsk123456789-2025-v11' AND id='hsk2025.word.l7.08659.v1';
