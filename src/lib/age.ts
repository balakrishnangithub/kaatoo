/**
 * Age helpers — everything about "how old is the child" lives here so the
 * skill engine and the parent dashboard agree on the one source of truth.
 *
 * Age is counted the way people count it: in whole calendar months since the
 * birth date. (Dividing milliseconds by an average year drifts by a day around
 * every birthday, and rounding the remainder is how "2 years 12 months" happens.)
 */

/** an unreadable birth date is treated as the youngest child the app is built for */
const FALLBACK_MONTHS = 24;

/** local calendar date as YYYY-MM-DD — the format `<input type="date">` speaks */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** a birth date that makes a child exactly `years` old today */
export function birthDateFor(years: number, now = new Date()): string {
  const y = now.getFullYear() - years;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate(); // 29 Feb has no twin most years
  return isoDate(new Date(y, now.getMonth(), Math.min(now.getDate(), lastDay)));
}

/** whole calendar months lived, from an ISO birth date (never negative) */
export function ageMonths(birth: string, now = new Date()): number {
  const b = new Date(birth + 'T00:00:00');
  if (isNaN(b.getTime())) return FALLBACK_MONTHS;
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1; // this month's "birthday" hasn't come yet
  return Math.max(0, months);
}

/** age in years (to the month) from an ISO birth date */
export function ageYears(birth: string, now = new Date()): number {
  return ageMonths(birth, now) / 12;
}

/**
 * Developmental stage from age: 0 = 2–3y, 1 = 3–4y, 2 = 4–5y, 3 = 5–6y.
 * This is the base AND a soft ceiling for game difficulty — a 2-year-old
 * never sees 5-year-old content, no matter how skilled she is.
 */
export function stageFromAge(birth: string, now = new Date()): number {
  const a = ageYears(birth, now);
  if (a < 3) return 0;
  if (a < 4) return 1;
  if (a < 5) return 2;
  return 3;
}

/** bilingual age line for the parent dashboard, e.g. "2 ஆண்டு 7 மாதம் · 2y 7m" */
export function formatAge(birth: string, now = new Date()): string {
  const total = ageMonths(birth, now);
  const y = Math.floor(total / 12);
  const m = total % 12;
  if (y === 0) return `${m} மாதங்கள் · ${m} months`;
  if (m === 0) return `${y} வயது · ${y} yr`;
  return `${y} ஆண்டு ${m} மாதம் · ${y}y ${m}m`;
}
