import { fetchCompanyJobs } from "@/lib/ats";
import { closeMissingSourceJobs, finishIngestionRun, saveCompanyJobs, saveSourceResult, startIngestionRun } from "@/lib/db/repository";
import { normalizeJob } from "@/lib/jobs/normalize";
import { classifyRole, classifySeniority } from "@/lib/jobs/role-classifier";
import { classifySponsorship } from "@/lib/jobs/sponsorship-classifier";
import { calculateSupportScore } from "@/lib/jobs/support-score";
import type { CompanyConfig, JobClassification } from "@/lib/jobs/types";
import { assessLanguage } from "@/lib/jobs/language-intelligence";
import { assessPermitFeasibility } from "@/lib/jobs/permit-feasibility";

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
    const startedAt = Date.now();
    try {
      const rawJobs = await fetchCompanyJobs(company);
      const relevant = rawJobs.flatMap((raw) => {
        const job = normalizeJob(raw);
        const role = classifyRole(raw.title, job.descriptionText);
        if (!role) return [];
        const sponsorship = classifySponsorship(`${job.title}. ${job.descriptionText}`);
        const language = assessLanguage(job.descriptionText, job.countryCode);
        const permit = assessPermitFeasibility({
          countryCode: job.countryCode, roleFamily: role.roleFamily,
          salary: job, visaSupport: sponsorship.visaSponsorship,
          authorizationRequired: sponsorship.existingWorkAuthorizationRequired,
          relocationScope: sponsorship.relocationScope,
        });
        const baseClassification = {
          roleFamily: role.roleFamily,
          seniority: classifySeniority(job.title),
          ...sponsorship,
          confidence: Math.min(role.score, sponsorship.confidence),
          roleMatchScore: role.score,
          ...language,
          ...permit,
        };
        const classification: JobClassification = {
          ...baseClassification,
          supportScore: calculateSupportScore(baseClassification).total,
        };
        return [{ job, classification }];
      });
      if (company.atsType === "workable" || company.atsType === "arbeitnow" || company.atsType === "thehub") {
        const byCompany = new Map<string, typeof relevant>();
        for (const row of relevant) {
          const key = `${row.job.company.atsType}:${row.job.company.identifier}`;
          const group = byCompany.get(key) ?? [];
          group.push(row);
          byCompany.set(key, group);
        }
        for (const rows of byCompany.values()) await saveCompanyJobs(rows[0].job.company, rows);
        await closeMissingSourceJobs(company.atsType, relevant.map(({ job }) => job.sourceJobId));
      } else {
        await saveCompanyJobs(company, relevant);
      }
      companiesSucceeded += 1;
      jobsFetched += rawJobs.length;
      jobsRelevant += relevant.length;
      await saveSourceResult(runId, {
        sourceName: company.name,
        atsType: company.atsType,
        jobsFetched: rawJobs.length,
        jobsRelevant: relevant.length,
        supportedJobs: relevant.filter(({ classification }) =>
          classification.visaSponsorship === "YES" || classification.relocationSupport === "YES").length,
        durationMs: Date.now() - startedAt,
      });
      console.log(`${company.name}: fetched ${rawJobs.length}, retained ${relevant.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ company: company.name, error: message });
      await saveSourceResult(runId, {
        sourceName: company.name, atsType: company.atsType, jobsFetched: 0, jobsRelevant: 0,
        supportedJobs: 0, durationMs: Date.now() - startedAt, errorMessage: message,
      });
      console.error(`${company.name}: ${message}`);
    }
  });

  const status = companiesSucceeded === companies.length ? "SUCCEEDED" : companiesSucceeded > 0 ? "PARTIAL" : "FAILED";
  await finishIngestionRun(runId, { status, companiesSucceeded, jobsFetched, jobsRelevant, errors });
  return { runId, status, companiesSucceeded, jobsFetched, jobsRelevant, errors };
}
