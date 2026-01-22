import { drizzle } from 'drizzle-orm/mysql2';
import { and, eq, gt, sql } from 'drizzle-orm';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  books,
  userBookProgress,
  userRecentLearning,
  userWordHistory,
  users,
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
