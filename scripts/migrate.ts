import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getSql } from "../src/lib/db/client";

async function main() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const migrationDir = resolve("sql");
  const files = (await readdir(migrationDir)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const [existing] = await sql`SELECT name FROM schema_migrations WHERE name = ${file}`;
    if (existing) continue;
    const migration = await readFile(resolve(migrationDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    console.log(`Applied ${file}`);
  }
  await sql.end();
  console.log("Database migration complete.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
