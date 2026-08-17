import {
  getISOWeek,
  formatTimereportDate,
  formatDateWithHyphens,
  getPathFromDate,
  calcDurationBetweenTimes,
  getDateFromFilename,
  getWeeksAroundDate,
  getWeeksInMonth,
} from "../datetime";

describe("GIVEN datetime/getISOWeek", () => {
  // @rule R3
  it("returns the ISO week for a mid-week date", () => {
    // Thursday 13 Aug 2026 is the Thursday of ISO week 33
    expect(getISOWeek(new Date(2026, 7, 13))).toBe(33);
  });

  // @rule R3
  it("returns week 1 for a date in the week containing 1 January", () => {
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
  });

  // @rule R3
  it("returns week 1 for 31 December when that day belongs to the next ISO year", () => {
    expect(getISOWeek(new Date(2024, 11, 31))).toBe(1);
  });

  // @rule R3
  it("returns week 53 for 1 January when that day belongs to the previous ISO year", () => {
    expect(getISOWeek(new Date(2021, 0, 1))).toBe(53);
  });
});

describe("GIVEN datetime/formatTimereportDate", () => {
  it("formats a date as yyyymmdd with zero-padded month and day", () => {
    expect(formatTimereportDate(new Date(2026, 1, 7))).toBe("20260207");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatTimereportDate(new Date(2026, 0, 5))).toBe("20260105");
  });
});

describe("GIVEN datetime/formatDateWithHyphens", () => {
  it("formats a date as yyyy-mm-dd with zero-padded month and day", () => {
    expect(formatDateWithHyphens(new Date(2026, 1, 7))).toBe("2026-02-07");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatDateWithHyphens(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("GIVEN datetime/getPathFromDate", () => {
  // @rule R1, R3
  it("builds the reports path with a zero-padded ISO week", () => {
    expect(getPathFromDate(new Date(2026, 1, 7), "/reports")).toBe(
      "/reports/2026/week 06/timereport - 20260207"
    );
  });

  // @rule R2
  it("uses the calendar year even when the ISO week belongs to the next year", () => {
    expect(getPathFromDate(new Date(2024, 11, 31), "/reports")).toBe(
      "/reports/2024/week 01/timereport - 20241231"
    );
  });
});

describe("GIVEN datetime/calcDurationBetweenTimes", () => {
  // @rule D2
  it("returns duration in decimal hours", () => {
    expect(calcDurationBetweenTimes("09:00", "10:30")).toBe(1.5);
  });

  // @rule D2
  it("rounds duration to two decimal hours", () => {
    expect(calcDurationBetweenTimes("09:00", "09:10")).toBe(0.17);
  });

  it("returns 0 when from and to are the same", () => {
    expect(calcDurationBetweenTimes("10:00", "10:00")).toBe(0);
  });

  it("returns null when from is undefined", () => {
    expect(calcDurationBetweenTimes(undefined as unknown as string, "10:00")).toBeNull();
  });

  it("returns null when to is undefined", () => {
    expect(calcDurationBetweenTimes("09:00", undefined as unknown as string)).toBeNull();
  });
});

describe("GIVEN datetime/getDateFromFilename", () => {
  it("parses a valid timereport filename", () => {
    const date = getDateFromFilename("timereport - 20260207");

    expect(date).toEqual(new Date(2026, 1, 7));
  });

  it("returns null when the filename has no date suffix", () => {
    expect(getDateFromFilename("notes.txt")).toBeNull();
  });
});

describe("GIVEN datetime/getWeeksAroundDate", () => {
  const date = new Date(2026, 1, 7);
  const weeks = getWeeksAroundDate(date);

  it("returns 11 entries covering 5 weeks before and after", () => {
    expect(weeks).toHaveLength(11);
  });

  it("puts the ISO week of the given date in the middle", () => {
    expect(weeks[5]).toEqual({
      year: "2026",
      week: "06",
    });
  });

  it("zero-pads week numbers", () => {
    weeks.forEach(({ week }) => {
      expect(week).toMatch(/^\d{2}$/);
    });
  });
});

describe("GIVEN datetime/getWeeksInMonth", () => {
  it("returns one entry per 7-day step from the 1st through the last week started in the month", () => {
    expect(getWeeksInMonth(new Date(2026, 1, 15))).toEqual([
      { year: "2026", week: "05" },
      { year: "2026", week: "06" },
      { year: "2026", week: "07" },
      { year: "2026", week: "08" },
    ]);
  });

  it("includes a week that belongs to the next ISO year at the end of December", () => {
    // 29 Dec 2008 is a Monday in ISO week 1 of 2009; the calendar year stays 2008
    const weeks = getWeeksInMonth(new Date(2008, 11, 15));
    const lastWeek = weeks[weeks.length - 1];

    expect(lastWeek).toEqual({ year: "2008", week: "01" });
  });
});
