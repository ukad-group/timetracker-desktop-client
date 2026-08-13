import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActivitiesTable from "../ActivitiesTable";
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

jest.mock("@/shared/Hint", () => ({
  Hint: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

global.ipcRenderer = {
  invoke: jest.fn().mockResolvedValue(null),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  ...globalIpcRendererMock,
};

const activity = (overrides: Partial<ReportActivity> = {}): ReportActivity => ({
  id: 1,
  from: "09:00",
  to: "10:00",
  duration: 3600000,
  project: "timetracker",
  activity: "coding",
  description: "feature work",
  validation: { isValid: true },
  ...overrides,
});

const activities = [
  activity({ id: 1, from: "09:00", to: "10:00", description: "feature work" }),
  activity({ id: 2, from: "10:00", to: "11:00", project: "internal", activity: "review", description: "pull request" }),
];

describe("GIVEN ActivitiesTable", () => {
  afterAll(() => {
    global.ipcRenderer = globalIpcRendererMock;
  });

  it("renders activities and calls onEditActivity when a row is edited", () => {
    const onEditActivity = jest.fn();

    render(
      <ActivitiesTable
        activities={activities}
        validatedActivities={activities}
        onEditActivity={onEditActivity}
        selectedDate={new Date(2026, 1, 7)}
        latestProjAndAct={{}}
        events={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText("timetracker")).toBeInTheDocument();
    expect(screen.getByText("feature work")).toBeInTheDocument();
    expect(screen.getByText("internal")).toBeInTheDocument();
    expect(screen.getByText("pull request")).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle("Edit")[0]);

    expect(onEditActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        project: "timetracker",
        description: "feature work",
      }),
    );
  });
});
