import React from "react";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";
import useColorTheme from "@/helpers/hooks/useTheme";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
import SettingsPageContent from "../SettingsPageContent";

jest.mock("@/helpers/hooks/useTheme", () => ({
  __esModule: true,
  default: jest.fn(() => ({ theme: { custom: "light", os: true }, setTheme: jest.fn() })),
}));

jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

global.ipcRenderer = {
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("GIVEN SettingsPage", () => {
  beforeAll(() => {
    render(<SettingsPageContent />);

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
  });

  beforeEach(() => {
    (useColorTheme as jest.Mock).mockReturnValue({ theme: {}, setTheme: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("renders SettingsPage correctly", () => {
    const { result } = renderHook(() => useColorTheme());

    expect(result.current.theme).toEqual({});

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Manage your settings and set preferences")).toBeInTheDocument();
  });
});
