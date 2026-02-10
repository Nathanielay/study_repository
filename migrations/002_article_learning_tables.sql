-- Article learning tables for scenario training

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  scene VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_en LONGTEXT NOT NULL,
  content_zh LONGTEXT NOT NULL,
  grammar_notes LONGTEXT NOT NULL,
  word_list JSON NOT NULL,
  manual_words JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_articles_scene (scene)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dictations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  article_id BIGINT NOT NULL,
  input_text LONGTEXT NOT NULL,
  normalized_text LONGTEXT NOT NULL,
  score INT NOT NULL,
  diff_json JSON NOT NULL,
  error_words JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dictations_article (article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS error_words (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  word VARCHAR(120) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  last_wrong_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_article_id BIGINT NULL,
  UNIQUE KEY uniq_user_word (user_id, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS review_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  article_id BIGINT NOT NULL,
  stage INT NOT NULL,
  reason VARCHAR(32) NOT NULL,
  next_review_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_queue_next (next_review_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS word_network_cache (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT NOT NULL,
  core_words JSON NOT NULL,
  items JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_word_network_article (article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
