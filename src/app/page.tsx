import { getDashboardStats, getRecentJobs } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = Boolean(process.env.DATABASE_URL);
  const [stats, jobs] = configured
    ? await Promise.all([getDashboardStats(), getRecentJobs(20)])
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
          <span className="status">Updated daily</span>
        </div>

        {!configured ? (
          <div className="empty">Connect a PostgreSQL database and run the ingestion command to load jobs.</div>
        ) : jobs.length === 0 ? (
          <div className="empty">No active jobs yet. Run <code>pnpm ingest</code> to collect the first batch.</div>
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
