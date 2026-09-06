-- D1 overload hardening for public dictionary and word/character lookups.
-- Additive only: no existing catalog rows or release metadata are changed.

CREATE INDEX IF NOT EXISTS idx_catalog_search_release_level_id
  ON catalog_search_index(release_id, level_band, id);

CREATE INDEX IF NOT EXISTS idx_catalog_search_release_pinyin_sort
  ON catalog_search_index(release_id, search_pinyin, sort_level, id);

CREATE TABLE IF NOT EXISTS catalog_character_positions (
  position INTEGER PRIMARY KEY CHECK(position BETWEEN 1 AND 64)
) WITHOUT ROWID;

INSERT OR IGNORE INTO catalog_character_positions(position) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),
  (17),(18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31),(32),
  (33),(34),(35),(36),(37),(38),(39),(40),(41),(42),(43),(44),(45),(46),(47),(48),
  (49),(50),(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),(61),(62),(63),(64);

CREATE TABLE IF NOT EXISTS catalog_character_words (
  release_id TEXT NOT NULL,
  character TEXT NOT NULL,
  word_id TEXT NOT NULL,
  sort_level INTEGER NOT NULL,
  PRIMARY KEY (release_id, character, word_id),
  FOREIGN KEY (release_id, word_id) REFERENCES catalog_search_index(release_id, id) ON DELETE CASCADE
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_catalog_character_words_release_character_sort
  ON catalog_character_words(release_id, character, sort_level, word_id);

INSERT OR IGNORE INTO catalog_character_words(release_id, character, word_id, sort_level)
SELECT i.release_id, substr(i.hanzi, p.position, 1), i.id, i.sort_level
FROM catalog_search_index i
JOIN catalog_character_positions p ON p.position <= length(i.hanzi);

CREATE TRIGGER catalog_character_words_after_insert
AFTER INSERT ON catalog_search_index
BEGIN
  INSERT OR IGNORE INTO catalog_character_words(release_id, character, word_id, sort_level)
  SELECT NEW.release_id, substr(NEW.hanzi, p.position, 1), NEW.id, NEW.sort_level
  FROM catalog_character_positions p
  WHERE p.position <= length(NEW.hanzi);
END;

CREATE TRIGGER catalog_character_words_after_delete
AFTER DELETE ON catalog_search_index
BEGIN
  DELETE FROM catalog_character_words
  WHERE release_id = OLD.release_id AND word_id = OLD.id;
END;

CREATE TRIGGER catalog_character_words_after_update
AFTER UPDATE OF release_id, id, hanzi, sort_level ON catalog_search_index
BEGIN
  DELETE FROM catalog_character_words
  WHERE release_id = OLD.release_id AND word_id = OLD.id;
  INSERT OR IGNORE INTO catalog_character_words(release_id, character, word_id, sort_level)
  SELECT NEW.release_id, substr(NEW.hanzi, p.position, 1), NEW.id, NEW.sort_level
  FROM catalog_character_positions p
  WHERE p.position <= length(NEW.hanzi);
END;
