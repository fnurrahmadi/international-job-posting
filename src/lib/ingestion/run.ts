import { fetchCompanyJobs } from "@/lib/ats";
import { closeMissingSourceJobs, finishIngestionRun, saveCompanyJobs, startIngestionRun } from "@/lib/db/repository";
import { normalizeJob } from "@/lib/jobs/normalize";
import { classifyRole, classifySeniority } from "@/lib/jobs/role-classifier";
import { classifySponsorship } from "@/lib/jobs/sponsorship-classifier";
import type { CompanyConfig, JobClassification } from "@/lib/jobs/types";

async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
}

export async function runIngestion(companies: CompanyConfig[], concurrency = 4) {
  const runId = await startIngestionRun(companies.length);
  const errors: Array<{ company: string; error: string }> = [];
  let companiesSucceeded = 0;
  let jobsFetched = 0;
  let jobsRelevant = 0;

  await mapLimit(companies, Math.max(1, Math.min(concurrency, 10)), async (company) => {
    try {
      const rawJobs = await fetchCompanyJobs(company);
      const relevant = rawJobs.flatMap((raw) => {
        const role = classifyRole(raw.title);
        if (!role) return [];
        const job = normalizeJob(raw);
        const sponsorship = classifySponsorship(job.descriptionText);
        const classification: JobClassification = {
          roleFamily: role.roleFamily,
          seniority: classifySeniority(job.title),
          ...sponsorship,
          confidence: Math.min(role.score, sponsorship.confidence),
        };
        return [{ job, classification }];
      });
      if (company.atsType === "workable") {
        const byCompany = new Map<string, typeof relevant>();
        for (const row of relevant) {
          const key = `${row.job.company.atsType}:${row.job.company.identifier}`;
          const group = byCompany.get(key) ?? [];
          group.push(row);
          byCompany.set(key, group);
        }
        for (const rows of byCompany.values()) await saveCompanyJobs(rows[0].job.company, rows);
        await closeMissingSourceJobs("workable", relevant.map(({ job }) => job.sourceJobId));
      } else {
        await saveCompanyJobs(company, relevant);
      }
      companiesSucceeded += 1;
      jobsFetched += rawJobs.length;
      jobsRelevant += relevant.length;
      console.log(`${company.name}: fetched ${rawJobs.length}, retained ${relevant.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ company: company.name, error: message });
      console.error(`${company.name}: ${message}`);
    }
  });

  const status = companiesSucceeded === companies.length ? "SUCCEEDED" : companiesSucceeded > 0 ? "PARTIAL" : "FAILED";
  await finishIngestionRun(runId, { status, companiesSucceeded, jobsFetched, jobsRelevant, errors });
  return { runId, status, companiesSucceeded, jobsFetched, jobsRelevant, errors };
}
