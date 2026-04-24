import Papa from "papaparse";
import type { TermSummaryRow, UniversityRow } from "../types";

const base = `${import.meta.env.BASE_URL}data/`;

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
  let res = await fetch(`${base}term_summary.json`);
  if (res.ok) {
    return (await res.json()) as TermSummaryRow[];
  }
  res = await fetch(`${base}term_summary.csv`);
  if (!res.ok) throw new Error(`${res.status} term_summary.json/csv`);
  return parseCsv<TermSummaryRow>(await res.text());
}

export async function loadUniversityPct(): Promise<UniversityRow[]> {
  let res = await fetch(`${base}term_university_origin_pct.json`);
  if (res.ok) {
    return (await res.json()) as UniversityRow[];
  }
  res = await fetch(`${base}term_university_origin_pct.csv`);
  if (!res.ok) throw new Error(`${res.status} term_university_origin_pct.json/csv`);
  return parseCsv<UniversityRow>(await res.text());
}
