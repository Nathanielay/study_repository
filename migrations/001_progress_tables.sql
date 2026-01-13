-- Progress-related tables for word learning

CREATE TABLE IF NOT EXISTS user_book_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  current_word_rank INT NOT NULL DEFAULT 0,
  learned_count INT NOT NULL DEFAULT 0,
  last_word_id VARCHAR(64) NULL,
  last_learned_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_book (user_id, book_id),
  INDEX idx_progress_user (user_id),
  INDEX idx_progress_book (book_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_recent_learning (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  last_word_id VARCHAR(64) NOT NULL,
  last_word_rank INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_recent_user (user_id),
  INDEX idx_recent_book (book_id),
  CONSTRAINT fk_recent_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_word_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id int NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  word_id VARCHAR(64) NOT NULL,
  word_rank INT NOT NULL DEFAULT 0,
  learned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_user (user_id),
  INDEX idx_history_book (book_id),
  INDEX idx_history_word (word_id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES `User`(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
