const SEATTLE_TZ = "America/Los_Angeles";

/**
 * Returns { yyyymmdd, dayName } for a UTC Date interpreted in Seattle local time.
 * Used for GTFS calendar lookups — servers running in UTC (e.g. Railway) would
 * otherwise compute the wrong date/weekday after ~midnight PT.
 */
export function seattleDateParts(date: Date): { yyyymmdd: string; dayName: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SEATTLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    yyyymmdd: `${get("year")}${get("month")}${get("day")}`,
    dayName: get("weekday").toLowerCase(),
  };
}

/**
 * Returns seconds since midnight for a UTC Date interpreted in Seattle local time.
 * Used for schedule headway lookups so they match GTFS trip departure times.
 */
export function seattleSecondsFromMidnight(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SEATTLE_TZ,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  const h = get("hour") % 24;
  return h * 3600 + get("minute") * 60 + get("second");
}
