import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import TrelloConnection from "../TrelloConnection";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

jest.mock("@/utils/onlineStatus", () => ({
  isOnline: jest.fn(),
}));

import { isOnline } from "@/utils/onlineStatus";

const isOnlineMock = isOnline as jest.MockedFunction<typeof isOnline>;

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
  beforeEach(() => {
    isOnlineMock.mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("handles sign in button click correctly when online", async () => {
    isOnlineMock.mockResolvedValue(true);
    const { getByText } = render(<TrelloConnection />);

    (global.ipcRenderer.send as jest.Mock).mockClear();

    fireEvent.click(getByText("Add account"));

    await waitFor(() => {
      expect(global.ipcRenderer.send).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "trello");
    });
  });

  it("loads offline page when sign in is clicked while offline", async () => {
    isOnlineMock.mockResolvedValue(false);
    const { getByText } = render(<TrelloConnection />);

    (global.ipcRenderer.send as jest.Mock).mockClear();

    fireEvent.click(getByText("Add account"));

    await waitFor(() => {
      expect(global.ipcRenderer.send).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    });
  });

  it("displays a message when no user is authorized", () => {
    jest.spyOn(React, "useState").mockImplementationOnce(() => [null, jest.fn()]);

    const { getByText } = render(<TrelloConnection />);

    expect(getByText("No one user authorized")).toBeDefined();
  });
});
