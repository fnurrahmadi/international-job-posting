"use client";

import { useState, type FormEvent } from "react";
import type { RoleCategory } from "@/lib/jobs/types";

export function AlertForm({ supportFilter, roleCategory }: { supportFilter: "supported" | "visa" | "relocation" | "possible"; roleCategory: RoleCategory }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const response = await fetch("/api/alerts", { method: "POST", body: new FormData(event.currentTarget) });
    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <form className="alert-form" onSubmit={submit}>
      <input type="hidden" name="supportFilter" value={supportFilter} />
      <input type="hidden" name="roleCategory" value={roleCategory} />
      <div className="honeypot" aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      <label>Email<input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
      <label>Country (optional)<input name="countryCode" maxLength={2} placeholder="DE" aria-describedby="country-help" /></label>
      <button type="submit" disabled={status === "saving"}>{status === "saving" ? "Saving…" : "Save search"}</button>
      <p id="country-help" className="form-status" aria-live="polite">
        {status === "saved" ? "Saved. You’ll receive new matches after each daily ingestion." : status === "error" ? "Could not save this search. Please try again." : "Use a two-letter country code, or leave blank for everywhere."}
      </p>
    </form>
  );
}
