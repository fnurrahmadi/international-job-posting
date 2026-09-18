export interface SalaryData {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "YEAR" | "MONTH" | "HOUR" | null;
}

function amount(value: string, suffix?: string) {
  const number = Number(value.replace(/[,.](?=\d{3}\b)/g, "").replace(",", "."));
  return suffix?.toLowerCase() === "k" ? number * 1_000 : number;
}

export function extractSalary(text: string): SalaryData {
  const pattern = /(?:\b(DKK|EUR)\b|([€]))\s*([\d.,]+)\s*(k)?(?:\s*(?:-|–|to)\s*(?:\b(?:DKK|EUR)\b|€)?\s*([\d.,]+)\s*(k)?)?\s*(?:\/|per\s+)?(year|annual(?:ly)?|month|monthly|hour|hourly)?/i;
  const match = text.match(pattern);
  if (!match) return { salaryMin: null, salaryMax: null, salaryCurrency: null, salaryPeriod: null };
  const salaryMin = amount(match[3], match[4]);
  const salaryMax = match[5] ? amount(match[5], match[6]) : salaryMin;
  const periodText = match[7]?.toLowerCase() ?? "";
  const salaryPeriod = /month/.test(periodText) ? "MONTH" : /hour/.test(periodText) ? "HOUR" : /year|annual/.test(periodText) ? "YEAR" : null;
  return { salaryMin, salaryMax, salaryCurrency: match[1]?.toUpperCase() || (match[2] ? "EUR" : null), salaryPeriod };
}
