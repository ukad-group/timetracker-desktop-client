import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConnectionsSection from "../ConnectionsSection";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

jest.mock("next/router", () => ({
  useRouter: () => ({
    basePath: "",
    pathname: "/",
    route: "/",
    asPath: "",
    push: async () => true,
    replace: async () => true,
    reload: () => {},
    back: () => {},
    prefetch: async () => undefined,
    beforePopState: () => {},
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
  }),
}));

global.ipcRenderer = {
  on: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  removeAllListeners: jest.fn(),
  ...globalIpcRendererMock,
};

jest.mock("@/helpers/hooks", () => ({
  useOnlineStatus: jest.fn(() => ({ isOnline: true })),
}));

describe("GIVEN ConnectionsSection", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  test("renders ConnectionsSection correctly", () => {
    const { getByText } = render(<ConnectionsSection />);

    expect(getByText("Connections")).toBeInTheDocument();
    expect(
      getByText("You can connect available resources to use their capabilities to complete your reports"),
    ).toBeInTheDocument();
  });
});
