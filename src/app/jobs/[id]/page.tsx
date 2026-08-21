import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function displayDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date) : "Not provided";
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !process.env.DATABASE_URL) notFound();
  const job = await getJobById(id);
  if (!job) notFound();

  return (
    <main className="detail-page">
      <Link className="back-link" href="/">← All jobs</Link>
      <header className="detail-header">
        <p className="eyebrow">{job.company}</p>
        <h1>{job.title}</h1>
        <p className="lede">{job.location || "Location not specified"} · {job.remoteType.toLowerCase()}</p>
        <a className="primary-link" href={job.url} target="_blank" rel="noreferrer">Apply on company site ↗</a>
      </header>
      <section className="detail-grid">
        <article className="detail-card"><h2>Support assessment</h2>
          <div className="signals detail-signals"><span className="score">Support score: {job.supportScore}</span>{job.possibleSupport ? <span data-signal="possible">Possible international opportunity</span> : null}<span data-signal={job.visaSponsorship.toLowerCase()}>Visa: {job.visaSponsorship}</span><span data-signal={job.relocationSupport.toLowerCase()}>Relocation: {job.relocationSupport}</span><span>Confidence: {Math.round(job.confidence * 100)}%</span></div>
          <h3>Evidence from the listing</h3>
          {job.evidence.length ? <ul>{job.evidence.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No explicit support wording was found.</p>}
          {job.possibleEvidence.length ? <><h3>Why this is marked possible</h3><ul>{job.possibleEvidence.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        </article>
        <aside className="detail-card facts"><h2>Job facts</h2><dl>
          <div><dt>Role family</dt><dd>{job.roleFamily.replaceAll("_", " ")}</dd></div>
          <div><dt>Seniority</dt><dd>{job.seniority.toLowerCase()}</dd></div>
          <div><dt>Country</dt><dd>{job.countryCode || "Unknown"}</dd></div>
          <div><dt>Posted</dt><dd>{displayDate(job.postedAt)}</dd></div>
          <div><dt>First discovered</dt><dd>{displayDate(job.firstSeenAt)}</dd></div>
          <div><dt>Status</dt><dd>{job.status.toLowerCase()}</dd></div>
          <div><dt>Application link</dt><dd>{job.linkStatus.toLowerCase()}</dd></div>
        </dl></aside>
      </section>
      <section className="description"><h2>Job description</h2><div>{job.descriptionText}</div></section>
    </main>
  );
}
