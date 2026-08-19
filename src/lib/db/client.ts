import postgres from "postgres";

const globalForDb = globalThis as unknown as { relocateSql?: ReturnType<typeof postgres> };

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  if (!globalForDb.relocateSql) {
    globalForDb.relocateSql = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 5 : 2,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }
  return globalForDb.relocateSql;
}
