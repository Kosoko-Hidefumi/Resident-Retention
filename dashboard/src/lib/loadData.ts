import Papa from "papaparse";
import type { TermSummaryRow, UniversityRow } from "../types";

function parseCsv<T extends object>(text: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: (e: Error) => reject(e),
    });
  });
}

export async function loadTermSummary(): Promise<TermSummaryRow[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/term_summary.csv`);
  if (!res.ok) throw new Error(`${res.status} term_summary.csv`);
  return parseCsv<TermSummaryRow>(await res.text());
}

export async function loadUniversityPct(): Promise<UniversityRow[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/term_university_origin_pct.csv`);
  if (!res.ok) throw new Error(`${res.status} term_university_origin_pct.csv`);
  return parseCsv<UniversityRow>(await res.text());
}
