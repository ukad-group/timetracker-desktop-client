import {
  getGoogleAuthUrl,
  getGoogleCredentials,
  updateGoogleCredentials,
  getGoogleEvents,
  getGoogleUserInfo,
} from "../googleCalendarAPI";

import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

global.ipcRenderer = {
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

describe("GIVEN API Tests", () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("should generate Google Auth URL", () => {
    const url = getGoogleAuthUrl();
    expect(url).toMatch(/accounts\.google\.com\/o\/oauth2\/auth/);
  });

  it("should fetch Google credentials", async () => {
    const mockResponse = { access_token: "mockAccessToken", refresh_token: "mockRefreshToken" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse) });

    const credentials = await getGoogleCredentials("mockAuthCode");
    expect(credentials).toEqual(mockResponse);
  });

  it("should update Google credentials", async () => {
    const mockResponse = { access_token: "newMockAccessToken", refresh_token: "newMockRefreshToken" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse) });

    const updatedCredentials = await updateGoogleCredentials("mockRefreshToken");
    expect(updatedCredentials).toEqual(mockResponse);
  });

  it("should fetch Google events", async () => {
    const mockResponse = { events: [{ summary: "Event 1" }, { summary: "Event 2" }] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse) });

    const events = await getGoogleEvents("mockAccessToken");
    expect(events).toEqual(mockResponse);
  });

  it("should fetch Google user info", async () => {
    const mockResponse = { names: [{ displayName: "John Doe" }] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse) });

    const userInfo = await getGoogleUserInfo("mockAccessToken");
    expect(userInfo).toEqual(mockResponse);
  });
});
