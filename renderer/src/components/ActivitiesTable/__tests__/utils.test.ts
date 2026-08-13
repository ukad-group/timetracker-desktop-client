import { formatEvents, getActualEvents, getTotalDuration } from "../utils";
import { getTimeFromEventObj } from "@/helpers/utils/datetime-ui";
import { ReportActivity } from "@/helpers/utils/types";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

global.ipcRenderer = {
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: jest.fn().mockReturnValue(null),
  ...globalIpcRendererMock,
};

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

const calendarEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "event-1",
  summary: "timetracker - coding - feature",
  start: { dateTime: "2022-01-01T10:00:00" },
  end: { dateTime: "2022-01-01T11:00:00" },
  ...overrides,
});

describe("GIVEN ActivitiesTable/getTotalDuration", () => {
  it("sums activity durations", () => {
    expect(getTotalDuration([activity({ duration: 1000 }), activity({ duration: 2500 })])).toBe(3500);
  });

  it("treats missing or zero duration as 0", () => {
    expect(
      getTotalDuration([
        activity({ duration: 1000 }),
        activity({ duration: 0 }),
        activity({ duration: undefined as unknown as number }),
      ]),
    ).toBe(1000);
  });
});

describe("GIVEN ActivitiesTable/formatEvents", () => {
  afterAll(() => {
    global.ipcRenderer = globalIpcRendererMock;
  });

  it("returns an empty array when there are no events", () => {
    expect(formatEvents([], {})).toEqual([]);
  });

  it("maps events to activities with negative ids and duration from from/to", () => {
    const events = [
      calendarEvent({ id: "first" }),
      calendarEvent({
        id: "second",
        start: { dateTime: "2022-01-01T12:00:00", timeZone: "UTC" },
        end: { dateTime: "2022-01-01T13:30:00", timeZone: "UTC" },
      }),
    ];

    const result = formatEvents(events, {});

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: -1,
        calendarId: "first",
        from: getTimeFromEventObj("2022-01-01T10:00:00"),
        to: getTimeFromEventObj("2022-01-01T11:00:00"),
        duration: 3600000,
        project: "timetracker",
        activity: "coding",
        description: "feature",
        validation: { isValid: true },
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: -2,
        calendarId: "second",
        from: getTimeFromEventObj("2022-01-01T12:00:00Z"),
        to: getTimeFromEventObj("2022-01-01T13:30:00Z"),
        duration: 5400000,
      }),
    );
  });
});

describe("GIVEN ActivitiesTable/getActualEvents", () => {
  it("returns an empty array when there are no events", () => {
    expect(getActualEvents([], [activity()])).toEqual([]);
  });

  it("drops events whose end is already covered by an activity to time", () => {
    const events = [calendarEvent({ end: { dateTime: "2022-01-01T10:00:00" } })];
    const activities = [activity({ to: "11:00" })];

    expect(getActualEvents(events, activities)).toEqual([]);
  });

  it("keeps events that do not overlap an activity end time", () => {
    const events = [calendarEvent({ id: "keep-me", end: { dateTime: "2022-01-01T12:00:00" } })];
    const activities = [activity({ to: "10:00" })];

    expect(getActualEvents(events, activities)).toEqual(events);
  });

  it("drops events without an end dateTime", () => {
    expect(getActualEvents([calendarEvent({ end: {} })], [activity()])).toEqual([]);
  });
});
