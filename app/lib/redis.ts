import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<void> | null = null;

function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || '';
}

export async function getRedisClient() {
  const url = getRedisUrl();
  if (!url) return null;
  if (!client) {
    client = createClient({ url });
    client.on('error', (err) => {
      console.error('redis error', err);
    });
  }
  if (!connecting) {
    connecting = client
      .connect()
      .then(() => undefined)
      .catch((err) => {
      console.error('redis connect failed', err);
      connecting = null;
      });
  }
  await connecting;
  return client;
}

export async function redisGetJson<T>(key: string) {
  const redis = await getRedisClient();
  if (!redis) return null;
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('redis json parse failed', err);
    return null;
  }
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
) {
  const redis = await getRedisClient();
  if (!redis) return;
  const payload = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.setEx(key, ttlSeconds, payload);
  } else {
    await redis.set(key, payload);
  }
}
