import fs from "fs";
import { parseReportsInfo } from "../parseReportsInfo";
import { getPathFromDate } from "../datetime";

jest.mock("fs");

const mockedFs = fs as jest.Mocked<typeof fs>;
const readFileSyncMock = mockedFs.readFileSync as unknown as jest.MockedFunction<
  (path: fs.PathLike, encoding?: BufferEncoding) => string
>;

const REPORTS_FOLDER = "/reports";
const SELECTED_DATE = new Date(2026, 1, 7);

const pathForDaysAgo = (daysAgo: number) => {
  const date = new Date(SELECTED_DATE);
  date.setDate(date.getDate() - daysAgo);
  return getPathFromDate(date, REPORTS_FOLDER);
};

describe("GIVEN parseReportsInfo", () => {
  beforeEach(() => {
    readFileSyncMock.mockReset();
    readFileSyncMock.mockImplementation(() => {
      throw new Error("ENOENT");
    });
  });

  // @rule H3
  it("keeps the default internal and hr keys when no reports exist", () => {
    const result = parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(result).toEqual({
      internal: [],
      hr: [],
    });
  });

  // @rule H1
  it("skips missing files and still reads the 31 previous days", () => {
    parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(readFileSyncMock).toHaveBeenCalledTimes(31);
    expect(readFileSyncMock).toHaveBeenCalledWith(pathForDaysAgo(1), "utf8");
    expect(readFileSyncMock).toHaveBeenCalledWith(pathForDaysAgo(31), "utf8");
    expect(readFileSyncMock).not.toHaveBeenCalledWith(
      getPathFromDate(SELECTED_DATE, REPORTS_FOLDER),
      "utf8"
    );
  });

  // @rule H1
  it("does not include activities from the selected day's report even if the file exists", () => {
    readFileSyncMock.mockImplementation((filePath) => {
      if (filePath === getPathFromDate(SELECTED_DATE, REPORTS_FOLDER)) {
        return "09:00 - today-only - coding - feature\n10:00 - !";
      }
      throw new Error("ENOENT");
    });

    const result = parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(result["today-only"]).toBeUndefined();
    expect(readFileSyncMock).not.toHaveBeenCalledWith(
      getPathFromDate(SELECTED_DATE, REPORTS_FOLDER),
      "utf8"
    );
  });

  // @rule H2, H4
  it("parses 2-part, 3-part and 4-part lines and skips breaks", () => {
    readFileSyncMock.mockImplementation((filePath) => {
      if (filePath === pathForDaysAgo(1)) {
        return [
          "a comment line",
          "09:00 - project-a - coding - feature",
          "10:30 - project-b - standup notes",
          "11:00 - project-c",
          "12:00 - !",
          "13:00 - !internal",
        ].join("\n");
      }

      throw new Error("ENOENT");
    });

    const result = parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(result["project-a"]).toEqual([
      {
        activity: "coding",
        description: "feature",
        duration: 1.5,
      },
    ]);
    expect(result["project-b"]).toEqual([
      {
        activity: "",
        description: "standup notes",
        duration: 0.5,
      },
    ]);
    expect(result["project-c"]).toEqual([
      {
        activity: "",
        description: "",
        duration: 1,
      },
    ]);
    expect(result["!"]).toBeUndefined();
    expect(result["!internal"]).toBeUndefined();
    expect(result.internal).toEqual([]);
  });

  it("appends further activities to an existing project", () => {
    readFileSyncMock.mockImplementation((filePath) => {
      if (filePath === pathForDaysAgo(1)) {
        return ["09:00 - project-a - coding - feature", "10:00 - project-a - review - pr", "11:00 - !"].join(
          "\n"
        );
      }

      throw new Error("ENOENT");
    });

    const result = parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(result["project-a"]).toEqual([
      {
        activity: "coding",
        description: "feature",
        duration: 1,
      },
      {
        activity: "review",
        description: "pr",
        duration: 1,
      },
    ]);
  });

  // @rule H5
  it("uses 0 duration when the next line has no start time", () => {
    readFileSyncMock.mockImplementation((filePath) => {
      if (filePath === pathForDaysAgo(1)) {
        return "09:00 - project-a - coding - feature";
      }

      throw new Error("ENOENT");
    });

    const result = parseReportsInfo(REPORTS_FOLDER, SELECTED_DATE);

    expect(result["project-a"][0].duration).toBe(0);
  });
});
