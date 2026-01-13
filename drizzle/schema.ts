import { sql } from 'drizzle-orm';
import { datetime, int, json, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('User', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 64 }),
  password: varchar('password', { length: 64 }),
});

export const books = mysqlTable('books', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 200 }).notNull(),
  wordCount: int('word_count').notNull(),
  coverUrl: varchar('cover_url', { length: 500 }).notNull(),
  bookId: varchar('book_id', { length: 120 }).notNull(),
  tags: json('tags').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`(now())`),
  updatedAt: datetime('updated_at').notNull().default(sql`(now())`),
});

export const words = mysqlTable('words', {
  id: int('id').primaryKey().autoincrement(),
  wordRank: int('word_rank').notNull(),
  headWord: varchar('head_word', { length: 120 }).notNull(),
  wordId: varchar('word_id', { length: 120 }).notNull(),
  bookId: varchar('book_id', { length: 120 }).notNull(),
  content: json('content').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`(now())`),
});

export const userBookProgress = mysqlTable('user_book_progress', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  bookId: varchar('book_id', { length: 64 }).notNull(),
  currentWordRank: int('current_word_rank').notNull().default(0),
  learnedCount: int('learned_count').notNull().default(0),
  lastWordId: varchar('last_word_id', { length: 64 }),
  lastLearnedAt: datetime('last_learned_at'),
  createdAt: datetime('created_at').notNull().default(sql`(now())`),
  updatedAt: datetime('updated_at').notNull().default(sql`(now())`),
});

export const userRecentLearning = mysqlTable('user_recent_learning', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  bookId: varchar('book_id', { length: 64 }).notNull(),
  lastWordId: varchar('last_word_id', { length: 64 }).notNull(),
  lastWordRank: int('last_word_rank').notNull().default(0),
  updatedAt: datetime('updated_at').notNull().default(sql`(now())`),
});

export const userWordHistory = mysqlTable('user_word_history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  bookId: varchar('book_id', { length: 64 }).notNull(),
  wordId: varchar('word_id', { length: 64 }).notNull(),
  wordRank: int('word_rank').notNull().default(0),
  learnedAt: datetime('learned_at').notNull().default(sql`(now())`),
});
