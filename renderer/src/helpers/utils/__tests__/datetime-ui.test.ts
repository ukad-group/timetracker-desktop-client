import {
  checkIsToday,
  isTheSameDates,
  getWeekNumber,
  getDateFromString,
  getMonthWorkHours,
  getRequiredHours,
  getTimeFromEventObj,
  padStringToMinutes,
  convertMillisecondsToTime,
  getWeekDates,
  getMonthDates,
  getCurrentTimeRoundedUp,
  formatDate,
  extractDatesFromPeriod,
  generateDateRange,
  mathOvertimeUndertime,
} from "../datetime-ui";
import { ApiDayOff, DayOff, FormattedReport } from "@/components/Calendar/types";

describe("GIVEN datetime-ui/checkIsToday", () => {
  it("returns true if the given date is today", () => {
    const today = new Date();
    expect(checkIsToday(today)).toBe(true);
  });

  it("returns false if the given date is not today", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(checkIsToday(yesterday)).toBe(false);
  });

  it("handles dates with different times", () => {
    const now = new Date();
    const laterToday = new Date(now);
    laterToday.setHours(now.getHours() + 1);

    expect(checkIsToday(laterToday)).toBe(true);
  });
});

describe("GIVEN datetime-ui/isTheSameDates", () => {
  it("returns true if both dates are the same", () => {
    const date = new Date();
    expect(isTheSameDates(date, date)).toBe(true);
  });

  it("returns true if both dates have the same day but different times", () => {
    const date1 = new Date();
    const date2 = new Date(date1);
    date2.setHours(date1.getHours() + 1);

    expect(isTheSameDates(date1, date2)).toBe(true);
  });

  it("returns false if dates have different days", () => {
    const date1 = new Date();
    const date2 = new Date(date1);
    date2.setDate(date1.getDate() + 1);

    expect(isTheSameDates(date1, date2)).toBe(false);
  });

  it("handles dates with different times", () => {
    const date1 = new Date();
    const date2 = new Date(date1);
    date2.setHours(date1.getHours() + 1);

    expect(isTheSameDates(date1, date2)).toBe(true);
  });
});

describe("GIVEN datetime-ui/getWeekNumber", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the correct week number for a given date", () => {
    getDateFromString("20220201");

    expect(getWeekNumber("20220719")).toBe(29);
  });

  it("handles different dates and returns the correct week number", () => {
    getDateFromString("20220110");

    expect(getWeekNumber("20220110")).toBe(2);
  });
});

describe("GIVEN datetime-ui/getMonthWorkHours", () => {
  it("returns the correct total work hours for a specific month", () => {
    const monthReports = [
      { date: "20220101", workDurationMs: 3600000, week: 2, isValid: false },
      { date: "20220115", workDurationMs: 7200000, week: 2, isValid: false },
    ];

    const calendarDate = new Date("2022-01-20");

    expect(getMonthWorkHours(monthReports, calendarDate)).toBe(10800000);
  });

  it("returns 0 when no reports for the specified month", () => {
    const monthReports = [{ date: "20220201", workDurationMs: 3600000, week: 2, isValid: false }];

    const calendarDate = new Date("2022-01-20");

    expect(getMonthWorkHours(monthReports, calendarDate)).toBe(0);
  });

  it("handles edge cases and empty input", () => {
    const monthReports = [{ date: "20220201", workDurationMs: 3600000, week: 2, isValid: false }];

    expect(getMonthWorkHours([], new Date("2022-01-20"))).toBe(0);

    expect(getMonthWorkHours(monthReports, new Date("2022-01-20"))).toBe(0);
  });
});

describe("GIVEN datetime-ui/getMonthRequiredHours", () => {
  it("calculates the correct total required work hours for the month", () => {
    const calendarDate = new Date("2022-01-01");
    const daysOff = [
      { date: new Date("2022-01-05"), duration: 4, description: "Desc", type: 1, status: 1 },
      { date: new Date("2022-01-10"), duration: 8, description: "Desc", type: 1, status: 1 },
    ];
    const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);

    isTheSameDates(calendarDate, calendarDate);

    expect(getRequiredHours(calendarDate, daysOff, lastDayOfMonth)).toBe(561600000);
  });

  it("returns 0 when no days off for the month", () => {
    const calendarDate = new Date("2022-01-01");
    const daysOff = [];

    const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);

    expect(getRequiredHours(calendarDate, daysOff, lastDayOfMonth)).toBe(604800000);
  });

  it("handles edge cases and empty input", () => {
    expect(getRequiredHours(new Date("2022-01-01"), undefined, new Date("2022-01-31"))).toBe(undefined);

    expect(getRequiredHours(new Date("2022-01-01"), [], new Date("2022-01-31"))).toBe(604800000);
  });
});

