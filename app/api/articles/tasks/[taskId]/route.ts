import { NextResponse } from 'next/server';
import { getArticleById, getArticleTaskById } from 'app/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { taskId: string } }
) {
  let taskId = Number(params.taskId);
  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  }

  let rows = await getArticleTaskById(taskId);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  let task = rows[0];
  let article = null;
  if (task.articleId) {
    let articleRows = await getArticleById(task.articleId);
    article = articleRows[0] ?? null;
  }

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
    error: task.error,
    articleId: task.articleId,
    article,
  });
}
