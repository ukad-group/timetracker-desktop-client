export function getISOWeek(date: Date): number {
  const timelessDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  timelessDate.setUTCDate(
    timelessDate.getUTCDate() + 4 - (timelessDate.getUTCDay() || 7)
  );
  const yearStart = new Date(Date.UTC(timelessDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((timelessDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return weekNo;
}

export function formatTimereportDate(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}${month}${day}`;
}

export function formatDateWithHyphens(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getPathFromDate(date: Date, reportsFolder: string): string {
  const year = date.getFullYear();
  const week = getISOWeek(date).toString().padStart(2, "0");
  const timereportDate = formatTimereportDate(date);

  return `${reportsFolder}/${year}/week ${week}/timereport - ${timereportDate}`;
}

export function calcDurationBetweenTimes(
  from: string,
  to: string
): number | null {
  if (from == undefined || to == undefined) {
    return null;
  }
  const startParts = from.split(":");
  const endParts = to.split(":");

  const startHours = parseInt(startParts[0], 10) || 0;
  const startMinutes = parseInt(startParts[1], 10) || 0;

  const endHours = parseInt(endParts[0], 10) || 0;
  const endMinutes = parseInt(endParts[1], 10) || 0;

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const totalMinutes = endTotalMinutes - startTotalMinutes;

  const hours = Math.round((totalMinutes / 60) * 100) / 100;

  return hours;
}

export function getDateFromFilename(filename: string) {
  const dateString = filename.split(" - ")[1];

  if (dateString === undefined) return null;

  const year = parseInt(dateString.slice(0, 4), 10);
  const month = parseInt(dateString.slice(4, 6), 10) - 1;
  const day = parseInt(dateString.slice(6, 8), 10);

  return new Date(year, month, day);
}

export function getWeeksAroundDate(
  date: Date
): { year: string; week: string }[] {
  const result: { year: string; week: string }[] = [];

  for (let i = -5; i <= 5; i++) {
    const currentDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    currentDate.setDate(currentDate.getDate() + i * 7);

    const isoWeek = getISOWeek(currentDate);
    result.push({
      year: currentDate.getFullYear().toString(),
      week: isoWeek.toString().padStart(2, "0"),
    });
  }

  return result;
}

export function getReportWatchPaths(reportsFolder: string, date: Date): string[] {
  return getWeeksAroundDate(new Date(date)).map(
    ({ year, week }) => `${reportsFolder}/${year}/week ${week}`
  );
}

export function getWeeksInMonth(date: Date): { year: string; week: string }[] {
  const weeksArray: { year: string; week: string }[] = [];

  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  for (
    let currentDay = firstDayOfMonth;
    currentDay <= lastDayOfMonth;
    currentDay.setDate(currentDay.getDate() + 7)
  ) {
    const year = currentDay.getFullYear();
    const week = getISOWeek(currentDay).toString().padStart(2, "0");

    weeksArray.push({ year: year.toString(), week });
  }

  return weeksArray;
}
