import type { GtfsCalendar, GtfsCalendarDate } from "@bus-ops/shared";
import { seattleDateParts } from "./seattleTime.js";

export function getActiveServiceIds(
  date: Date,
  calendars: GtfsCalendar[],
  calendarDates: GtfsCalendarDate[],
): Set<string> {
  const { yyyymmdd, dayName } = seattleDateParts(date);
  const active = new Set<string>();
  for (const cal of calendars) {
    if (cal.startDate > yyyymmdd || cal.endDate < yyyymmdd) continue;
    if (cal[dayName as keyof GtfsCalendar]) active.add(cal.serviceId);
  }
  for (const exc of calendarDates) {
    if (exc.date !== yyyymmdd) continue;
    if (exc.exceptionType === 1) active.add(exc.serviceId);
    else active.delete(exc.serviceId);
  }
  return active;
}
