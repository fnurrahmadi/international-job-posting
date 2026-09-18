import type { TernarySignal } from "./types";

export function assessLanguage(text: string, countryCode: string | null): {
  englishSpeaking: TernarySignal; localLanguageRequired: TernarySignal; languageRequirements: string[];
} {
  const segments = text.split(/(?<=[.!?])\s+|[\r\n]+/).map((value) => value.trim()).filter(Boolean);
  const english = segments.filter((value) => /(?:fluent|professional|working|excellent|proficient).*english|english.*(?:required|working language|fluency|proficiency)/i.test(value));
  const localName = countryCode === "DK" ? "Danish" : countryCode === "FI" ? "Finnish|Swedish" : null;
  const local = localName ? segments.filter((value) => new RegExp(`(?:fluent|professional|proficient|fluency|proficiency|required|must).{0,35}(?:${localName})|(?:${localName}).{0,35}(?:required|must|fluency|proficiency)`, "i").test(value)) : [];
  return {
    englishSpeaking: english.length ? "YES" : "UNKNOWN",
    localLanguageRequired: local.length ? "YES" : localName && english.some((value) => /only|working language/i.test(value)) ? "NO" : "UNKNOWN",
    languageRequirements: [...new Set([...english, ...local])].map((value) => value.slice(0, 240)).slice(0, 5),
  };
}
