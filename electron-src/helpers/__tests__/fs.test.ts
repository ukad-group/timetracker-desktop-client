import fs from "fs";
import path from "path";
import { createDirByPath, searchReadFiles } from "../fs";

jest.mock("fs");

const mockedFs = fs as jest.Mocked<typeof fs>;
const readdirSyncMock = mockedFs.readdirSync as unknown as jest.MockedFunction<(path: fs.PathLike) => string[]>;
const readFileSyncMock = mockedFs.readFileSync as unknown as jest.MockedFunction<
  (path: fs.PathLike, encoding: BufferEncoding) => string
>;

describe("GIVEN fs/createDirByPath", () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReset();
    mockedFs.mkdirSync.mockReset();
  });

  it("creates missing path segments", () => {
    mockedFs.existsSync.mockReturnValue(false);

    createDirByPath("reports/2026/week 06");

    expect(mockedFs.mkdirSync).toHaveBeenCalledTimes(3);
    expect(mockedFs.mkdirSync).toHaveBeenNthCalledWith(1, "reports/");
    expect(mockedFs.mkdirSync).toHaveBeenNthCalledWith(2, "reports/2026/");
    expect(mockedFs.mkdirSync).toHaveBeenNthCalledWith(3, "reports/2026/week 06/");
  });

  it("does not create a segment that already exists", () => {
    mockedFs.existsSync.mockImplementation((segment) => segment === "reports/");

    createDirByPath("reports/2026/week 06");

    expect(mockedFs.mkdirSync).toHaveBeenCalledTimes(2);
    expect(mockedFs.mkdirSync).not.toHaveBeenCalledWith("reports/");
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("reports/2026/");
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("reports/2026/week 06/");
  });
});

describe("GIVEN fs/searchReadFiles", () => {
  const directory = "/reports";
  const reportContent = "09:00 - project - activity - description\n10:00 - !";

  beforeEach(() => {
    readdirSyncMock.mockReset();
    readFileSyncMock.mockReset();
  });

  it("reads valid timereport files for the requested year and week", () => {
    readdirSyncMock.mockImplementation((dir) => {
      if (dir === directory) return ["2026", "2025"];
      if (dir === `${directory}/2026`) return ["week 06", "week 07"];
      if (dir === `${directory}/2026/week 06`) {
        return ["timereport - 20260207", "notes.txt"];
      }

      return [];
    });
    readFileSyncMock.mockReturnValue(reportContent);

    const reports = searchReadFiles(directory, [{ year: "2026", week: "06" }]);

    expect(reports).toEqual([
      {
        data: reportContent,
        reportDate: "20260207",
      },
    ]);
    expect(readFileSyncMock).toHaveBeenCalledWith(
      path.join(`${directory}/2026/week 06`, "timereport - 20260207"),
      "utf8"
    );
  });

  it("skips files whose ISO week does not match the query week", () => {
    readdirSyncMock.mockImplementation((dir) => {
      if (dir === directory) return ["2026"];
      if (dir === `${directory}/2026`) return ["week 06"];
      if (dir === `${directory}/2026/week 06`) {
        return ["timereport - 20260101"];
      }

      return [];
    });

    const reports = searchReadFiles(directory, [{ year: "2026", week: "06" }]);

    expect(reports).toEqual([]);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("skips missing year or week folders", () => {
    readdirSyncMock.mockReturnValue(["2026"]);

    expect(
      searchReadFiles(directory, [
        { year: "2025", week: "01" },
        { year: "2026", week: "99" },
      ])
    ).toEqual([]);
  });
});
