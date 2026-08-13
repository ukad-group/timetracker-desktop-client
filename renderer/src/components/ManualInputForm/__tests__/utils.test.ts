import { getCurrentCursorLineValue, getReportWithCopiedLine } from "../utils";

jest.mock("@/helpers/utils/datetime-ui", () => ({
  ...jest.requireActual("@/helpers/utils/datetime-ui"),
  getCurrentTimeRoundedUp: jest.fn(() => "15:00"),
}));

const report = ["09:00 - timetracker - coding - feature", "10:00 - internal - review - pr", "11:00 - !"].join("\n");

const textareaAt = (selectionStart: number): HTMLTextAreaElement => ({ selectionStart }) as HTMLTextAreaElement;

describe("GIVEN ManualInputForm/getCurrentCursorLineValue", () => {
  it("returns the first line when the cursor is at the start", () => {
    expect(getCurrentCursorLineValue(textareaAt(0), report)).toBe("09:00 - timetracker - coding - feature");
  });

  it("returns the middle line when the cursor is on it", () => {
    const middleLineStart = report.indexOf("10:00");

    expect(getCurrentCursorLineValue(textareaAt(middleLineStart + 3), report)).toBe("10:00 - internal - review - pr");
  });

  it("returns the last line when the cursor is past the last newline", () => {
    expect(getCurrentCursorLineValue(textareaAt(report.length), report)).toBe("11:00 - !");
  });
});

describe("GIVEN ManualInputForm/getReportWithCopiedLine", () => {
  it("copies a 4-part registration onto the last break", () => {
    const result = getReportWithCopiedLine("09:00 - timetracker - coding - feature", report);

    expect(result).toContain("09:00 - timetracker - coding - feature");
    expect(result).toContain("10:00 - internal - review - pr");
    expect(result).toContain("11:00 - timetracker - coding - feature");
    expect(result).toContain("15:00 -");
    expect(result).not.toContain("11:00 - !");
  });

  it("copies a 3-part registration when the last activity is not a break", () => {
    const openReport = ["09:00 - timetracker - coding - feature", "10:00 - internal - review - pr"].join("\n");

    const result = getReportWithCopiedLine("09:00 - timetracker - standup notes", openReport);

    expect(result).toContain("10:00 - internal - review - pr");
    expect(result).toContain("15:00 - timetracker - standup notes");
  });

  it("returns the original report when the cursor is on a comment", () => {
    expect(getReportWithCopiedLine("a comment line", report)).toBe(report);
  });

  it("does not copy an empty end-of-day marker", () => {
    expect(getReportWithCopiedLine("18:00 - ", report)).toBe(report);
    expect(getReportWithCopiedLine("18:00 -", report)).toBe(report);
  });
});
