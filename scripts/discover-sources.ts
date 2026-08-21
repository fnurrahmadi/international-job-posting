import * as cheerio from "cheerio";
import { fetchCompanyJobs } from "../src/lib/ats";
import { fetchText } from "../src/lib/ats/http";
import { inferWorkdayFeedUrl } from "../src/lib/ats/workday";
import { normalizeJob } from "../src/lib/jobs/normalize";
import { classifyRole } from "../src/lib/jobs/role-classifier";
import type { AtsType, CompanyConfig } from "../src/lib/jobs/types";

interface Detection { atsType: AtsType; identifier: string; feedUrl?: string }

function detectFromUrl(value: string): Detection | null {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") return parts[0] ? { atsType: "greenhouse", identifier: parts[0] } : null;
  if (host === "jobs.lever.co") return parts[0] ? { atsType: "lever", identifier: parts[0] } : null;
  if (host === "jobs.ashbyhq.com") return parts[0] ? { atsType: "ashby", identifier: parts[0] } : null;
  if (host === "jobs.smartrecruiters.com") return parts[0] ? { atsType: "smartrecruiters", identifier: parts[0] } : null;
  if (host.endsWith(".recruitee.com")) return { atsType: "recruitee", identifier: host.split(".")[0] };
  if (host.endsWith(".teamtailor.com")) return { atsType: "teamtailor", identifier: host.split(".")[0] };
  if (host.includes("myworkdayjobs.com")) {
    const feedUrl = inferWorkdayFeedUrl(value);
    return { atsType: "workday", identifier: new URL(feedUrl).pathname.split("/")[3], feedUrl };
  }
  return null;
}

async function discover(careersUrl: string) {
  const direct = detectFromUrl(careersUrl);
  const html = await fetchText(careersUrl, 2, "text/html,application/xhtml+xml");
  const $ = cheerio.load(html);
  const candidates = new Map<string, Detection>();
  if (direct) candidates.set(`${direct.atsType}:${direct.identifier}`, direct);
  $("a[href], script[src], iframe[src]").each((_index, element) => {
    const value = $(element).attr("href") ?? $(element).attr("src");
    if (!value) return;
    try {
      const detection = detectFromUrl(new URL(value, careersUrl).toString());
      if (detection) candidates.set(`${detection.atsType}:${detection.identifier}`, detection);
    } catch { /* Ignore invalid embedded links. */ }
  });
  if (/attrax|jobs\.attrax/i.test(html)) candidates.set("attrax:career-page", { atsType: "attrax", identifier: new URL(careersUrl).hostname.split(".")[0] });

  const title = $("title").text().split(/[|–-]/)[0].replace(/careers?|jobs?/ig, "").trim();
  const name = title || new URL(careersUrl).hostname.replace(/^careers?\.|^jobs?\.|www\./g, "").split(".")[0];
  const results = [];
  for (const candidate of candidates.values()) {
    const config: CompanyConfig = { name, careersUrl, website: new URL(careersUrl).origin, ...candidate };
    try {
      const jobs = await fetchCompanyJobs(config);
      const relevant = jobs.filter((job) => classifyRole(job.title, normalizeJob(job).descriptionText));
      results.push({ valid: true, jobs: jobs.length, relevant: relevant.length, config });
    } catch (error) {
      results.push({ valid: false, jobs: 0, relevant: 0, config, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { careersUrl, detected: results.length, results };
}

async function main() {
  const urls = process.argv.slice(2).filter((argument) => argument !== "--");
  if (urls.length === 0) throw new Error("Usage: pnpm sources:discover -- <careers-url> [...]");
  for (const url of urls) console.log(JSON.stringify(await discover(url), null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
