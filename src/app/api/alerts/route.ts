import { NextResponse } from "next/server";
import { z } from "zod";
import { saveAlert } from "@/lib/alerts/repository";

export const runtime = "nodejs";

const alertSchema = z.object({
  email: z.email(),
  supportFilter: z.enum(["supported", "visa", "relocation", "possible"]).default("supported"),
  roleCategory: z.enum(["analytics", "data_ml", "product", "strategy_ops"]).default("analytics"),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/).optional().or(z.literal("")),
  company: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const form = await request.formData();
  const parsed = alertSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and optional two-letter country code." }, { status: 400 });
  if (parsed.data.company) return NextResponse.json({ ok: true });
  await saveAlert(parsed.data.email, parsed.data.supportFilter, parsed.data.roleCategory, parsed.data.countryCode || undefined);
  return NextResponse.json({ ok: true });
}
