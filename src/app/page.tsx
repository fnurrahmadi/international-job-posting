import { getDashboardStats, getRecentJobs, type SupportFilter } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const SUPPORT_FILTERS = new Set<SupportFilter>(["supported", "visa", "relocation", "all"]);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ support?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedFilter = Array.isArray(params.support) ? params.support[0] : params.support;
  const supportFilter: SupportFilter = requestedFilter && SUPPORT_FILTERS.has(requestedFilter as SupportFilter)
    ? requestedFilter as SupportFilter
    : "supported";
  const configured = Boolean(process.env.DATABASE_URL);
  const [stats, jobs] = configured
    ? await Promise.all([getDashboardStats(), getRecentJobs(20, supportFilter)])
    : [{ jobs: 0, companies: 0, sponsorPositive: 0 }, []];

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">International analytics opportunities</p>
        <h1>Jobs worth crossing borders for.</h1>
        <p className="lede">
          Fresh roles from company career pages, classified for visa sponsorship,
          relocation support, and analytics relevance.
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
            <label htmlFor="support">Immigration support</label>
            <div>
              <select id="support" name="support" defaultValue={supportFilter}>
                <option value="supported">Visa or relocation supported</option>
                <option value="visa">Visa supported</option>
                <option value="relocation">Relocation supported</option>
                <option value="all">All jobs, including unknown</option>
              </select>
              <button type="submit">Apply</button>
            </div>
          </form>
        </div>

        {!configured ? (
          <div className="empty">Connect a PostgreSQL database and run the ingestion command to load jobs.</div>
        ) : jobs.length === 0 ? (
          <div className="empty">No jobs match this support filter.</div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <a className="job" href={job.url} key={job.id} target="_blank" rel="noreferrer">
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.location || "Location not specified"}</p>
                </div>
                <div className="signals">
                  <span>{job.roleFamily.replaceAll("_", " ")}</span>
                  <span data-signal={job.visaSponsorship.toLowerCase()}>Visa: {job.visaSponsorship}</span>
                  <span data-signal={job.relocationSupport.toLowerCase()}>Relocation: {job.relocationSupport}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
