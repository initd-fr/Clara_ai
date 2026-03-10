import { Pool } from "pg";
export const PgRawPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
