import { z } from "zod";
import type { CompanyConfig, RawJob } from "@/lib/jobs/types";
import { fetchJson } from "./http";

const locationSchema = z.object({
  name: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  country_code: z.string().nullish(),
}).passthrough();

const openQuestionSchema = z.object({
  body: z.string().default(""),
  kind: z.string().nullish(),
}).passthrough();

const offerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullish().transform((value) => value ?? ""),
  requirements: z.string().nullish().transform((value) => value ?? ""),
  careers_url: z.string().url(),
  published_at: z.string().nullish(),
  created_at: z.string().nullish(),
  location: z.string().default(""),
  city: z.string().nullish(),
  state_name: z.string().nullish(),
  country: z.string().nullish(),
  country_code: z.string().nullish(),
  remote: z.boolean().nullish(),
  hybrid: z.boolean().nullish(),
  on_site: z.boolean().nullish(),
  department: z.string().nullish(),
  employment_type_code: z.string().nullish(),
  locations: z.array(locationSchema).default([]),
  open_questions: z.array(openQuestionSchema).default([]),
}).passthrough();

const responseSchema = z.object({ offers: z.array(offerSchema) });

export async function fetchRecruitee(company: CompanyConfig): Promise<RawJob[]> {
  const url = `https://${encodeURIComponent(company.identifier)}.recruitee.com/api/offers/`;
  const data = responseSchema.parse(await fetchJson(url));

  return data.offers.map((offer) => {
    const applicationQuestions = offer.open_questions.map((question) => question.body).filter(Boolean);
    const descriptionHtml = [offer.description, offer.requirements, ...applicationQuestions].filter(Boolean).join("\n");
    const location = offer.location
      || [offer.city, offer.state_name, offer.country].filter(Boolean).join(", ")
      || offer.locations.map((item) => item.name).filter(Boolean).join("; ");

    return {
      source: "recruitee",
      sourceJobId: String(offer.id),
      company,
      title: offer.title,
      descriptionHtml,
      location,
      url: offer.careers_url,
      postedAt: offer.published_at || offer.created_at ? new Date(offer.published_at ?? offer.created_at!) : null,
      metadata: {
        countryCode: offer.country_code ?? null,
        remote: offer.remote ?? null,
        hybrid: offer.hybrid ?? null,
        onSite: offer.on_site ?? null,
        department: offer.department ?? null,
        employmentType: offer.employment_type_code ?? null,
        locations: offer.locations,
        applicationQuestionCount: offer.open_questions.length,
      },
    };
  });
}