describe("GIVEN datetime-ui/generateDateRange", () => {
  it("returns an inclusive range from start to end", () => {
    const result = generateDateRange(new Date(2022, 0, 1), new Date(2022, 0, 3));

    expect(result).toEqual([new Date(2022, 0, 1), new Date(2022, 0, 2), new Date(2022, 0, 3)]);
  });

  it("returns a single date when start and end are the same day", () => {
    expect(generateDateRange(new Date(2022, 0, 1), new Date(2022, 0, 1))).toEqual([new Date(2022, 0, 1)]);
  });
});

describe("GIVEN datetime-ui/extractDatesFromPeriod", () => {
  const period: ApiDayOff = {
    dateFrom: "2022-01-03T00:00:00",
    dateTo: "2022-01-07T00:00:00",
    quantity: 8,
    description: "Vacation",
    type: 1,
    status: 1,
  };

  it("returns weekdays and excludes the only holiday in the range", () => {
    const holidays: DayOff[] = [
      { date: new Date(2022, 0, 5), duration: 8, description: "Holiday", type: 2, status: 1 },
    ];

    const result = extractDatesFromPeriod(period, holidays);

    expect(result.map((item) => item.date)).toEqual([
      new Date(2022, 0, 3),
      new Date(2022, 0, 4),
      new Date(2022, 0, 6),
      new Date(2022, 0, 7),
    ]);
    expect(result[0]).toEqual(
      expect.objectContaining({
        duration: 8,
        description: "Vacation",
        type: 1,
        status: 1,
      }),
    );
  });

  it("returns an empty array when there are no holidays to compare against", () => {
    expect(extractDatesFromPeriod(period, [])).toEqual([]);
  });
});

describe("GIVEN datetime-ui/mathOvertimeUndertime", () => {
  const calendarDate = new Date(2022, 0, 1);
  const selectedDate = new Date(2022, 0, 3);
  const daysOff: DayOff[] = [];
  const requiredMs = 8 * 3600000;

  it("returns empty overtime when work hours match required hours", () => {
    const reports: FormattedReport[] = [{ date: "20220103", week: 1, workDurationMs: requiredMs, isValid: true }];

    expect(mathOvertimeUndertime(reports, calendarDate, daysOff, selectedDate)).toEqual({
      overUnder: "",
      overUnderHours: 0,
    });
  });

  it("returns overtime when work hours exceed required hours", () => {
    const reports: FormattedReport[] = [
      { date: "20220103", week: 1, workDurationMs: requiredMs + 3600000, isValid: true },
    ];

    expect(mathOvertimeUndertime(reports, calendarDate, daysOff, selectedDate)).toEqual({
      overUnder: "overtime",
      overUnderHours: 3600000,
    });
  });

  it("returns undertime when work hours are below required hours", () => {
    expect(mathOvertimeUndertime([], calendarDate, daysOff, selectedDate)).toEqual({
      overUnder: "undertime",
      overUnderHours: requiredMs,
    });
  });
});

describe("GIVEN datetime-ui/getTimeFromEventObj", () => {
  it("returns the correct time from a valid date string", () => {
    const validDateString = "2022-01-01T12:34:56Z";
    expect(getTimeFromEventObj(validDateString)).toBe("12:34");
  });

  it('returns the correct time when "Z" is removed from the date string', () => {
    const dateStringWithZ = "2022-01-01T23:45:00Z";
    const dateStringWithoutZ = "2022-01-01T23:45:00";
    expect(getTimeFromEventObj(dateStringWithZ)).toBe(getTimeFromEventObj(dateStringWithoutZ));
  });

  it("returns an empty string for an empty date string", () => {
    const emptyDateString = "";
    expect(getTimeFromEventObj(emptyDateString)).toBe("Invalid Date");
  });

  it("returns an empty string for an invalid date string", () => {
    const invalidDateString = "invalid-date";
    expect(getTimeFromEventObj(invalidDateString)).toBe("Invalid Date");
  });
});

