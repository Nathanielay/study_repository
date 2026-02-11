const DEFAULT_MAX_CONCURRENCY = 2;
const DEFAULT_WAIT_TIMEOUT_MS = 30000;

let activeCount = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withConcurrencyLimit<T>(
  fn: () => Promise<T>,
  options?: { timeoutMs?: number }
) {
  const max =
    Number(process.env.LLM_CONCURRENCY ?? DEFAULT_MAX_CONCURRENCY) ||
    DEFAULT_MAX_CONCURRENCY;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const start = Date.now();

  while (activeCount >= max) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Concurrency limit exceeded');
    }
    await sleep(100);
  }

  activeCount += 1;
  try {
    return await fn();
  } finally {
    activeCount = Math.max(0, activeCount - 1);
  }
}
