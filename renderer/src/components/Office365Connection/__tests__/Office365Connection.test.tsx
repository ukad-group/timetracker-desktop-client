import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Office365Connection from "../Office365Connection";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import React from "react";

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

describe("GIVEN Office365Connection", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("renders correctly with no users", () => {
    const { getByText, getByRole } = render(<Office365Connection />);

    expect(getByText("Microsoft Office 365")).toBeInTheDocument();
    expect(getByRole("button")).toHaveTextContent("Add account");
    expect(getByText("No one user authorized")).toBeInTheDocument();
  });

  it("renders correctly with users", () => {
    const { getByText, getByRole } = render(<Office365Connection />);

    expect(getByText("Microsoft Office 365")).toBeInTheDocument();
    expect(getByRole("button")).toHaveTextContent("Add account");
  });

  it("displays a message when no user is authorized", () => {
    jest.spyOn(React, "useState").mockImplementationOnce(() => [null, jest.fn()]);

    const { getByText } = render(<Office365Connection />);

    expect(getByText("No one user authorized")).toBeDefined();
  });
});
