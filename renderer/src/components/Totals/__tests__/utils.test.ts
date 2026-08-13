import { createEnding, getDates, getTotals } from "../utils";
import { getMonthDates, getWeekDates } from "@/helpers/utils/datetime-ui";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

const invokeMock = jest.fn();

global.ipcRenderer = {
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  invoke: invokeMock,
  ...globalIpcRendererMock,
};

describe("GIVEN Totals/getDates", () => {
  const selectedDate = new Date(2026, 1, 7);

  it("returns the selected date for day", () => {
    expect(getDates("day", selectedDate)).toEqual([selectedDate]);
  });

  it("returns the selected date for an unknown period", () => {
    expect(getDates("unknown", selectedDate)).toEqual([selectedDate]);
  });

  it("returns week dates for week", () => {
    expect(getDates("week", selectedDate)).toEqual(getWeekDates(selectedDate));
  });

  it("returns month dates for month", () => {
    expect(getDates("month", selectedDate)).toEqual(getMonthDates(selectedDate));
  });
});

describe("GIVEN Totals/createEnding", () => {
  it("uses st, nd, rd and th suffixes", () => {
    expect(createEnding(1)).toBe("1st");
    expect(createEnding(2)).toBe("2nd");
    expect(createEnding(3)).toBe("3rd");
    expect(createEnding(4)).toBe("4th");
    expect(createEnding(21)).toBe("21st");
    expect(createEnding(22)).toBe("22nd");
    expect(createEnding(23)).toBe("23rd");
  });

  it("uses th for 11th through 13th", () => {
    expect(createEnding(11)).toBe("11th");
    expect(createEnding(12)).toBe("12th");
    expect(createEnding(13)).toBe("13th");
  });
});

describe("GIVEN Totals/getTotals", () => {
  const selectedDate = new Date(2026, 1, 7);
  const dayReport = [
    "09:00 - zebra - coding - feature",
    "10:00 - alpha - meeting - standup",
    "11:00 - alpha - meeting - standup",
    "12:00 - !",
    "13:00 - zebra - review - pr",
    "14:00 - !",
  ].join("\n");

  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue(dayReport);
  });

  afterAll(() => {
    global.ipcRenderer = globalIpcRendererMock;
  });

  it("aggregates projects, skips breaks, merges descriptions and sorts by name", async () => {
    const setTotals = jest.fn();

    await getTotals({
      period: "day",
      selectedDate,
      reportsFolder: "/reports",
      setTotals,
    });

    expect(invokeMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT, "/reports", selectedDate);

    const totals = setTotals.mock.calls[0][0];

    expect(totals.map((total) => total.name)).toEqual(["alpha", "zebra"]);
    expect(totals[0]).toEqual(
      expect.objectContaining({
        id: "alpha",
        name: "alpha",
        duration: 7200000,
        descriptions: [
          {
            id: "meeting - standup",
            name: "meeting - standup",
            duration: 7200000,
          },
        ],
      }),
    );
    expect(totals[0].activities).toEqual([
      {
        id: "meeting",
        name: "meeting",
        duration: 7200000,
        descriptions: [
          {
            id: "standup",
            name: "standup",
            duration: 7200000,
          },
        ],
      },
    ]);
    expect(totals[1].duration).toBe(7200000);
    expect(totals[1].descriptions).toEqual([
      { id: "coding - feature", name: "coding - feature", duration: 3600000 },
      { id: "review - pr", name: "review - pr", duration: 3600000 },
    ]);
    expect(totals[1].activities.map((item) => item.name)).toEqual(["coding", "review"]);
  });
});
