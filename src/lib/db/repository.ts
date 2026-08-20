import { getSql } from "./client";
import type { CompanyConfig, JobClassification, NormalizedJob } from "@/lib/jobs/types";

export async function startIngestionRun(companiesAttempted: number): Promise<string> {
  const sql = getSql();
  const [run] = await sql<[{ id: string }]>`
    INSERT INTO ingestion_runs (companies_attempted) VALUES (${companiesAttempted}) RETURNING id::text
  `;
  return run.id;
}

export async function finishIngestionRun(runId: string, result: {
  status: "SUCCEEDED" | "PARTIAL" | "FAILED"; companiesSucceeded: number;
  jobsFetched: number; jobsRelevant: number; errors: Array<{ company: string; error: string }>;
}) {
  const sql = getSql();
  await sql`UPDATE ingestion_runs SET completed_at = NOW(), status = ${result.status},
    companies_succeeded = ${result.companiesSucceeded}, jobs_fetched = ${result.jobsFetched},
    jobs_relevant = ${result.jobsRelevant}, error_summary = ${sql.json(result.errors)} WHERE id = ${runId}`;
}

export async function saveCompanyJobs(company: CompanyConfig, rows: Array<{ job: NormalizedJob; classification: JobClassification }>) {
  const sql = getSql();
  await sql.begin(async (tx) => {
    const [savedCompany] = await tx<[{ id: string }]>`
      INSERT INTO companies (name, website, careers_url, ats_type, ats_identifier)
      VALUES (${company.name}, ${company.website ?? null}, ${company.careersUrl ?? null}, ${company.atsType}, ${company.identifier})
      ON CONFLICT (ats_type, ats_identifier) DO UPDATE SET name = EXCLUDED.name,
        website = EXCLUDED.website, careers_url = EXCLUDED.careers_url, updated_at = NOW()
      RETURNING id::text
    `;
    const seenIds: string[] = [];
    for (const { job, classification } of rows) {
      seenIds.push(job.sourceJobId);
      const [savedJob] = await tx<[{ id: string }]>`
        INSERT INTO jobs (company_id, source, source_job_id, title, description_html, description_text,
          location, country_code, remote_type, url, posted_at, content_hash, source_metadata)
        VALUES (${savedCompany.id}, ${job.source}, ${job.sourceJobId}, ${job.title}, ${job.descriptionHtml},
          ${job.descriptionText}, ${job.location}, ${job.countryCode}, ${job.remoteType}, ${job.url},
          ${job.postedAt}, ${job.contentHash}, ${tx.json(JSON.parse(JSON.stringify(job.metadata)))})
        ON CONFLICT (source, source_job_id) DO UPDATE SET title = EXCLUDED.title,
          description_html = EXCLUDED.description_html, description_text = EXCLUDED.description_text,
          location = EXCLUDED.location, country_code = EXCLUDED.country_code, remote_type = EXCLUDED.remote_type,
          url = EXCLUDED.url, posted_at = EXCLUDED.posted_at, content_hash = EXCLUDED.content_hash,
          source_metadata = EXCLUDED.source_metadata, last_seen_at = NOW(), status = 'ACTIVE'
        RETURNING id::text
      `;
      await tx`
        INSERT INTO job_classifications (job_id, role_family, seniority, visa_sponsorship,
          relocation_support, international_candidates, existing_work_authorization_required,
          confidence, evidence, classifier_version)
        VALUES (${savedJob.id}, ${classification.roleFamily}, ${classification.seniority},
          ${classification.visaSponsorship}, ${classification.relocationSupport},
          ${classification.internationalCandidates}, ${classification.existingWorkAuthorizationRequired},
          ${classification.confidence}, ${tx.json(classification.evidence)}, 'rules-v3')
        ON CONFLICT (job_id) DO UPDATE SET role_family = EXCLUDED.role_family,
          seniority = EXCLUDED.seniority, visa_sponsorship = EXCLUDED.visa_sponsorship,
          relocation_support = EXCLUDED.relocation_support,
          international_candidates = EXCLUDED.international_candidates,
          existing_work_authorization_required = EXCLUDED.existing_work_authorization_required,
          confidence = EXCLUDED.confidence, evidence = EXCLUDED.evidence,
          classifier_version = EXCLUDED.classifier_version, classified_at = NOW()
      `;
    }
    if (seenIds.length > 0) {
      await tx`UPDATE jobs SET status = 'CLOSED' WHERE company_id = ${savedCompany.id}
        AND source = ${company.atsType} AND source_job_id NOT IN ${tx(seenIds)}`;
    } else {
      await tx`UPDATE jobs SET status = 'CLOSED' WHERE company_id = ${savedCompany.id} AND source = ${company.atsType}`;
    }
  });
}

export async function closeMissingSourceJobs(source: string, seenIds: string[]) {
  const sql = getSql();
  if (seenIds.length > 0) {
    await sql`UPDATE jobs SET status = 'CLOSED' WHERE source = ${source} AND source_job_id NOT IN ${sql(seenIds)}`;
  } else {
    await sql`UPDATE jobs SET status = 'CLOSED' WHERE source = ${source}`;
  }
}