describe("GIVEN datetime-ui/padStringToMinutes", () => {
  it("returns the correct total minutes for a valid time string", () => {
    const validTimeString = "12:34";
    expect(padStringToMinutes(validTimeString)).toBe(754);
  });

  it("returns undefined for an empty time string", () => {
    const emptyTimeString = "";
    expect(padStringToMinutes(emptyTimeString)).toBeUndefined();
  });

  it("returns undefined for an invalid time string", () => {
    const invalidTimeString = "invalid-time";
    expect(padStringToMinutes(invalidTimeString)).toBeNaN();
  });

  it("handles time string with zero-padded values", () => {
    const zeroPaddedTimeString = "08:05";
    expect(padStringToMinutes(zeroPaddedTimeString)).toBe(485);
  });

  it("handles time string with single-digit values", () => {
    const singleDigitTimeString = "1:2";
    expect(padStringToMinutes(singleDigitTimeString)).toBe(62);
  });
});

describe("GIVEN datetime-ui/convertMillisecondsToTime", () => {
  it("returns the correct time string for a given number of milliseconds", () => {
    const milliseconds = 123456789;
    expect(convertMillisecondsToTime(milliseconds)).toBe("34:17");
  });

  it('returns "00:00" for 0 milliseconds', () => {
    const milliseconds = 0;
    expect(convertMillisecondsToTime(milliseconds)).toBe("0:00");
  });

  it("returns the correct time string for a large number of milliseconds", () => {
    const milliseconds = 9876543210;
    expect(convertMillisecondsToTime(milliseconds)).toBe("2743:29");
  });
});

describe("GIVEN datetime-ui/getWeekDates", () => {
  it("returns the correct array of dates for a given date in the middle of the week", () => {
    const inputDate = new Date("2022-01-12");
    const result = getWeekDates(inputDate);

    expect(result).toEqual([
      new Date("2022-01-10"),
      new Date("2022-01-11"),
      new Date("2022-01-12"),
      new Date("2022-01-13"),
      new Date("2022-01-14"),
      new Date("2022-01-15"),
      new Date("2022-01-16"),
    ]);
  });

  it("returns the correct array of dates for a given date on Sunday", () => {
    const inputDate = new Date("2022-01-15");
    const result = getWeekDates(inputDate);

    expect(result).toEqual([
      new Date("2022-01-10"),
      new Date("2022-01-11"),
      new Date("2022-01-12"),
      new Date("2022-01-13"),
      new Date("2022-01-14"),
      new Date("2022-01-15"),
      new Date("2022-01-16"),
    ]);
  });

  it("returns the correct array of dates for a given date on Monday", () => {
    const inputDate = new Date("2022-01-10");
    const result = getWeekDates(inputDate);

    expect(result).toEqual([
      new Date("2022-01-10"),
      new Date("2022-01-11"),
      new Date("2022-01-12"),
      new Date("2022-01-13"),
      new Date("2022-01-14"),
      new Date("2022-01-15"),
      new Date("2022-01-16"),
    ]);
  });
});

describe("GIVEN datetime-ui/getMonthDates", () => {
  it("returns an array of dates for the entire month", () => {
    const inputDate = new Date(2022, 0, 15);

    const result = getMonthDates(inputDate);

    expect(result.length).toBe(31);

    expect(result[0]).toEqual(new Date(2022, 0, 1));
    expect(result[result.length - 1]).toEqual(new Date(2022, 0, 31));
  });

  it("handles leap year correctly", () => {
    const inputDate = new Date(2020, 1, 15);

    const result = getMonthDates(inputDate);

    expect(result.length).toBe(29);

    expect(result[0]).toEqual(new Date(2020, 1, 1));
    expect(result[result.length - 1]).toEqual(new Date(2020, 1, 29));
  });
});

describe("GIVEN datetime-ui/getCurrentTimeRoundedUp", () => {
  it("returns a string with the correct format (2-digit hour, 2-digit minute, 24-hour format)", () => {
    const result = getCurrentTimeRoundedUp();

    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("GIVEN datetime-ui/formatDate", () => {
  it('formats a date with the default "long" type', () => {
    const date = new Date(2022, 0, 15);

    const result = formatDate(date);

    expect(result).toBe("January 15, 2022");
  });

  it('formats a date with the specified "short" type', () => {
    const date = new Date(2022, 0, 15);

    const result = formatDate(date, "short");

    expect(result).toBe("Jan 15, 2022");
  });
});
