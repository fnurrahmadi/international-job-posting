import { createHash } from "node:crypto";
import type { NormalizedJob, RawJob, RemoteType } from "./types";

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (_, entity: string) => {
      if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      return ENTITIES[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function remoteType(title: string, location: string, description: string): RemoteType {
  const text = `${title} ${location} ${description.slice(0, 800)}`;
  if (/\bhybrid\b/i.test(text)) return "HYBRID";
  if (/\b(?:fully )?remote\b|work from anywhere/i.test(text)) return "REMOTE";
  if (/\b(?:on[ -]?site|in office)\b/i.test(text)) return "ONSITE";
  return "UNKNOWN";
}

export function normalizeJob(raw: RawJob): NormalizedJob {
  const descriptionText = htmlToText(raw.descriptionHtml);
  return {
    ...raw,
    title: raw.title.trim().replace(/\s+/g, " "),
    location: raw.location.trim().replace(/\s+/g, " "),
    descriptionText,
    countryCode: null,
    remoteType: remoteType(raw.title, raw.location, descriptionText),
    contentHash: createHash("sha256").update(`${raw.title}\n${raw.location}\n${descriptionText}`).digest("hex"),
  };
}
