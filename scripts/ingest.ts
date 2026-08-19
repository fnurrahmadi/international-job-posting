import { loadCompanies } from "../src/lib/config/companies";
import { getSql } from "../src/lib/db/client";
import { runIngestion } from "../src/lib/ingestion/run";

async function main() {
  const companies = await loadCompanies();
  if (companies.length === 0) throw new Error("No enabled companies found in the companies configuration.");
  const concurrency = Number.parseInt(process.env.INGEST_CONCURRENCY ?? "4", 10);
  const result = await runIngestion(companies, concurrency);
  await getSql().end();
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "FAILED") process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  try { await getSql().end(); } catch { /* Database may not have initialized. */ }
  process.exitCode = 1;
});
