import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoogleConnection from "../GoogleConnection";
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

jest.mock("@/API/googleCalendarAPI", () => ({
  getGoogleCredentials: jest.fn(),
  getGoogleUserInfo: jest.fn(),
}));

describe("GoogleConnection", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("renders correctly with no logged users", () => {
    const { getByText, getByRole } = render(<GoogleConnection />);

    expect(getByText("Google")).toBeInTheDocument();
    expect(getByRole("button")).toHaveTextContent("Add account");
    expect(getByText("No one user authorized")).toBeInTheDocument();
  });

  it("displays a message when no user is authorized", () => {
    jest.spyOn(React, "useState").mockImplementationOnce(() => [null, jest.fn()]);

    const { getByText } = render(<GoogleConnection />);

    expect(getByText("No one user authorized")).toBeDefined();
  });
});
