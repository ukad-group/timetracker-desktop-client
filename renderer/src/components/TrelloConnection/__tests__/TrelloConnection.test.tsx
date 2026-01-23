import React from "react";
import { render, fireEvent } from "@testing-library/react";
import TrelloConnection from "../TrelloConnection";
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

describe("GIVEN TrelloConnection", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("handles sign in button click correctly when online", () => {
    const { getByText } = render(<TrelloConnection />);

    fireEvent.click(getByText("Add account"));

    expect(global.ipcRenderer.send).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "trello");
  });

  it("displays a message when no user is authorized", () => {
    jest.spyOn(React, "useState").mockImplementationOnce(() => [null, jest.fn()]);

    const { getByText } = render(<TrelloConnection />);

    expect(getByText("No one user authorized")).toBeDefined();
  });
});
