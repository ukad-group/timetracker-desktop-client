import TimeBadge from "../TimeBadge";
import { TimeBadgeProps } from "../types";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

global.ipcRenderer = {
  ...globalIpcRendererMock,
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
};

const day = 60 * 60 * 24 * 1000;
const today = new Date();
const yesterday = new Date(today.getTime() - day);

const yesterdayLess6MockedProps: TimeBadgeProps = {
  hours: 5,
  startTime: "08:00",
  selectedDate: yesterday,
};
const yesterdayLess8MockedProps: TimeBadgeProps = {
  hours: 7,
  startTime: "08:00",
  selectedDate: yesterday,
};

const todayStartWorkLess6MockedProps: TimeBadgeProps = {
  hours: 5,
  startTime: "10:00",
  selectedDate: today,
};
const todayStartWorkLess8MockedProps: TimeBadgeProps = {
  hours: 7,
  startTime: "10:00",
  selectedDate: today,
};

const todayEndWorkLess6MockedProps: TimeBadgeProps = {
  hours: 5,
  startTime: "02:00",
  selectedDate: today,
};
const todayEndWorkLess8MockedProps: TimeBadgeProps = {
  hours: 7,
  startTime: "02:00",
  selectedDate: today,
};
const yesterdayMore8MockedProps: TimeBadgeProps = {
  hours: 9,
  startTime: "10:00",
  selectedDate: yesterday,
};
const todayMore8MockedProps: TimeBadgeProps = {
  hours: 9,
  startTime: "10:00",
  selectedDate: today,
};

const useFakeTime = () => {
  const currentDateTime = new Date();
  currentDateTime.setHours(11, 30);

  jest.useFakeTimers();
  jest.setSystemTime(currentDateTime);
};
useFakeTime();

describe("GIVEN TimeBadge: badge for the previous day", () => {
  test("should render 'less than 6h' when hours are less than 6", () => {
    render(<TimeBadge {...yesterdayLess6MockedProps} />);

    const element = screen.getByTestId("sixHoursBadge");
    expect(element).toBeInTheDocument();
  });

  test("should render 'less than 8h' when hours are less than 8", () => {
    render(<TimeBadge {...yesterdayLess8MockedProps} />);

    const element = screen.getByTestId("eightHoursBadge");
    expect(element).toBeInTheDocument();
  });
  test("should not render 'less than 6h' when hours are less than 6", () => {
    render(<TimeBadge {...yesterdayMore8MockedProps} />);

    const element = screen.queryByTestId("sixHoursBadge");
    expect(element).not.toBeInTheDocument();
  });

  test("should not render 'less than 8h' when hours are less than 8", () => {
    render(<TimeBadge {...yesterdayMore8MockedProps} />);

    const element = screen.queryByTestId("eightHoursBadge");
    expect(element).not.toBeInTheDocument();
  });
});

describe("GIVEN TimeBadge: badge for the today morning", () => {
  test("should not render 'less than 6h' when hours are less than 6", () => {
    render(<TimeBadge {...todayStartWorkLess6MockedProps} />);

    const element = screen.queryByTestId("sixHoursBadge");
    expect(element).not.toBeInTheDocument();
  });

  test("should not render 'less than 8h' when hours are less than 6", () => {
    render(<TimeBadge {...todayStartWorkLess6MockedProps} />);

    const element = screen.queryByTestId("eightHoursBadge");
    expect(element).not.toBeInTheDocument();
  });

  test("should not render 'less than 8h' when hours are less than 8", () => {
    render(<TimeBadge {...todayStartWorkLess8MockedProps} />);

    const element = screen.queryByTestId("eightHoursBadge");
    expect(element).not.toBeInTheDocument();
  });
});

describe("GIVEN TimeBadge: badge for the today evening", () => {
  test("should render 'less than 6h' when hours are less than 6", () => {
    render(<TimeBadge {...todayEndWorkLess6MockedProps} />);

    const element = screen.getByTestId("sixHoursBadge");
    expect(element).toBeInTheDocument();
  });

  test("should render 'less than 8h' when hours are less than 8", () => {
    render(<TimeBadge {...todayEndWorkLess8MockedProps} />);

    const element = screen.getByTestId("eightHoursBadge");
    expect(element).toBeInTheDocument();
  });
  test("should not render 'less than 6h' when hours are less than 6", () => {
    render(<TimeBadge {...todayMore8MockedProps} />);

    const element = screen.queryByTestId("sixHoursBadge");
    expect(element).not.toBeInTheDocument();
  });
  test("should not render 'less than 8h' when hours are less than 8", () => {
    render(<TimeBadge {...todayMore8MockedProps} />);

    const element = screen.queryByTestId("eightHoursBadge");
    expect(element).not.toBeInTheDocument();
  });
});
