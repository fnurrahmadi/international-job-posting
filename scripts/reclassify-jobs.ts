import { getSql } from "../src/lib/db/client";
import { classifyRole, classifySeniority } from "../src/lib/jobs/role-classifier";
import { classifySponsorship, SPONSORSHIP_CLASSIFIER_VERSION } from "../src/lib/jobs/sponsorship-classifier";
import { calculateSupportScore } from "../src/lib/jobs/support-score";

async function main() {
  const sql = getSql();
  const jobs = await sql<Array<{ id: string; title: string; descriptionText: string }>>`
    SELECT id::text, title, description_text AS "descriptionText"
    FROM jobs
    WHERE status = 'ACTIVE'
    ORDER BY id
  `;
  let updated = 0;
  let skipped = 0;

  for (const job of jobs) {
    const role = classifyRole(job.title, job.descriptionText);
    if (!role) {
      skipped += 1;
      continue;
    }
    const sponsorship = classifySponsorship(job.descriptionText);
    const base = {
      roleFamily: role.roleFamily,
      seniority: classifySeniority(job.title),
      ...sponsorship,
      confidence: Math.min(role.score, sponsorship.confidence),
    };
    const supportScore = calculateSupportScore(base).total;
    await sql`
      UPDATE job_classifications SET
        role_family = ${base.roleFamily}, seniority = ${base.seniority},
        visa_sponsorship = ${base.visaSponsorship}, relocation_support = ${base.relocationSupport},
        international_candidates = ${base.internationalCandidates},
        existing_work_authorization_required = ${base.existingWorkAuthorizationRequired},
        confidence = ${base.confidence}, evidence = ${sql.json(base.evidence)},
        possible_support = ${base.possibleSupport}, possible_evidence = ${sql.json(base.possibleEvidence)},
        support_score = ${supportScore}, classifier_version = ${SPONSORSHIP_CLASSIFIER_VERSION},
        classified_at = NOW()
      WHERE job_id = ${job.id}
    `;
    updated += 1;
  }

  console.log(JSON.stringify({ scanned: jobs.length, updated, skipped, classifier: SPONSORSHIP_CLASSIFIER_VERSION }));
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  try { await getSql().end(); } catch { /* Database may not have initialized. */ }
  process.exitCode = 1;
});
