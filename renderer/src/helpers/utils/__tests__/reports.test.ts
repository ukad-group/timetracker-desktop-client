import {
  calcDurationBetweenTimes,
  formatDuration,
  formatDurationAsDecimals,
  parseReport,
  serializeReport,
  checkIntersection,
  validation,
  addDurationToTime,
  stringToMinutes,
  addSuggestions,
} from "../reports";
import { ReportActivity } from "../types";

const parsedReport = (activity) => parseReport(activity)[0];
const useFakeTime = () => jest.useFakeTimers().setSystemTime(new Date("2013-05-05"));

const activity = (overrides: Partial<ReportActivity> = {}): ReportActivity => ({
  id: 1,
  from: "09:00",
  to: "10:00",
  duration: 3600000,
  project: "timetracker",
  activity: "coding",
  description: "feature",
  validation: { isValid: true },
  ...overrides,
});

describe("parseReport function", () => {
  // @rule P1
  test("should return empty collection when null or empty string is passed", () => {
    expect(parseReport(undefined)).toStrictEqual([]);
    expect(parseReport(null)).toStrictEqual([]);
    expect(parseReport("")).toStrictEqual([]);
  });

  // @rule P2
  test("should skip lines which are not started from time pattern hh:mm", () => {
    expect(parsedReport("skip this line\nand this line")).toStrictEqual([]);
  });

  // @rule P2
  test("should collect non-time lines as notes on the second tuple element", () => {
    const [activities, notes] = parseReport(
      "morning notes\n09:00 - project - coding - feature\n10:00 - !\nafternoon notes",
    );

    expect(activities).toHaveLength(2);
    expect(notes).toBe("morning notes\nafternoon notes");
  });

  // @rule P3, P4
  test("should extract [project name], [activity name] and [description] from registration", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - activity - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
    expect(registration).toHaveProperty("activity", "activity");
    expect(registration).toHaveProperty("description", "description");
  });

  // @rule P3
  test("should support spaces in [project name], [activity name] and [description]", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - pro ject - act ivity - des cription\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "pro ject");
    expect(registration).toHaveProperty("activity", "act ivity");
    expect(registration).toHaveProperty("description", "des cription");
  });

  // @rule P3
  test("should extract [project name] when [activity] and [description] are not set", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
  });

  // @rule P3
  test("should extract [project name] and [description] when [activity] is not set", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
    expect(registration).toHaveProperty("description", "description");
  });

  // @rule P8
  test("should lowercase project name", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
  });

  // @rule P8, P10
  test("should keep activity name case sensitive after 26 Aug 2016", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("activity", "ActIvItY");
  });

  // @rule P8
  test("should keep description case sensitive", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("description", "dEscrIptIOn");
  });

  test('should parse the line when backslash "/" or slash "\\" are used in description', () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - activity - de \\ scription /\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("description", "de \\ scription /");
  });

  // @rule P7
  test("should set isBreak to true when line stars from !", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - !\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("isBreak", true);
  });

  // @rule P7
  test("should set isBreak to true when remainder after time is empty", () => {
    const dayReport = parsedReport("18:00 -\n19:00 - project - coding - feature");
    const registration = dayReport[0];

    expect(registration).toHaveProperty("isBreak", true);
  });

  // @rule P4, P5
  test("should parse time", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - activity - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("from", "18:00");
    expect(registration).toHaveProperty("to", "19:00");
  });

  // @rule P5, P6
  test("should set duration in ms from the next start time and leave the last row open-ended", () => {
    const dayReport = parsedReport("09:00 - project - coding - feature\n10:30 - !");

    expect(dayReport[0]).toMatchObject({
      from: "09:00",
      to: "10:30",
      duration: 90 * 60 * 1000,
    });
    expect(dayReport[1].to).toBeUndefined();
    expect(dayReport[1].duration).toBeUndefined();
  });

  // 'should calcualate time spent on task in minutes' - is it actual?

  test("should support . in [project name], [activity name] and [description]", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - pro.ject - act.ivity - des.cription\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "pro.ject");
    expect(registration).toHaveProperty("activity", "act.ivity");
    expect(registration).toHaveProperty("description", "des.cription");
  });

  // should set StartTime and EndTime in date when registration was made - is it actual?

  test("it should nonletter symbols in description support in description", () => {
    const descriptions = [
      "des.cription",
      "des1cription",
      "(",
      ")",
      "'",
      "\\",
      ":",
      "&",
      "<",
      ">",
      "#",
      "https://trello.com/c/lU3qqXF0/1145-if-drop-box-file-exceeds-the-limitation-no-alert-is-shown-works-well-if-upload-file-from-desktop",
      "https://trello.com/c/lU3qqXF0",
    ];

    for (const description of descriptions) {
      const dayReport = parsedReport("18:00 2013-05-05 - pro.ject - act.ivity - " + description + "\n19:00 2013-05-05");
      const registration = dayReport[0];

      expect(dayReport.length).toBeGreaterThan(0);
      expect(registration).toHaveProperty("description", description);
    }
  });

  // @rule P9
  test("it should undefined symbols in description not show in description", () => {
    const dayReport = parsedReport("18:00 - project - activity - description � description\n19:00 - \n20:00");
    const registration = dayReport[0];

    expect(registration).toHaveProperty("description", "description - description");
  });

  test("it should undefined symbols in activity and project name skip in description", () => {
    const dayReport = parsedReport("18:00 - project - acti�vity - description � description\n19:00 - \n20:00");
    const registration = dayReport[0];

    expect(registration).toHaveProperty("activity", "acti�vity");
  });

  // @rule P10
  test("parser should recognize 3rd dash surrounded by spaces as separator after 23 Aug 2016", () => {
    const dayReport = parsedReport("18:00 - project - description with some -dash- delimited-text\n19:00 - \n20:00");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("activity", "");
    expect(registration).toHaveProperty("description", "description with some -dash- delimited-text");
  });

  test("parser should not delete [project name] from start [description]", () => {
    const dayReport = parsedReport("18:00 - projectName - projectName description with some delimited-text\n19:00 -");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("description", "projectName description with some delimited-text");
  });

  test("parser should not delete [project name] from middle [description]", () => {
    const dayReport = parsedReport("18:00 - projectName - description with projectName some delimited-text\n19:00 -");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("description", "description with projectName some delimited-text");
  });

  // @rule P10
  test("parser should recognize 3rd dash as separator before 23 Aug 2016", () => {
    useFakeTime();
    const dayReport = parsedReport("18:00 - project - description with some -dash- delimited-text\n19:00 - \n20:00");
    const registration = dayReport[0];

    expect(registration).toHaveProperty("activity", "description with some");
    expect(registration).toHaveProperty("description", "dash- delimited-text");
  });

  // @rule P10
  test("should lowercase activity name before 26 Aug 2016", () => {
    useFakeTime();
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("activity", "activity");
  });
});

