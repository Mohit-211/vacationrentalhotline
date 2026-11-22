// The business is in Florida, so every date the site, its emails and its
// figures show is a US Eastern Time date (EST, or EDT in summer), written
// MM/DD/YYYY, whoever is looking and wherever the server runs.

export const BUSINESS_TIME_ZONE = "America/New_York";

const easternDate = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function partsOf(value: string | Date) {
  const parts: Record<string, string> = {};
  for (const { type, value: part } of easternDate.formatToParts(new Date(value))) parts[type] = part;
  return parts as { year: string; month: string; day: string };
}

/** "11/22/2027": the date in Eastern Time, MM/DD/YYYY. */
export function formatDate(value: string | Date): string {
  const { year, month, day } = partsOf(value);
  return `${month}/${day}/${year}`;
}

/** "2027-11-22": the Eastern date as a key that sorts, for grouping by day. */
export function easternDayKey(value: string | Date): string {
  const { year, month, day } = partsOf(value);
  return `${year}-${month}-${day}`;
}

/** The day after a "YYYY-MM-DD" key, by the calendar (unaffected by daylight saving). */
export function nextDayKey(key: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
