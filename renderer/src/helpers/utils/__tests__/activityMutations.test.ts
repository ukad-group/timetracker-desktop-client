import { Dispatch, SetStateAction } from "react";
import { addPastTime, editActivity } from "../utils";
import { ReportActivity } from "../types";
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
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

const activity = (overrides: Partial<ReportActivity> = {}): ReportActivity => ({
  id: 1,
  from: "10:00",
  to: "11:00",
  duration: 3600000,
  project: "timetracker",
  activity: "coding",
  description: "feature",
  validation: { isValid: true },
  ...overrides,
});

const applyUpdater = (current: ReportActivity[]) => {
  let next = current;

  const setSelectedDateActivities: Dispatch<SetStateAction<ReportActivity[]>> = jest.fn((updater) => {
    next = typeof updater === "function" ? updater(current) : updater;
  });

  return { setSelectedDateActivities, getNext: () => next };
};

describe("GIVEN utils/editActivity", () => {
  it("returns false when the activity id is missing", () => {
    const selected = [activity({ id: 1 })];
    const setSelectedDateActivities = jest.fn();
    const setShouldAutosave = jest.fn();

    const result = editActivity(activity({ id: 99 }), selected, setSelectedDateActivities, setShouldAutosave);

    expect(result).toBe(false);
    expect(setSelectedDateActivities).not.toHaveBeenCalled();
    expect(setShouldAutosave).not.toHaveBeenCalled();
  });

  it("does not change activities when every field is unchanged", () => {
    const selected = [activity({ id: 1 })];
    const { setSelectedDateActivities, getNext } = applyUpdater(selected);
    const setShouldAutosave = jest.fn();

    const result = editActivity(selected[0], selected, setSelectedDateActivities, setShouldAutosave);

    expect(result).toBe(true);
    expect(getNext()).toBe(selected);
    expect(setShouldAutosave).toHaveBeenCalledWith(true);
  });

  it("updates the matching row", () => {
    const selected = [activity({ id: 1, description: "old" })];
    const { setSelectedDateActivities, getNext } = applyUpdater(selected);
    const setShouldAutosave = jest.fn();
    const updated = activity({ id: 1, description: "new" });

    const result = editActivity(updated, selected, setSelectedDateActivities, setShouldAutosave);

    expect(result).toBe(true);
    expect(getNext()[0].description).toBe("new");
    expect(setShouldAutosave).toHaveBeenCalledWith(true);
  });

  it("adjusts neighboring breaks when the edited activity times change", () => {
    const selected = [
      activity({ id: 1, from: "09:00", to: "10:00", isBreak: true, project: "!" }),
      activity({ id: 2, from: "10:00", to: "11:00" }),
      activity({ id: 3, from: "11:00", to: "12:00", isBreak: true, project: "!" }),
    ];
    const { setSelectedDateActivities, getNext } = applyUpdater(selected);
    const setShouldAutosave = jest.fn();

    editActivity(
      activity({ id: 2, from: "09:30", to: "11:30" }),
      selected,
      setSelectedDateActivities,
      setShouldAutosave,
    );

    const next = getNext();
    expect(next[0].to).toBe("09:30");
    expect(next[1].from).toBe("09:30");
    expect(next[1].to).toBe("11:30");
    expect(next[2].from).toBe("11:30");
  });
});

describe("GIVEN utils/addPastTime", () => {
  it("inserts the activity before the first row when it starts earlier", () => {
    const selected = [activity({ id: 1, from: "10:00", to: "11:00" })];
    const incoming = activity({ id: 2, from: "09:00", to: "09:30" });
    const setSelectedDateActivities = jest.fn();

    const result = addPastTime(incoming, [], selected, setSelectedDateActivities);

    expect(result).toBe(true);
    expect(setSelectedDateActivities).toHaveBeenCalledWith([incoming, ...selected]);
  });

  it("inserts into a break gap", () => {
    const selected = [
      activity({ id: 1, from: "09:00", to: "10:00" }),
      activity({ id: 2, from: "10:00", to: "11:00", isBreak: true, project: "!" }),
      activity({ id: 3, from: "11:00", to: "12:00" }),
    ];
    const incoming = activity({ id: 4, from: "10:15", to: "10:45" });
    const setSelectedDateActivities = jest.fn();

    const result = addPastTime(incoming, [], selected, setSelectedDateActivities);

    expect(result).toBe(true);
    expect(setSelectedDateActivities).toHaveBeenCalledWith([selected[0], incoming, selected[2]]);
  });

  it("returns false and does not call the setter when the activity is not in the past", () => {
    const selected = [activity({ id: 1, from: "09:00", to: "10:00" })];
    const incoming = activity({ id: 2, from: "11:00", to: "12:00" });
    const setSelectedDateActivities = jest.fn();

    const result = addPastTime(incoming, [], selected, setSelectedDateActivities);

    expect(result).toBe(false);
    expect(setSelectedDateActivities).not.toHaveBeenCalled();
  });
});
