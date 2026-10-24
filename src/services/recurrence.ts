import { IRecurrence } from "../models/Task.js";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function parseYMD(ymd: string): [number, number, number] {
  const parts = ymd.split("-").map(Number);
  return [parts[0], parts[1], parts[2]];
}

function formatYMD(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Generate dates (YYYY-MM-DD) for a recurring task within a specified [from, to] range.
 */
export function generateOccurrenceDates(
  startDateStr: string,
  recurrence: IRecurrence,
  range: DateRange
): string[] {
  const results: string[] = [];
  const { type, interval = 1, weekdays = [], endDate } = recurrence;
  const safeInterval = Math.max(1, interval);

  const [startYear, startMonth, startDay] = parseYMD(startDateStr);
  const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay));

  const [fromYear, fromMonth, fromDay] = parseYMD(range.from);
  const fromDateObj = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay));

  const [toYear, toMonth, toDay] = parseYMD(range.to);
  const toDateObj = new Date(Date.UTC(toYear, toMonth - 1, toDay));

  let endDateObj: Date | null = null;
  if (endDate) {
    const [endYear, endMonth, endDay] = parseYMD(endDate);
    endDateObj = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  }

  if (type === "none") {
    if (startDateObj >= fromDateObj && startDateObj <= toDateObj) {
      if (!endDateObj || startDateObj <= endDateObj) {
        results.push(startDateStr);
      }
    }
    return results;
  }

  if (type === "daily" || type === "custom") {
    const curr = new Date(startDateObj);
    while (curr <= toDateObj) {
      if (curr >= fromDateObj && (!endDateObj || curr <= endDateObj)) {
        const y = curr.getUTCFullYear();
        const m = curr.getUTCMonth() + 1;
        const d = curr.getUTCDate();
        results.push(formatYMD(y, m, d));
      }
      curr.setUTCDate(curr.getUTCDate() + safeInterval);
    }
    return results;
  }

  if (type === "weekly") {
    const targetDays = new Set(weekdays.length > 0 ? weekdays : [startDateObj.getUTCDay()]);
    // Start at week containing startDate
    const curr = new Date(startDateObj);
    // Align to Sunday of start week
    const dayOfWeek = curr.getUTCDay();
    const weekStart = new Date(curr);
    weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);

    let weekCursor = new Date(weekStart);
    while (weekCursor <= toDateObj) {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekCursor);
        dayDate.setUTCDate(dayDate.getUTCDate() + d);

        if (dayDate < startDateObj) continue;
        if (dayDate > toDateObj) break;
        if (endDateObj && dayDate > endDateObj) break;

        if (targetDays.has(dayDate.getUTCDay())) {
          if (dayDate >= fromDateObj) {
            results.push(
              formatYMD(
                dayDate.getUTCFullYear(),
                dayDate.getUTCMonth() + 1,
                dayDate.getUTCDate()
              )
            );
          }
        }
      }
      weekCursor.setUTCDate(weekCursor.getUTCDate() + 7 * safeInterval);
    }
    return results;
  }

  if (type === "monthly") {
    const targetDayOfMonth = startDay;
    let currYear = startYear;
    let currMonth = startMonth;

    while (true) {
      const monthStart = new Date(Date.UTC(currYear, currMonth - 1, 1));
      if (monthStart > toDateObj) break;

      const maxDays = daysInMonth(currYear, currMonth);
      if (targetDayOfMonth <= maxDays) {
        const occurDate = new Date(Date.UTC(currYear, currMonth - 1, targetDayOfMonth));
        if (occurDate >= startDateObj && occurDate <= toDateObj) {
          if (occurDate >= fromDateObj && (!endDateObj || occurDate <= endDateObj)) {
            results.push(formatYMD(currYear, currMonth, targetDayOfMonth));
          }
        }
      }

      // Advance by interval months
      currMonth += safeInterval;
      while (currMonth > 12) {
        currMonth -= 12;
        currYear += 1;
      }
    }
    return results;
  }

  return results;
}
