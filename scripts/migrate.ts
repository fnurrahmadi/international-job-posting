import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getSql } from "../src/lib/db/client";

async function main() {
  const sql = getSql();
  const migration = await readFile(resolve("sql/001_initial.sql"), "utf8");
  await sql.unsafe(migration);
  await sql.end();
  console.log("Database migration complete.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
