import { getPendingAlerts, recordAlertDelivery } from "./repository";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function sendPendingAlerts() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  const appUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (!apiKey || !from) {
    console.log("Alerts skipped: RESEND_API_KEY and ALERT_FROM_EMAIL are not both configured.");
    return { sent: 0, skipped: true };
  }

  const searches = await getPendingAlerts();
  let sent = 0;
  for (const search of searches) {
    if (search.jobs.length === 0) continue;
    const items = search.jobs.slice(0, 25).map((job) =>
      `<li><a href="${appUrl}/jobs/${job.id}">${escapeHtml(job.title)}</a> at ${escapeHtml(job.company)} — ${escapeHtml(job.location || "Location not specified")}</li>`).join("");
    const unsubscribeUrl = `${appUrl}/api/alerts/unsubscribe?token=${encodeURIComponent(search.unsubscribeToken)}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `saved-search-${search.id}-${new Date().toISOString().slice(0, 10)}` },
      body: JSON.stringify({
        from, to: [search.email], subject: `${search.jobs.length} new international job match${search.jobs.length === 1 ? "" : "es"}`,
        html: `<h1>New job matches</h1><ul>${items}</ul><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
      }),
    });
    if (!response.ok) throw new Error(`Resend rejected alert ${search.id}: ${response.status} ${await response.text()}`);
    await recordAlertDelivery(search.id, search.jobs.map((job) => job.id));
    sent += 1;
  }
  return { sent, skipped: false };
}
