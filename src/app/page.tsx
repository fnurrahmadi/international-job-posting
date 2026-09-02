import { getDashboardStats, getRecentJobs, type SupportFilter } from "@/lib/db/queries";
import Link from "next/link";
import { AlertForm } from "@/components/alert-form";
import type { RoleCategory } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

const SUPPORT_FILTERS = new Set<SupportFilter>(["supported", "visa", "relocation", "possible", "all"]);
const ROLE_CATEGORIES = new Set<RoleCategory>(["analytics", "data_ml", "product"]);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ support?: string | string[]; role?: string | string[] }>;
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
  const configured = Boolean(process.env.DATABASE_URL);
  const [stats, jobs] = configured
    ? await Promise.all([getDashboardStats(roleCategory), getRecentJobs(20, supportFilter, roleCategory)])
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
            </select>
            <label htmlFor="support">Immigration support</label>
            <div>
              <select id="support" name="support" defaultValue={supportFilter}>
                <option value="supported">Visa or relocation supported</option>
                <option value="visa">Visa supported</option>
                <option value="relocation">Relocation supported</option>
                <option value="possible">Possible international opportunities</option>
                <option value="all">All jobs, including unknown</option>
              </select>
              <button type="submit">Apply</button>
            </div>
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
                  {job.possibleSupport ? <span data-signal="possible">Possible opportunity</span> : null}
                  <span>{job.roleFamily.replaceAll("_", " ")}</span>
                  <span data-signal={job.visaSponsorship.toLowerCase()}>Visa: {job.visaSponsorship}</span>
                  <span data-signal={job.relocationSupport.toLowerCase()}>Relocation: {job.relocationSupport}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {configured && supportFilter !== "all" ? (
        <section className="alerts">
          <div><p className="eyebrow">Daily alerts</p><h2>Save this search</h2><p className="muted">Get only newly discovered matches for the current role and support filters.</p></div>
          <AlertForm supportFilter={supportFilter} roleCategory={roleCategory} />
        </section>
      ) : null}
    </main>
  );
}
