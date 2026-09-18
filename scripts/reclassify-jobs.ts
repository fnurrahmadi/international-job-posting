import { getSql } from "../src/lib/db/client";
import { classifyRole, classifySeniority } from "../src/lib/jobs/role-classifier";
import { classifySponsorship, SPONSORSHIP_CLASSIFIER_VERSION } from "../src/lib/jobs/sponsorship-classifier";
import { calculateSupportScore } from "../src/lib/jobs/support-score";
import { assessLanguage } from "../src/lib/jobs/language-intelligence";
import { assessPermitFeasibility, PERMIT_RULE_VERSION } from "../src/lib/jobs/permit-feasibility";
import { extractSalary } from "../src/lib/jobs/salary-intelligence";

async function main() {
  const sql = getSql();
  const jobs = await sql<Array<{ id: string; title: string; descriptionText: string; countryCode: string | null }>>`
    SELECT id::text, title, description_text AS "descriptionText", country_code AS "countryCode"
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
    const sponsorship = classifySponsorship(`${job.title}. ${job.descriptionText}`);
    const salary = extractSalary(`${job.title}. ${job.descriptionText}`);
    const language = assessLanguage(job.descriptionText, job.countryCode);
    const permit = assessPermitFeasibility({ countryCode: job.countryCode, roleFamily: role.roleFamily, salary,
      visaSupport: sponsorship.visaSponsorship, authorizationRequired: sponsorship.existingWorkAuthorizationRequired,
      relocationScope: sponsorship.relocationScope });
    const base = {
      roleFamily: role.roleFamily,
      seniority: classifySeniority(job.title),
      ...sponsorship,
      confidence: Math.min(role.score, sponsorship.confidence),
      roleMatchScore: role.score, ...language, ...permit,
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
        role_match_score = ${base.roleMatchScore}, relocation_confidence = ${base.relocationConfidence},
        visa_confidence = ${base.visaConfidence}, relocation_scope = ${base.relocationScope},
        permit_feasibility = ${base.permitFeasibility}, permit_pathway = ${base.permitPathway},
        permit_reason = ${base.permitReason}, permit_rule_version = ${PERMIT_RULE_VERSION}, non_eu_eligible = ${base.nonEuEligible},
        relocation_evidence = ${sql.json(base.relocationEvidence)}, visa_evidence = ${sql.json(base.visaEvidence)},
        english_speaking = ${base.englishSpeaking}, local_language_required = ${base.localLanguageRequired},
        language_requirements = ${sql.json(base.languageRequirements)},
        support_score = ${supportScore}, classifier_version = ${SPONSORSHIP_CLASSIFIER_VERSION},
        classified_at = NOW()
      WHERE job_id = ${job.id}
    `;
    await sql`UPDATE jobs SET salary_min = ${salary.salaryMin}, salary_max = ${salary.salaryMax},
      salary_currency = ${salary.salaryCurrency}, salary_period = ${salary.salaryPeriod} WHERE id = ${job.id}`;
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
