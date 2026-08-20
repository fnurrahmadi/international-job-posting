import { deactivateAlert } from "@/lib/alerts/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const removed = token ? await deactivateAlert(token) : false;
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>Job alerts</title><body style="font:18px system-ui;max-width:680px;margin:80px auto;padding:20px"><h1>${removed ? "Alerts stopped" : "Link not found"}</h1><p>${removed ? "You will no longer receive this saved search." : "This unsubscribe link is invalid or has already expired."}</p></body>`, {
    status: removed ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
