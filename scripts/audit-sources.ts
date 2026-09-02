import { fetchCompanyJobs } from "../src/lib/ats";
import { loadCompanies } from "../src/lib/config/companies";
import { normalizeJob } from "../src/lib/jobs/normalize";
import { classifyRole } from "../src/lib/jobs/role-classifier";
import { classifySponsorship } from "../src/lib/jobs/sponsorship-classifier";
import type { CompanyConfig } from "../src/lib/jobs/types";

interface AuditRow {
  company: string;
  ats: string;
  fetched: number;
  relevant: number;
  visa: number;
  relocation: number;
  supported: number;
  error: string;
}

async function audit(company: CompanyConfig): Promise<AuditRow> {
  try {
    const jobs = await fetchCompanyJobs(company);
    const relevant = jobs.filter((job) => classifyRole(job.title, normalizeJob(job).descriptionText));
    const signals = relevant.map((job) => {
      const normalized = normalizeJob(job);
      return classifySponsorship(`${normalized.title}. ${normalized.descriptionText}`);
    });
    return {
      company: company.name,
      ats: company.atsType,
      fetched: jobs.length,
      relevant: relevant.length,
      visa: signals.filter((signal) => signal.visaSponsorship === "YES").length,
      relocation: signals.filter((signal) => signal.relocationSupport === "YES").length,
      supported: signals.filter((signal) => signal.visaSponsorship === "YES" || signal.relocationSupport === "YES").length,
      error: "",
    };
  } catch (error) {
    return {
      company: company.name,
      ats: company.atsType,
      fetched: 0,
      relevant: 0,
      visa: 0,
      relocation: 0,
      supported: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

async function main() {
  const companies = await loadCompanies();
  const rows = await mapLimit(companies, 4, audit);
  console.table(rows);

  const totals = rows.reduce((sum, row) => ({
    fetched: sum.fetched + row.fetched,
    relevant: sum.relevant + row.relevant,
    visa: sum.visa + row.visa,
    relocation: sum.relocation + row.relocation,
    supported: sum.supported + row.supported,
    failed: sum.failed + Number(Boolean(row.error)),
  }), { fetched: 0, relevant: 0, visa: 0, relocation: 0, supported: 0, failed: 0 });
  console.log("Totals", totals);

  if (process.argv.includes("--json")) console.log(JSON.stringify({ rows, totals }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
