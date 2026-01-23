import { render, screen, fireEvent, act } from "@testing-library/react";
import TrackTimeModal from "../TrackTimeModal";
import { TrackTimeModalProps } from "../types";
import "@testing-library/jest-dom";

import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

global.ipcRenderer = {
  invoke: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

const mockedActivities = [
  {
    id: 1,
    activity: "",
    description: "activity from description",
    duration: 3600000,
    from: "09:00",
    project: "timetracker.e",
    to: "10:00",
    validation: { isValid: true },
  },
  {
    id: 2,
    activity: "",
    description: "activity from description",
    duration: 3600000,
    from: "10:00",
    project: "timetracker.e",
    to: "11:00",
    validation: { isValid: true },
  },
  {
    id: 3,
    activity: "",
    description: "activity from description",
    duration: 3600000,
    from: "11:00",
    project: "timetracker.e",
    to: "12:00",
    validation: { isValid: true },
  },
];

const day = 60 * 60 * 24 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - day);

const mockedProps: TrackTimeModalProps = {
  activities: mockedActivities,
  isOpen: true,
  editedActivity: "new",
  latestProjAndAct: {
    internal: [""],
    hr: [""],
  },
  latestProjAndDesc: {
    internal: [""],
    hr: [""],
  },
  close: jest.fn(),
  submitActivity: jest.fn(),
  selectedDate: new Date(),
};

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("toInput prefilled value depends on the date", () => {
  window.ResizeObserver = ResizeObserver;

  test("should be preffiled if today date", async () => {
    await act(async () => render(<TrackTimeModal {...mockedProps} />));

    const toInput = screen.getByLabelText("To");

    expect(toInput).not.toHaveValue("");
  });

  test("shouldn't be preffiled if not today date", async () => {
    const mockedPropsYesterday = { ...mockedProps, selectedDate: yesterday };
    await act(async () => render(<TrackTimeModal {...mockedPropsYesterday} />));
    const toInput = screen.getByLabelText("To");

    expect(toInput).toHaveValue("");
  });
});

describe("durationInput changing", () => {
  test("should changes toInput value correctly", async () => {
    await act(async () => render(<TrackTimeModal {...mockedProps} />));

    const durationInput = screen.getByLabelText("Duration");
    const toInput = screen.getByLabelText("To");

    fireEvent.change(durationInput, { target: { value: "2h" } });
    expect(toInput).toHaveValue("14:00");

    fireEvent.change(durationInput, { target: { value: "5" } });
    expect(toInput).toHaveValue("17:00");

    fireEvent.change(durationInput, { target: { value: "20m" } });
    expect(toInput).toHaveValue("12:20");

    // if user inputted more than 24 - transform to minutes
    fireEvent.change(durationInput, { target: { value: "25" } });
    expect(toInput).toHaveValue("12:25");

    // if total hours more than 24 - set 23:59
    fireEvent.change(durationInput, { target: { value: "20h" } });
    expect(toInput).toHaveValue("23:59");

    fireEvent.change(durationInput, { target: { value: "0" } });
    expect(toInput).toHaveValue("12:00");

    fireEvent.change(durationInput, { target: { value: "" } });
    expect(toInput).toHaveValue("12:00");

    fireEvent.change(durationInput, { target: { value: "-" } });
    expect(toInput).toHaveValue("12:00");

    fireEvent.change(durationInput, { target: { value: "-2" } });
    expect(toInput).toHaveValue("10:00");

    // maximum can roll back to 00:00
    fireEvent.change(durationInput, { target: { value: "-20h" } });
    expect(toInput).toHaveValue("00:00");
  });
});
