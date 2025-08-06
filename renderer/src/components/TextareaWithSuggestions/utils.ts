import { Dispatch, SetStateAction } from "react";
import { LOCAL_STORAGE_VARIABLES, OFFLINE_MESSAGE } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import isOnline from "is-online";

export const getTimetrackerMentions = async (setMentions: Dispatch<SetStateAction<string[]>>) => {
  const TTUserInfo = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );

  if (!TTUserInfo) return;

  const ClientsForMentions = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_SESSION_GET, LOCAL_STORAGE_VARIABLES.CLIENTS_FOR_MENTIONS),
  );

  if (ClientsForMentions !== null) {
    setMentions(ClientsForMentions);
    return;
  }

  const { cookie, refreshToken } = TTUserInfo;

  try {
    const allClients = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_GET_MENTIONS, cookie);

    if (allClients === "invalid_token") {
      if (!refreshToken) return;

      const updatedCreds = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN,
        refreshToken,
      );

      const updatedIdToken = updatedCreds?.id_token;

      const updatedCookie = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, updatedIdToken);

      const updatedUser = {
        ...TTUserInfo,
        idToken: updatedIdToken,
        cookie: updatedCookie,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(updatedUser),
      );

      return await getTimetrackerMentions(setMentions);
    }

    const updatedUserInfo = {
      ...TTUserInfo,
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
  } catch (error) {
    console.log(error);
    const online = await isOnline();
    if (!online) {
      console.log(OFFLINE_MESSAGE);
    }
  }
};
