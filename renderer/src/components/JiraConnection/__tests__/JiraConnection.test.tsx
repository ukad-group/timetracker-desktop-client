import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import JiraConnection from "../JiraConnection";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

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

describe("GIVEN JiraConnection", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("renders correctly with no users", () => {
    const { getByText, getByRole } = render(<JiraConnection />);

    expect(getByText("Jira")).toBeInTheDocument();
    expect(getByRole("button")).toHaveTextContent("Add account");
    expect(getByText("No one user authorized")).toBeInTheDocument();
  });

  it("displays a message when no user is authorized", () => {
    jest.spyOn(React, "useState").mockImplementationOnce(() => [null, jest.fn()]);

    const { getByText } = render(<JiraConnection />);

    expect(getByText("No one user authorized")).toBeDefined();
  });
});
