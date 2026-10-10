/**
 * Age helpers — everything about "how old is the child" lives here so the
 * skill engine and the parent dashboard agree on the one source of truth.
 */

/** age in fractional years from an ISO birth date */
export function ageYears(birth: string): number {
  const b = new Date(birth + 'T00:00:00');
  if (isNaN(b.getTime())) return 2;
  const now = new Date();
  return (now.getTime() - b.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/**
 * Developmental stage from age: 0 = 2–3y, 1 = 3–4y, 2 = 4–5y, 3 = 5–6y.
 * This is the base AND a soft ceiling for game difficulty — a 2-year-old
 * never sees 5-year-old content, no matter how skilled she is.
 */
export function stageFromAge(birth: string): number {
  const a = ageYears(birth);
  if (a < 3) return 0;
  if (a < 4) return 1;
  if (a < 5) return 2;
  return 3;
}
