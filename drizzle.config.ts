import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.MYSQL_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
