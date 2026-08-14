import { Dispatch, SetStateAction } from "react";
import { LOCAL_STORAGE_VARIABLES, OFFLINE_MESSAGE } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { isOnline } from "@/utils/onlineStatus";
import { ContactPerson } from "./types";

export const getTimetrackerContactPersons = async (setMentions: Dispatch<SetStateAction<string[]>>) => {
  const ttUserInfo = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );

  if (!ttUserInfo) return;

  const clientsForMentions = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_SESSION_GET, LOCAL_STORAGE_VARIABLES.CLIENTS_FOR_MENTIONS),
  );

  if (clientsForMentions !== null) {
    setMentions(clientsForMentions);
    return;
  }

  const { cookie, refreshToken } = ttUserInfo;

  try {
    const allClients: ContactPerson[] | string = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.TIMETRACKER_GET_MENTIONS,
      cookie,
    );

    if (allClients === "invalid_token") {
      if (!refreshToken) return;

      const updatedCreds = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN,
        refreshToken,
      );

      const updatedIdToken = updatedCreds?.id_token;

      const updatedCookie = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, updatedIdToken);

      const updatedUser = {
        ...ttUserInfo,
        idToken: updatedIdToken,
        cookie: updatedCookie,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(updatedUser),
      );

      return await getTimetrackerContactPersons(setMentions);
    }

    if (typeof allClients !== "string") {
      const updatedUserInfo = {
        ...ttUserInfo,
        allClients: allClients,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(updatedUserInfo),
      );

      const allClientsMapped = allClients.flatMap((c) => [c.name + (c.email.length ? " - " + c.email : "")]);
      setMentions(allClientsMapped);

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_SESSION_SET,
        LOCAL_STORAGE_VARIABLES.CLIENTS_FOR_MENTIONS,
        JSON.stringify(allClientsMapped),
      );
    }
  } catch (error) {
    console.log(error);
    const online = await isOnline();
    if (!online) {
      console.log(OFFLINE_MESSAGE);
    }
  }
};
