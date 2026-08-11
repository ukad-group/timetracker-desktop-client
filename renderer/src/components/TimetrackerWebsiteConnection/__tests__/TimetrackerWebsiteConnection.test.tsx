import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import TimetrackerWebsiteConnection from "../TimetrackerWebsiteConnection";
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

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  ...global.localStorage,
};
global.localStorage = localStorageMock;

jest.mock("@/shared/Loader", () => () => <div data-testid="loader">Loading...</div>);

describe("GIVEN TimetrackerWebsiteConnection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with no logged user", () => {
    const { getByText, getByRole } = render(
      <MemoryRouter>
        <TimetrackerWebsiteConnection />
      </MemoryRouter>,
    );

    expect(getByText("Timetracker website")).toBeInTheDocument();
    expect(getByRole("button")).toHaveTextContent("Add account");
    expect(getByText("No one user authorized")).toBeInTheDocument();
  });
});
