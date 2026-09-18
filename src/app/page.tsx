import { getDashboardStats, getRecentJobs, type CountryFilter, type SupportFilter } from "@/lib/db/queries";
import Link from "next/link";
import { AlertForm } from "@/components/alert-form";
import type { RoleCategory } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

const SUPPORT_FILTERS = new Set<SupportFilter>(["supported", "visa", "relocation", "possible", "global", "non_eu", "eu_only", "permit", "no_sponsorship", "unknown", "english", "local_language", "all"]);
const COUNTRY_FILTERS = new Set<CountryFilter>(["all", "DK", "FI", "nordic"]);
const ALERT_FILTERS = new Set(["supported", "visa", "relocation", "possible"]);
const ROLE_CATEGORIES = new Set<RoleCategory>(["analytics", "data_ml", "product", "strategy_ops"]);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ support?: string | string[]; role?: string | string[]; country?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedFilter = Array.isArray(params.support) ? params.support[0] : params.support;
  const supportFilter: SupportFilter = requestedFilter && SUPPORT_FILTERS.has(requestedFilter as SupportFilter)
    ? requestedFilter as SupportFilter
    : "supported";
  const requestedRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const roleCategory: RoleCategory = requestedRole && ROLE_CATEGORIES.has(requestedRole as RoleCategory)
    ? requestedRole as RoleCategory
    : "analytics";
  const requestedCountry = Array.isArray(params.country) ? params.country[0] : params.country;
  const countryFilter: CountryFilter = requestedCountry && COUNTRY_FILTERS.has(requestedCountry as CountryFilter) ? requestedCountry as CountryFilter : "all";
  const configured = Boolean(process.env.DATABASE_URL);
  const [stats, jobs] = configured
    ? await Promise.all([getDashboardStats(roleCategory), getRecentJobs(20, supportFilter, roleCategory, countryFilter)])
    : [{ jobs: 0, companies: 0, sponsorPositive: 0 }, []];

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">International career opportunities</p>
        <h1>Jobs worth crossing borders for.</h1>
        <p className="lede">
          Fresh roles from company career pages, classified for visa sponsorship,
          relocation support, and role relevance.
        </p>
      </header>

      <section className="stats" aria-label="Job database summary">
        <article><strong>{stats.jobs}</strong><span>active jobs</span></article>
        <article><strong>{stats.companies}</strong><span>companies</span></article>
        <article><strong>{stats.sponsorPositive}</strong><span>sponsorship signals</span></article>
      </section>

      <section className="results">
        <div className="section-heading">
          <div><p className="eyebrow">Latest matches</p><h2>Recently discovered</h2></div>
          <form className="filter" method="get">
            <label htmlFor="role">Role category</label>
            <select id="role" name="role" defaultValue={roleCategory}>
              <option value="analytics">Analytics</option>
              <option value="data_ml">Data Science, Engineering &amp; ML</option>
              <option value="product">Product Management</option>
              <option value="strategy_ops">Strategy &amp; Business Operations</option>
            </select>
            <label htmlFor="support">Immigration support</label>
            <div>
              <select id="support" name="support" defaultValue={supportFilter}>
                <option value="supported">Visa or relocation supported</option>
                <option value="visa">Visa supported</option>
                <option value="relocation">Relocation supported</option>
                <option value="possible">Possible international opportunities</option>
                <option value="non_eu">Accessible from outside the EU</option>
                <option value="global">Global relocation</option>
                <option value="eu_only">EU/EEA-only relocation</option>
                <option value="permit">Permit feasible</option>
                <option value="no_sponsorship">No sponsorship</option>
                <option value="unknown">Unknown sponsorship</option>
                <option value="english">English-speaking roles</option>
                <option value="local_language">Local language required</option>
                <option value="all">All jobs, including unknown</option>
              </select>
              <button type="submit">Apply</button>
            </div>
            <label htmlFor="country">Market</label>
            <select id="country" name="country" defaultValue={countryFilter}>
              <option value="all">All countries</option><option value="nordic">Denmark &amp; Finland</option>
              <option value="DK">Denmark</option><option value="FI">Finland</option>
            </select>
          </form>
        </div>

        {!configured ? (
          <div className="empty">Connect a PostgreSQL database and run the ingestion command to load jobs.</div>
        ) : jobs.length === 0 ? (
          <div className="empty">No jobs match these role and support filters.</div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <Link className="job" href={`/jobs/${job.id}`} key={job.id}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.location || "Location not specified"}</p>
                  {job.evidence[0] ? <p className="evidence-preview">“{job.evidence[0]}”</p> : null}
                </div>
                <div className="signals">
                  <span className="score">Support score: {job.supportScore}</span>
                  <span className="score">Role match: {Math.round(job.roleMatchScore * 100)}%</span>
                  {job.possibleSupport ? <span data-signal="possible">Possible opportunity</span> : null}
                  <span>{job.roleFamily.replaceAll("_", " ")}</span>
                  <span data-signal={job.visaSponsorship.toLowerCase()}>Visa: {job.visaSponsorship}</span>
                  <span data-signal={job.relocationSupport.toLowerCase()}>Relocation: {job.relocationSupport}</span>
                  {job.relocationScope !== "UNKNOWN" ? <span>Scope: {job.relocationScope.replaceAll("_", " ")}</span> : null}
                  {job.permitFeasibility !== "UNKNOWN" ? <span data-signal={job.permitFeasibility === "LOW" ? "no" : "possible"}>Permit: {job.permitFeasibility}</span> : null}
                  <span data-signal={job.nonEuEligible.toLowerCase()}>Non-EU: {job.nonEuEligible}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {configured && ALERT_FILTERS.has(supportFilter) ? (
        <section className="alerts">
          <div><p className="eyebrow">Daily alerts</p><h2>Save this search</h2><p className="muted">Get only newly discovered matches for the current role and support filters.</p></div>
          <AlertForm supportFilter={supportFilter as "supported" | "visa" | "relocation" | "possible"} roleCategory={roleCategory} />
        </section>
      ) : null}
    </main>
  );
}
