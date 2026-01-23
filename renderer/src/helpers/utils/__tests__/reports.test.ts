import {
  calcDurationBetweenTimes,
  formatDuration,
  parseReport,
  serializeReport,
  checkIntersection,
  validation,
} from "../reports";
import { ReportActivity } from "../types";

const parsedReport = (activity) => parseReport(activity)[0];
const useFakeTime = () => jest.useFakeTimers().setSystemTime(new Date("2013-05-05"));

describe("parseReport function", () => {
  test("should return empty collection when null or empty string is passed", () => {
    expect(parseReport(undefined)).toStrictEqual([]);
    expect(parseReport(null)).toStrictEqual([]);
    expect(parseReport("")).toStrictEqual([]);
  });

  test("should skip lines which are not started from time pattern hh:mm", () => {
    expect(parsedReport("skip this line\nand this line")).toStrictEqual([]);
  });

  test("should extract [project name], [activity name] and [description] from registration", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - activity - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
    expect(registration).toHaveProperty("activity", "activity");
    expect(registration).toHaveProperty("description", "description");
  });

  test("should support spaces in [project name], [activity name] and [description]", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - pro ject - act ivity - des cription\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "pro ject");
    expect(registration).toHaveProperty("activity", "act ivity");
    expect(registration).toHaveProperty("description", "des cription");
  });

  test("should extract [project name] when [activity] and [description] are not set", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
  });

  test("should extract [project name] and [description] when [activity] is not set", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
    expect(registration).toHaveProperty("description", "description");
  });

  test("should lowercase project name", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("project", "project");
  });

  test("should keep activity name case sensitive after 26 Aug 2016", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("activity", "ActIvItY");
  });

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

  // should set IsWorkingTime to False when line stars from ! - on C# tests
  test("should set isBreak to true when line stars from !", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - !\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("isBreak", true);
  });

  test("should parse time", () => {
    const dayReport = parsedReport("18:00 2013-05-05 - project - activity - description\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("from", "18:00");
    expect(registration).toHaveProperty("to", "19:00");
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

    for (let description of descriptions) {
      const dayReport = parsedReport("18:00 2013-05-05 - pro.ject - act.ivity - " + description + "\n19:00 2013-05-05");
      const registration = dayReport[0];

      expect(dayReport.length).toBeGreaterThan(0);
      expect(registration).toHaveProperty("description", description);
    }
  });

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

  test("parser should recognize 3rd dash as separator before 23 Aug 2016", () => {
    useFakeTime();
    const dayReport = parsedReport("18:00 - project - description with some -dash- delimited-text\n19:00 - \n20:00");
    const registration = dayReport[0];

    expect(registration).toHaveProperty("activity", "description with some");
    expect(registration).toHaveProperty("description", "dash- delimited-text");
  });

  test("should lowercase activity name before 26 Aug 2016", () => {
    useFakeTime();
    const dayReport = parsedReport("18:00 2013-05-05 - prOjEct - ActIvItY - dEscrIptIOn\n19:00 2013-05-05");
    const registration = dayReport[0];

    expect(dayReport.length).toBeGreaterThan(0);
    expect(registration).toHaveProperty("activity", "activity");
  });
});

describe("serializeReport function", () => {
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
  test("should return same as report", () => {
    const report: string =
      "08:30 - westbay.dg - Grid layout.\n15:00 - internal.trainee - Meet with alexander.razvalinov.\n16:00 - westbay.dg - Grid layout.\n18:00 - !\n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
  test("should return same as report", () => {
    const report: string =
      "09:00 - !\n10:15 - qqwe - qwe\n10:30 - qqwe - qwe\n11:00 - !\n11:30 - qew - qwe\n12:00 - !\n12:30 - qqwe - qwe\n13:00 - qweqq - qe\n14:00 - !\n14:30 - 12321 - qwe\n15:00 - \n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
  test("should return same as report", () => {
    const report: string =
      "09:30 - westbay.dg - Case images block rework.\n12:30 - westbay.dg - Fixing trailer list component and upload it to backend.\n16:30 - westbay.dg - Text list editor changing.\n17:30 - westbay.dg - Case Images fix after review.\n18:00 - !\n";
    expect(serializeReport(parseReport(report)[0])).toBe(report);
  });
});

describe("calcDurationBetweenTimes function", () => {
  test("should return null when [from] or/and [to] properties are undefined", () => {
    expect(calcDurationBetweenTimes(undefined, "10:00")).toBeNull();
    expect(calcDurationBetweenTimes("10:00", undefined)).toBeNull();
    expect(calcDurationBetweenTimes(undefined, undefined)).toBeNull();
  });

  test("should return result of [to] - [from] in milliseconds", () => {
    expect(calcDurationBetweenTimes("10:00", "10:10")).toBe(600000);
  });

  test("should return result [to] - [from] in milliseconds when hour = 0", () => {
    expect(calcDurationBetweenTimes("00:10", "00:20")).toBe(600000);
  });
});

describe("formatDuration function", () => {
  // test("should return undefined when [ms] = undefined", () => {
  //   expect(formatDuration(undefined)).toBeUndefined();
  // });

  test("should return 0m when [ms] < 1m", () => {
    expect(formatDuration(1000)).toBe("0m");
  });

  test("should return minutes when [ms] < 1h", () => {
    const ms: number = 2000000;
    const minutes: number = ms / 1000 / 60;
    expect(formatDuration(ms)).toBe(Math.round(minutes) + "m");
  });

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
  test("should return false when [previousTo] lower than [currentFrom]", () => {
    expect(checkIntersection("10:00", "11:00")).toBeFalsy();
  });

  test("should return true when [previousTo] higher than [currentFrom]", () => {
    expect(checkIntersection("11:00", "10:00")).toBeTruthy();
  });
});

describe("validation function", () => {
  test("should fail validation when [activity[i - 1].to < activity[i].from]", () => {
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
});
