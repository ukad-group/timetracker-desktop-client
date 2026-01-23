import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES, TRACK_ANALYTICS } from "../constants";
import { Office365User } from "./office365";
import { trackConnections } from "./utils";

export interface JiraUser extends Office365User {}

interface JiraResource {
  id: string;
}

interface JiraResourceData {
  accessToken: string;
  assignee: string;
  resources: JiraResource[];
}

export const updateJiraAccessToken = async (refreshToken: string) => {
  return await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.JIRA_REFRESH_ACCESS_TOKEN, refreshToken);
};

export const removeJiraStoredUser = (userId: string) => {
  const storedUsers =
    JSON.parse(global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.JIRA_USERS)) ||
    [];
  const filteredUsers = storedUsers.filter((user: JiraUser) => user.userId !== userId);

  if (filteredUsers.length > 0) {
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.JIRA_USERS,
      JSON.stringify(filteredUsers),
    );
  } else {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.JIRA_USERS);
  }
};

export const updateJiraStoredUser = (userId: string, newAccessToken: string, newRefreshToken: string) => {
  const storedUsers =
    JSON.parse(global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.JIRA_USERS)) ||
    [];
  const updatedUsers = storedUsers.map((user: JiraUser) => {
    if (user.userId === userId) {
      return {
        ...user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } else {
      return user;
    }
  });

  global.ipcRenderer.send(
    IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
    LOCAL_STORAGE_VARIABLES.JIRA_USERS,
    JSON.stringify(updatedUsers),
  );
};

export const getJiraCardsFromAPI = async () => {
  const resourcesData = await getJiraResources();

  return await getAllJiraCards(resourcesData);
};

export const getJiraResources = async () => {
  try {
    const storedUsers =
      JSON.parse(
        global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.JIRA_USERS),
      ) || [];

    if (!storedUsers.length) return [];

    trackConnections(TRACK_ANALYTICS.JIRA);

    const resourcesPromises = storedUsers.map(async (user: JiraUser) => {
      const { accessToken, refreshToken, userId } = user;

      return getJiraResourcesByUser(accessToken, refreshToken, userId);
    });

    const resources = await Promise.all(resourcesPromises);

    return resources || [];
  } catch (error) {
    console.log("Error while getting resources", error);

    return [];
  }
};

export const getJiraResourcesByUser = async (accessToken: string, refreshToken: string, userId: string) => {
  const resources = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.JIRA_GET_RESOURCES, accessToken);

  if (resources?.code === 401) {
    const data = await updateJiraAccessToken(refreshToken);

    if (!data?.access_token || !data?.refresh_token) {
      removeJiraStoredUser(userId);
      return;
    } else {
      updateJiraStoredUser(userId, data.access_token, data.refresh_token);

      return await getJiraResourcesByUser(data.access_token, data.refresh_token, userId);
    }
  }

  if (resources) return { resources, accessToken, assignee: userId };

  return [];
};

export const getAllJiraCards = async (resourcesData: JiraResourceData[]) => {
  try {
    if (!resourcesData?.length) return [[], []];

    let cardsPromises = [];

    resourcesData.forEach(async (item) => {
      if (!item) return;

      const { resources, accessToken, assignee } = item;

      if (accessToken && assignee && resources.length > 0) {
        cardsPromises = resources.map(async (resource) => {
          return await getJiraCardsByResourceId(resource.id, accessToken, assignee);
        });
      }
    });

    const promisedCards = await Promise.all(cardsPromises);

    const cards = promisedCards
      .reduce(
        (acc, curr) => {
          acc[0].push(...curr[0]);
          acc[1].push(...curr[1]);

          return acc;
        },
        [[], []],
      )
      .map((list: string[]) => list.sort((a: string, b: string) => a.localeCompare(b)));

    return cards || [[], []];
  } catch (error) {
    console.log("Error while getting cards", error);

    return [[], []];
  }
};

export const getJiraCardsByResourceId = async (resourceId: string, accessToken: string, assignee: string) => {
  const cards = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.JIRA_GET_ISSUES, accessToken, resourceId, assignee);

  if (cards) return cards;

  return [];
};
