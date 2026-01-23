import { updateJiraAccessToken, removeJiraStoredUser, updateJiraStoredUser } from "../jira";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

global.ipcRenderer = {
  invoke: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

describe("GIVEN jira/updateJiraAccessToken", () => {
  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
    global.ipcRenderer.send = ipcRendererSendMock;
    global.ipcRenderer.sendSync = ipcRendererSendMock;
  });

  it("calls ipcRenderer.invoke with the correct arguments", async () => {
    const refreshToken = "yourRefreshToken";
    const expectedResult = "yourExpectedResult";

    (global.ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(expectedResult);

    const result = await updateJiraAccessToken(refreshToken);

    expect(global.ipcRenderer.invoke).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.JIRA_REFRESH_ACCESS_TOKEN, refreshToken);

    expect(result).toEqual(expectedResult);
  });
});

describe("GIVEN jira/removeJiraStoredUser", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes a user from localStorage when there are multiple users", () => {
    const userIdToRemove = "userToRemove";
    const storedUsers = [{ userId: "user1" }, { userId: userIdToRemove }, { userId: "user3" }];

    localStorage.setItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS, JSON.stringify(storedUsers));

    removeJiraStoredUser(userIdToRemove);

    const updatedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS));

    expect(updatedUsers).toHaveLength(2);
    expect(updatedUsers.find((user) => user.userId === userIdToRemove)).toBeUndefined();
  });

  it("removes the entire localStorage key when removing the last user", () => {
    const userIdToRemove = "lastUser";
    const storedUsers = [{ userId: userIdToRemove }];

    localStorage.setItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS, JSON.stringify(storedUsers));

    removeJiraStoredUser(userIdToRemove);

    const updatedUsers = localStorage.getItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS);

    expect(updatedUsers).toBeNull();
  });
});

describe("GIVEN jira/updateJiraStoredUser", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates user access and refresh tokens in localStorage", () => {
    const userIdToUpdate = "userToUpdate";
    const newAccessToken = "newAccessToken";
    const newRefreshToken = "newRefreshToken";

    const storedUsers = [
      { userId: "user1", accessToken: "oldToken1", refreshToken: "oldToken1" },
      { userId: userIdToUpdate, accessToken: "oldToken2", refreshToken: "oldToken2" },
      { userId: "user3", accessToken: "oldToken3", refreshToken: "oldToken3" },
    ];

    localStorage.setItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS, JSON.stringify(storedUsers));

    updateJiraStoredUser(userIdToUpdate, newAccessToken, newRefreshToken);

    const updatedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS));

    expect(updatedUsers).toHaveLength(3);
    const updatedUser = updatedUsers.find((user) => user.userId === userIdToUpdate);
    expect(updatedUser).toBeDefined();
    expect(updatedUser.accessToken).toBe(newAccessToken);
    expect(updatedUser.refreshToken).toBe(newRefreshToken);
  });

  it("does not modify localStorage if the user is not found", () => {
    const userIdToUpdate = "userToUpdateNotFound";
    const newAccessToken = "newAccessToken";
    const newRefreshToken = "newRefreshToken";

    const storedUsers = [
      { userId: "user1", accessToken: "oldToken1", refreshToken: "oldToken1" },
      { userId: "user2", accessToken: "oldToken2", refreshToken: "oldToken2" },
      { userId: "user3", accessToken: "oldToken3", refreshToken: "oldToken3" },
    ];

    localStorage.setItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS, JSON.stringify(storedUsers));

    updateJiraStoredUser(userIdToUpdate, newAccessToken, newRefreshToken);

    const updatedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.JIRA_USERS));

    expect(updatedUsers).toEqual(storedUsers);
  });
});
