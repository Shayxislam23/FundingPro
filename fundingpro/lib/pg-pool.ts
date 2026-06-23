import { Pool } from "pg";

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("LOCAL_DATABASE_URL or DATABASE_URL is required");
    }
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}

export function isLocalDatabaseEnabled(): boolean {
  const url = process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  return (
    process.env.USE_LOCAL_DATABASE === "true" ||
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes(":5433/")
  );
}
