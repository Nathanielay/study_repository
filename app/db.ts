import { drizzle } from 'drizzle-orm/mysql2';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  articles,
  articleTasks,
  books,
  dictations,
  errorWords,
  reviewQueue,
  userBookProgress,
  userRecentLearning,
  userWordHistory,
  users,
  wordNetworkCache,
  words,
} from 'drizzle/schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  let url = process.env.MYSQL_URL;
  if (!url) {
    throw new Error('MYSQL_URL is not set');
  }
  if (!db) {
    db = drizzle({ connection: url });
  }
  return db;
}


export async function getUser(email: string) {
  let normalized = String(email ?? '').trim().toLowerCase();
  let db = getDb();
  return await db.select().from(users).where(eq(users.email, normalized));
}

export async function getUserIdByEmail(email: string) {
  let normalized = String(email ?? '').trim().toLowerCase();
  try {
    let db = getDb();
    let result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));
    return result[0]?.id ?? null;
  } catch (err: any) {
    console.error('getUserIdByEmail failed', {
      email: normalized,
      code: err?.code,
      errno: err?.errno,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage,
      message: err?.message,
    });
    throw err;
  }
}

export async function createUser(email: string, password: string) {
  let normalized = String(email ?? '').trim().toLowerCase();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  let db = getDb();
  return await db.insert(users).values({ email: normalized, password: hash });
}

export async function updateUserPassword(email: string, password: string) {
  let normalized = String(email ?? '').trim().toLowerCase();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  let db = getDb();
  return await db
    .update(users)
    .set({ password: hash })
    .where(eq(users.email, normalized));
}

export async function getBooks() {
  let db = getDb();
  return await db
    .select({
      bookId: books.bookId,
      title: books.title,
      wordCount: books.wordCount,
      coverUrl: books.coverUrl,
      tags: books.tags,
    })
    .from(books)
    .orderBy(books.title);
}

export async function getBookById(bookId: string) {
  let db = getDb();
  return await db.select().from(books).where(eq(books.bookId, bookId));
}

export async function getWordById(wordId: string) {
  let db = getDb();
  return await db.select().from(words).where(eq(words.wordId, wordId));
}

export async function getWordsByBook(
  bookId: string,
  startRank: number,
  limit: number
) {
  let db = getDb();
  return await db
    .select({
      wordId: words.wordId,
      headWord: words.headWord,
      wordRank: words.wordRank,
      content: words.content,
    })
    .from(words)
    .where(and(eq(words.bookId, bookId), gt(words.wordRank, startRank)))
    .orderBy(words.wordRank)
    .limit(limit);
}

export async function getWordsSample(limit: number) {
  let db = getDb();
  return await db
    .select({
      headWord: words.headWord,
    })
    .from(words)
    .orderBy(words.wordRank)
    .limit(limit);
}

export async function createArticleTask(params: {
  userId?: number | null;
  scene: string;
  wordCount: number;
  manualWords: unknown;
}) {
  let db = getDb();
  let result = await db.insert(articleTasks).values({
    userId: params.userId ?? null,
    scene: params.scene,
    wordCount: params.wordCount,
    manualWords: params.manualWords,
    status: 'pending',
    createdAt: sql`NOW()`,
    updatedAt: sql`NOW()`,
  }).$returningId();
  return result[0]?.id ?? null;
}

export async function getArticleTaskById(taskId: number) {
  let db = getDb();
  return await db
    .select()
    .from(articleTasks)
    .where(eq(articleTasks.id, taskId));
}

export async function updateArticleTask(params: {
  taskId: number;
  status: string;
  error?: string | null;
  articleId?: number | null;
}) {
  let db = getDb();
  await db
    .update(articleTasks)
    .set({
      status: params.status,
      error: params.error ?? null,
      articleId: params.articleId ?? null,
      updatedAt: sql`NOW()`,
    })
    .where(eq(articleTasks.id, params.taskId));
}

export async function getRecentLearning(userId: number) {
  let db = getDb();
  return await db
    .select()
    .from(userRecentLearning)
    .where(eq(userRecentLearning.userId, userId));
}

export async function getProgress(userId: number, bookId: string) {
  let db = getDb();
  return await db
    .select()
    .from(userBookProgress)
    .where(and(eq(userBookProgress.userId, userId), eq(userBookProgress.bookId, bookId)));
}

