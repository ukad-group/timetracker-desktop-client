import { ReportActivity } from "@/helpers/utils/types";
import { getDayValidationTitle, getFormattedReports } from "../utils";

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

describe("getDayValidationTitle", () => {
  test("returns an empty string when all activities are valid", () => {
    expect(getDayValidationTitle([activity()])).toBe("");
  });

  test("includes the time range and validation message for an invalid activity", () => {
    expect(
      getDayValidationTitle([
        activity({
          validation: { isValid: false, description: "Negative or zero duration" },
        }),
      ]),
    ).toBe("09:00 - 10:00: Negative or zero duration");
  });

  test("lists each invalid activity on its own line", () => {
    expect(
      getDayValidationTitle([
        activity({
          from: "09:00",
          to: "10:00",
          validation: { isValid: false, description: "The project must be specified in the activity" },
        }),
        activity({
          id: 2,
          from: "11:00",
          to: "12:00",
          validation: { isValid: true },
        }),
        activity({
          id: 3,
          from: "14:00",
          to: "15:00",
          validation: { isValid: false, description: "Negative or zero duration" },
        }),
      ]),
    ).toBe("09:00 - 10:00: The project must be specified in the activity\n14:00 - 15:00: Negative or zero duration");
  });
});

describe("getFormattedReports", () => {
  test("sets a validation title when a day has invalid activities", () => {
    const [report] = getFormattedReports([
      {
        reportDate: "20260207",
        data: "09:00 - timetracker - coding - feature\n09:00 - !",
      },
    ]);

    expect(report.isValid).toBe(false);
    expect(report.validationTitle).toBe("09:00 - 09:00: Negative or zero duration");
  });

  test("does not treat a missing activity and description as a calendar error", () => {
    const [report] = getFormattedReports([
      {
        reportDate: "20260207",
        data: "09:00 - timetracker\n10:00 - !",
      },
    ]);

    expect(report.isValid).toBe(true);
    expect(report.validationTitle).toBe("");
  });

  test("leaves the validation title empty when the day is valid", () => {
    const [report] = getFormattedReports([
      {
        reportDate: "20260207",
        data: "09:00 - timetracker - coding - feature\n10:00 - !",
      },
    ]);

    expect(report.isValid).toBe(true);
    expect(report.validationTitle).toBe("");
  });

  test("flags a day when a break goes backwards and work intervals overlap", () => {
    const [report] = getFormattedReports([
      {
        reportDate: "20260207",
        data: [
          "09:00 - fraktus - calc - Calc UI accessibility improvements",
          "14:00 - !",
          "13:00 - fraktus - test",
          "16:45 - ",
        ].join("\n"),
      },
    ]);

    expect(report.isValid).toBe(false);
    expect(report.validationTitle).toBe(
      [
        "09:00 - 14:00: Intersection of time intervals",
        "14:00 - 13:00: Negative or zero duration",
        "13:00 - 16:45: Intersection of time intervals",
      ].join("\n"),
    );
  });
});