describe("serializeReport function", () => {
  // @rule S1, S4
  test("should return serialized report", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "meeting",
        description: "calendar discussion",
        duration: 1800000,
        from: "11:30",
        project: "timetracker",
        to: "12:00",
        validation: { isValid: true },
      },
    ];

    const report: string = "11:30 - timetracker - meeting - calendar discussion\n12:00 - \n";
    expect(serializeReport(activities)).toBe(report);
  });

  test('should return serialized report when [to] = ""', () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "meeting",
        description: "calendar discussion",
        duration: 1800000,
        from: "11:30",
        project: "timetracker",
        to: "",
        validation: { isValid: true },
      },
    ];

    const report: string = "11:30 - timetracker - meeting - calendar discussion\n";
    expect(serializeReport(activities)).toBe(report);
  });

  // @rule S4
  test('should return 12:30 - ! when [to] = "12:30"', () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "meeting",
        description: "calendar discussion",
        duration: 1800000,
        from: "11:30",
        project: "timetracker",
        to: "12:30",
        validation: { isValid: true },
      },
    ];

    const report: string = "11:30 - timetracker - meeting - calendar discussion\n12:30 - \n";
    expect(serializeReport(activities)).toBe(report);
  });

  // @rule S2
  test("should serialize activity of a single space as a blank field", () => {
    const report = serializeReport([
      activity({
        from: "09:00",
        to: "10:00",
        project: "timetracker",
        activity: " ",
        description: "desc with - dashes",
      }),
    ]);

    expect(report).toBe("09:00 - timetracker -  - desc with - dashes\n10:00 - \n");
  });

  // @rule S3
  test("should insert a break line when next from differs from current to", () => {
    const report = serializeReport([
      activity({ id: 1, from: "09:00", to: "10:00", project: "timetracker", activity: "coding", description: "a" }),
      activity({ id: 2, from: "11:00", to: "12:00", project: "timetracker", activity: "coding", description: "b" }),
    ]);

    expect(report).toBe("09:00 - timetracker - coding - a\n10:00 - !\n11:00 - timetracker - coding - b\n12:00 - \n");
  });

  // @rule S5
  test("should append ! to a mid-list empty registration", () => {
    const report = serializeReport([
      {
        id: 1,
        from: "09:00",
        to: "10:00",
        project: "",
        activity: "",
        description: "",
        duration: 3600000,
        validation: { isValid: true },
      },
      activity({ id: 2, from: "10:00", to: "11:00" }),
    ]);

    expect(report.startsWith("09:00 - !\n")).toBe(true);
  });

  // @rule S6
  test("should return same as report", () => {
    const report: string =
      "08:30 - westbay.dg - Grid layout.\n15:00 - internal.trainee - Meet with alexander.razvalinov.\n16:00 - westbay.dg - Grid layout.\n18:00 - !\n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
  // @rule S6
  test("should return same as report", () => {
    const report: string =
      "09:00 - !\n10:15 - qqwe - qwe\n10:30 - qqwe - qwe\n11:00 - !\n11:30 - qew - qwe\n12:00 - !\n12:30 - qqwe - qwe\n13:00 - qweqq - qe\n14:00 - !\n14:30 - 12321 - qwe\n15:00 - \n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
  // @rule S6
  test("should return same as report", () => {
    const report: string =
      "09:30 - westbay.dg - Case images block rework.\n12:30 - westbay.dg - Fixing trailer list component and upload it to backend.\n16:30 - westbay.dg - Text list editor changing.\n17:30 - westbay.dg - Case Images fix after review.\n18:00 - !\n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
});

describe("calcDurationBetweenTimes function", () => {
  // @rule D1
  test("should return null when [from] or/and [to] properties are undefined", () => {
    expect(calcDurationBetweenTimes(undefined, "10:00")).toBeNull();
    expect(calcDurationBetweenTimes("10:00", undefined)).toBeNull();
    expect(calcDurationBetweenTimes(undefined, undefined)).toBeNull();
  });

  // @rule D1
  test("should return result of [to] - [from] in milliseconds", () => {
    expect(calcDurationBetweenTimes("10:00", "10:10")).toBe(600000);
  });

  // @rule D1
  test("should return result [to] - [from] in milliseconds when hour = 0", () => {
    expect(calcDurationBetweenTimes("00:10", "00:20")).toBe(600000);
  });

  // @rule D3
  test("should return a negative duration when to is before from (no overnight wrap)", () => {
    expect(calcDurationBetweenTimes("23:00", "01:00")).toBe(-22 * 60 * 60 * 1000);
  });
});

describe("formatDuration function", () => {
  // test("should return undefined when [ms] = undefined", () => {
  //   expect(formatDuration(undefined)).toBeUndefined();
  // });

  // @rule D4
  test("should return 0h when [ms] = 0", () => {
    expect(formatDuration(0)).toBe("0h");
  });

  // @rule D4
  test("should return 0m when [ms] < 1m", () => {
    expect(formatDuration(1000)).toBe("0m");
  });

  // @rule D4
  test("should return minutes when [ms] < 1h", () => {
    const ms: number = 2000000;
    const minutes: number = ms / 1000 / 60;
    expect(formatDuration(ms)).toBe(Math.round(minutes) + "m");
  });

  // @rule D4
  test("should return exact hours without minutes", () => {
    expect(formatDuration(3600000)).toBe("1h");
  });

  // @rule D4
  test("should return time in format '12h 50m' when [ms] > 1h", () => {
    const ms: number = 20000000;
    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * msPerMinute;

    const hours = Math.floor(ms / msPerHour);
    const minutes = Math.floor((ms % msPerHour) / msPerMinute);

    expect(formatDuration(ms)).toBe(`${hours}h ${minutes}m`);
  });
});

describe("checkIntersection function", () => {
  // @rule V7
  test("should return false when [previousTo] lower than [currentFrom]", () => {
    expect(checkIntersection("10:00", "11:00")).toBeFalsy();
  });

  // @rule V7
  test("should return true when [previousTo] higher than [currentFrom]", () => {
    expect(checkIntersection("11:00", "10:00")).toBeTruthy();
  });

  // @rule V7
  test("should return true when times are equal (inclusive overlap)", () => {
    expect(checkIntersection("10:00", "10:00")).toBeTruthy();
  });
});

describe("validation function", () => {
  // @rule V7
  test("does not flag an intersection when there are only two overlapping rows", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: 3600000,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
      {
        id: 2,
        activity: "activity to",
        description: "activity to description",
        duration: 3600000,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[0];

    expect(activity).toHaveProperty("validation", {
      isValid: true,
    });
  });

  // @rule V1
  test("should fail validation when [duration] = 0", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: 0,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[0];

    expect(activity).toHaveProperty("validation", {
      isValid: false,
      cell: "duration",
      description: "Negative or zero duration",
    });
  });

  // @rule V1
  test("should fail validation when [duration] < 0", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: -1,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[0];

    expect(activity).toHaveProperty("validation", {
      isValid: false,
      cell: "duration",
      description: "Negative or zero duration",
    });
  });

  // @rule V2
  test("should fail validation when is [project] and no [to] property", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: 3600000,
        from: "12:00",
        project: "timetracker",
        to: "",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[0];

    expect(activity).toHaveProperty("validation", {
      isValid: false,
      cell: "time",
      description: "The event has no end time",
    });
  });

  // @rule V6
  test('should add mistake when [description] starts with "!"', () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: 3600000,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
      {
        id: 2,
        activity: "",
        description: "!description",
        duration: 3600000,
        from: "13:00",
        project: "timetracker",
        to: "14:00",
        mistakes: "",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[1];

    expect(activity).toHaveProperty("mistakes", " startsWith!");
  });

  // @rule V3
  test("should fail validation when there no [project] and is [to] property", () => {
    const activities: ReportActivity[] = [
      {
        id: 1,
        activity: "activity from",
        description: "activity from description",
        duration: 3600000,
        from: "12:00",
        project: "timetracker",
        to: "13:00",
        validation: { isValid: true },
      },
      {
        id: 2,
        activity: "activity to",
        description: "activity to description",
        duration: 3600000,
        from: "12:00",
        project: "",
        to: "13:00",
        validation: { isValid: true },
      },
    ];
    const activity: ReportActivity = validation(activities)[1];

    expect(activity).toHaveProperty("validation", {
      isValid: false,
      cell: "project",
      description: "The project must be specified in the activity",
    });
  });

  // @rule V7
  test("flags an intersection between the current row and the row two steps back", () => {
    const activities = validation([
      activity({ id: 1, from: "12:00", to: "13:00" }),
      activity({ id: 2, from: "13:00", to: "14:00" }),
      activity({ id: 3, from: "12:30", to: "13:30" }),
    ]);

    expect(activities[0].validation).toEqual({
      isValid: false,
      cell: "time",
      description: "Intersection of time intervals",
    });
    expect(activities[2].validation).toEqual({
      isValid: false,
      cell: "time",
      description: "Intersection of time intervals",
    });
    expect(activities[1].validation.isValid).toBe(true);
  });

  // @rule V4
  test("should fail validation when time is impossible", () => {
    const withInvalidHours = validation([activity({ from: "25:00", to: "26:00" })])[0];
    const withInvalidMinutes = validation([activity({ from: "12:00", to: "12:61" })])[0];

    expect(withInvalidHours.validation).toEqual({
      isValid: false,
      cell: "time",
      description: "Impossible time",
    });
    expect(withInvalidMinutes.validation).toEqual({
      isValid: false,
      cell: "time",
      description: "Impossible time",
    });
  });

  // @rule V5
  test("adds a mistake when project is set but activity and description are missing", () => {
    const result = validation([
      activity({
        activity: "",
        description: "",
        mistakes: "",
      }),
    ])[0];

    expect(result.validation).toEqual({ isValid: true });
    expect(result.mistakes).toBe("No activity or description");
  });

  // @rule V5
  test("does not require activity or description for a break project", () => {
    const result = validation([
      activity({
        project: "!",
        activity: "",
        description: "",
        duration: 3600000,
        mistakes: "",
      }),
    ])[0];

    expect(result.validation).toEqual({ isValid: true });
    expect(result.mistakes).toBe("");
  });

  test("keeps a valid activity as valid", () => {
    const result = validation([activity()])[0];

    expect(result.validation).toEqual({ isValid: true });
  });

  // @rule V5
  test("does not duplicate mistakes when validation runs more than once", () => {
    const activities = [
      activity({
        activity: "",
        description: "",
        mistakes: "",
      }),
    ];

    validation(activities);
    validation(activities);

    expect(activities[0].mistakes).toBe("No activity or description");
  });
});

describe("addDurationToTime function", () => {
  // @rule D6
  test("adds a decimal hour duration", () => {
    expect(addDurationToTime("09:00", "1.5")).toBe("10:30");
  });

  // @rule D6
  test("adds a duration in minutes when the value includes m", () => {
    expect(addDurationToTime("09:00", "45m")).toBe("09:45");
  });

  // @rule D6
  test("treats an integer greater than 24 as minutes", () => {
    expect(addDurationToTime("09:00", "30")).toBe("09:30");
  });

  // @rule D6
  test("treats an integer less than or equal to 24 as hours", () => {
    expect(addDurationToTime("09:00", "8")).toBe("17:00");
  });

  // @rule D7
  test("clamps the result to 23:59", () => {
    expect(addDurationToTime("23:00", "2")).toBe("23:59");
  });

  // @rule D7
  test("clamps a negative result to 00:00", () => {
    expect(addDurationToTime("09:00", "-10")).toBe("00:00");
  });

  test("returns an empty string for an invalid from time", () => {
    expect(addDurationToTime("foo", "1")).toBe("");
  });
});

describe("formatDurationAsDecimals function", () => {
  // @rule D5
  test("formats 90 minutes as 1.5h", () => {
    expect(formatDurationAsDecimals(90 * 60 * 1000)).toBe("1.5h");
  });

  // @rule D5
  test("returns an empty string when ms is undefined", () => {
    expect(formatDurationAsDecimals(undefined as unknown as number)).toBe("");
  });
});

describe("stringToMinutes function", () => {
  test("converts hh:mm to minutes", () => {
    expect(stringToMinutes("09:30")).toBe(570);
  });

  test("handles midnight", () => {
    expect(stringToMinutes("00:00")).toBe(0);
  });
});

describe("addSuggestions function", () => {
  // @rule H6
  test("does nothing when latest description map is empty", () => {
    const latestProjAndDesc: Record<string, string[]> = {};
    const latestProjAndAct: Record<string, string[]> = {};

    addSuggestions(
      [activity()],
      latestProjAndDesc as Record<string, [string]>,
      latestProjAndAct as Record<string, [string]>,
    );

    expect(latestProjAndDesc).toEqual({});
    expect(latestProjAndAct).toEqual({});
  });

  // @rule H6
  test("skips breaks and activities without a project", () => {
    const latestProjAndDesc: Record<string, string[]> = { existing: ["desc"] };
    const latestProjAndAct: Record<string, string[]> = { existing: ["act"] };

    addSuggestions(
      [
        activity({ project: "!", description: "break", activity: "" }),
        activity({ project: "", description: "no project", activity: "coding" }),
      ],
      latestProjAndDesc as Record<string, [string]>,
      latestProjAndAct as Record<string, [string]>,
    );

    expect(latestProjAndDesc).toEqual({ existing: ["desc"] });
    expect(latestProjAndAct).toEqual({ existing: ["act"] });
  });

  // @rule H6
  test("adds a new project when maps already have other keys", () => {
    const latestProjAndDesc: Record<string, string[]> = { existing: ["desc"] };
    const latestProjAndAct: Record<string, string[]> = { existing: ["act"] };

    addSuggestions(
      [activity({ project: "timetracker", activity: "coding", description: "feature" })],
      latestProjAndDesc as Record<string, [string]>,
      latestProjAndAct as Record<string, [string]>,
    );

    expect(latestProjAndDesc.timetracker).toEqual(["feature"]);
    expect(latestProjAndAct.timetracker).toEqual(["coding"]);
  });

  // @rule H6
  test("unshifts a new description and activity in front of existing ones", () => {
    const latestProjAndDesc: Record<string, string[]> = { timetracker: ["old"] };
    const latestProjAndAct: Record<string, string[]> = { timetracker: ["meeting"] };

    addSuggestions(
      [activity({ project: "timetracker", activity: "coding", description: "feature" })],
      latestProjAndDesc as Record<string, [string]>,
      latestProjAndAct as Record<string, [string]>,
    );

    expect(latestProjAndDesc.timetracker).toEqual(["feature", "old"]);
    expect(latestProjAndAct.timetracker).toEqual(["coding", "meeting"]);
  });

  // @rule H6
  test("moves an existing description and activity to the front", () => {
    const latestProjAndDesc: Record<string, string[]> = { timetracker: ["old", "feature"] };
    const latestProjAndAct: Record<string, string[]> = { timetracker: ["meeting", "coding"] };

    addSuggestions(
      [activity({ project: "timetracker", activity: "coding", description: "feature" })],
      latestProjAndDesc as Record<string, [string]>,
      latestProjAndAct as Record<string, [string]>,
    );

    expect(latestProjAndDesc.timetracker).toEqual(["feature", "old"]);
    expect(latestProjAndAct.timetracker).toEqual(["coding", "meeting"]);
  });
});

describe("parseReport/serializeReport round-trip", () => {
  // @rule S6
  test("preserves from, project, activity, description and isBreak", () => {
    const activities = [
      activity({
        id: 0,
        from: "09:00",
        to: "10:00",
        project: "timetracker",
        activity: "coding",
        description: "feature",
      }),
      activity({
        id: 1,
        from: "10:00",
        to: "10:30",
        project: "!",
        activity: "",
        description: "",
        isBreak: true,
      }),
      activity({ id: 2, from: "10:30", to: "12:00", project: "internal", activity: "review", description: "pr" }),
    ];

    const parsed = parseReport(serializeReport(activities))[0];

    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "09:00",
          to: "10:00",
          project: "timetracker",
          activity: "coding",
          description: "feature",
          isBreak: false,
        }),
        expect.objectContaining({
          from: "10:00",
          to: "10:30",
          isBreak: true,
        }),
        expect.objectContaining({
          from: "10:30",
          to: "12:00",
          project: "internal",
          activity: "review",
          description: "pr",
          isBreak: false,
        }),
      ]),
    );
  });
});
