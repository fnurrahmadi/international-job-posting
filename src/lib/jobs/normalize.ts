import { createHash } from "node:crypto";
import type { NormalizedJob, RawJob, RemoteType } from "./types";
import { extractCountryCodes, extractEligibleCountryCodes, inferCountryCode } from "./location-intelligence";

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
  const heading = `${title} ${location}`;
  if (/\bhybrid\b/i.test(heading)) return "HYBRID";
  if (/\b(?:fully )?remote\b|work from anywhere/i.test(heading)) return "REMOTE";
  if (/\b(?:on[ -]?site|in office)\b/i.test(heading)) return "ONSITE";
  const details = description.slice(0, 2_000);
  if (/\bhybrid (?:role|position|model|working)\b|\bwork (?:in|from) (?:the )?office.{0,80}(?:days?|times?) per (?:week|month)/i.test(details)) return "HYBRID";
  if (/\b(?:fully |100% )?remote (?:role|position|work|within|across)\b|\bwork from anywhere\b/i.test(details)) return "REMOTE";
  if (/\b(?:on[ -]?site|office-based) (?:role|position|work)\b/i.test(details)) return "ONSITE";
  return "UNKNOWN";
}

export function normalizeJob(raw: RawJob): NormalizedJob {
  const descriptionText = htmlToText(raw.descriptionHtml);
  const location = raw.location.trim().replace(/\s+/g, " ");
  const locationCountryCodes = extractCountryCodes(location);
  const eligibleCountryCodes = extractEligibleCountryCodes(descriptionText);
  return {
    ...raw,
    title: raw.title.trim().replace(/\s+/g, " "),
    location,
    descriptionText,
    countryCode: inferCountryCode(location),
    remoteType: remoteType(raw.title, raw.location, descriptionText),
    metadata: { ...raw.metadata, locationCountryCodes, eligibleCountryCodes },
    contentHash: createHash("sha256").update(`${raw.title}\n${raw.location}\n${descriptionText}`).digest("hex"),
  };
}