export async function updateProgress(params: {
  userId: number;
  bookId: string;
  wordId: string;
  wordRank: number;
}) {
  let db = getDb();
  let existing = await getProgress(params.userId, params.bookId);
  let learnedCount = existing[0]?.learnedCount ?? 0;

  if (existing.length === 0) {
    await db.insert(userBookProgress).values({
      userId: params.userId,
      bookId: params.bookId,
      currentWordRank: params.wordRank,
      learnedCount: learnedCount + 1,
      lastWordId: params.wordId,
      lastLearnedAt: sql`NOW()`,
      createdAt: sql`NOW()`,
      updatedAt: sql`NOW()`,
    });
  } else {
    await db
      .update(userBookProgress)
      .set({
        currentWordRank: params.wordRank,
        learnedCount: learnedCount + 1,
        lastWordId: params.wordId,
        lastLearnedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(
        and(
          eq(userBookProgress.userId, params.userId),
          eq(userBookProgress.bookId, params.bookId)
        )
      );
  }

  await db
    .insert(userRecentLearning)
    .values({
      userId: params.userId,
      bookId: params.bookId,
      lastWordId: params.wordId,
      lastWordRank: params.wordRank,
      updatedAt: sql`NOW()`,
    })
    .onDuplicateKeyUpdate({
      set: {
        bookId: params.bookId,
        lastWordId: params.wordId,
        lastWordRank: params.wordRank,
        updatedAt: sql`NOW()`,
      },
    });

  await db.insert(userWordHistory).values({
    userId: params.userId,
    bookId: params.bookId,
    wordId: params.wordId,
    wordRank: params.wordRank,
    learnedAt: sql`NOW()`,
  });
}

export async function upsertBooks(items: Array<{
  bookId: string;
  title: string;
  wordCount: number;
  coverUrl: string;
  tags: unknown;
}>) {
  if (items.length === 0) return;
  let db = getDb();
  await db
    .insert(books)
    .values(items)
    .onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(title)`,
        wordCount: sql`VALUES(word_count)`,
        coverUrl: sql`VALUES(cover_url)`,
        tags: sql`VALUES(tags)`,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertWords(items: Array<{
  bookId: string;
  wordId: string;
  headWord: string;
  wordRank: number;
  content: unknown;
}>) {
  if (items.length === 0) return;
  let db = getDb();
  await db
    .insert(words)
    .values(items)
    .onDuplicateKeyUpdate({
      set: {
        bookId: sql`VALUES(book_id)`,
        headWord: sql`VALUES(head_word)`,
        wordRank: sql`VALUES(word_rank)`,
        content: sql`VALUES(content)`,
      },
    });
}

export async function pingDb() {
  let db = getDb();
  await db.execute(sql`select 1`);
}

export async function createArticle(params: {
  userId?: number | null;
  scene: string;
  title: string;
  contentEn: string;
  contentZh: string;
  grammarNotes: string;
  wordList: unknown;
  manualWords: unknown;
}) {
  let db = getDb();
  let result = await db.insert(articles).values({
    userId: params.userId ?? null,
    scene: params.scene,
    title: params.title,
    contentEn: params.contentEn,
    contentZh: params.contentZh,
    grammarNotes: params.grammarNotes,
    wordList: params.wordList,
    manualWords: params.manualWords,
    createdAt: sql`NOW()`,
  });
  let insertId = (result as { insertId?: number }).insertId ?? null;
  return insertId;
}

export async function getArticleById(articleId: number) {
  let db = getDb();
  return await db.select().from(articles).where(eq(articles.id, articleId));
}

export async function listArticles(limit = 50) {
  let db = getDb();
  return await db
    .select({
      id: articles.id,
      title: articles.title,
      scene: articles.scene,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(limit);
}

export async function createDictation(params: {
  userId?: number | null;
  articleId: number;
  inputText: string;
  normalizedText: string;
  score: number;
  diffJson: unknown;
  errorWords: unknown;
}) {
  let db = getDb();
  let result = await db.insert(dictations).values({
    userId: params.userId ?? null,
    articleId: params.articleId,
    inputText: params.inputText,
    normalizedText: params.normalizedText,
    score: params.score,
    diffJson: params.diffJson,
    errorWords: params.errorWords,
    createdAt: sql`NOW()`,
  });
  let insertId = (result as { insertId?: number }).insertId ?? null;
  return insertId;
}

export async function listErrorWords(userId?: number | null) {
  let db = getDb();
  if (userId) {
    return await db
      .select()
      .from(errorWords)
      .where(eq(errorWords.userId, userId))
      .orderBy(errorWords.lastWrongAt);
  }
  return await db
    .select()
    .from(errorWords)
    .orderBy(errorWords.lastWrongAt);
}

export async function upsertErrorWord(params: {
  userId?: number | null;
  word: string;
  sourceArticleId?: number | null;
}) {
  let db = getDb();
  await db
    .insert(errorWords)
    .values({
      userId: params.userId ?? null,
      word: params.word,
      count: 1,
      lastWrongAt: sql`NOW()`,
      sourceArticleId: params.sourceArticleId ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        count: sql`count + 1`,
        lastWrongAt: sql`NOW()`,
        sourceArticleId: params.sourceArticleId ?? null,
      },
    });
}

export async function getWordNetworkCache(articleId: number) {
  let db = getDb();
  return await db
    .select()
    .from(wordNetworkCache)
    .where(eq(wordNetworkCache.articleId, articleId));
}

export async function upsertWordNetworkCache(params: {
  articleId: number;
  coreWords: unknown;
  items: unknown;
}) {
  let db = getDb();
  await db
    .insert(wordNetworkCache)
    .values({
      articleId: params.articleId,
      coreWords: params.coreWords,
      items: params.items,
      createdAt: sql`NOW()`,
    })
    .onDuplicateKeyUpdate({
      set: {
        coreWords: params.coreWords,
        items: params.items,
        createdAt: sql`NOW()`,
      },
    });
}

export async function createReviewQueueItem(params: {
  userId?: number | null;
  articleId: number;
  stage: number;
  reason: string;
  nextReviewAt: Date;
}) {
  let db = getDb();
  await db.insert(reviewQueue).values({
    userId: params.userId ?? null,
    articleId: params.articleId,
    stage: params.stage,
    reason: params.reason,
    nextReviewAt: params.nextReviewAt,
    createdAt: sql`NOW()`,
  });
}

export async function getReviewQueue(userId?: number | null) {
  let db = getDb();
  if (userId) {
    return await db
      .select()
      .from(reviewQueue)
      .where(eq(reviewQueue.userId, userId))
      .orderBy(reviewQueue.nextReviewAt);
  }
  return await db
    .select()
    .from(reviewQueue)
    .orderBy(reviewQueue.nextReviewAt);
}
