import React, { useEffect, useState } from "react";
import { Button } from "@/shared/Button";
import { Office365User } from "@/helpers/utils/office365";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import Users from "./Users";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";
import { TRACK_ANALYTICS } from "@/helpers/constants";

const Office365Connection = () => {
  const [users, setUsers] = useState(
    JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.OFFICE_365_USERS),
    ) || [],
  );
  const [showEventsInTable, setShowEventsInTable] = useState(false);

  const handleSignInButton = async () => {
    const online = isOnline();

    if (online) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "office365");
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    }
  };

  const handleSignOutButton = (id: string) => {
    const filteredUsers = users.filter((user: Office365User) => user.userId !== id);

    if (filteredUsers.length > 0) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.OFFICE_365_USERS,
        JSON.stringify(filteredUsers),
      );
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.OFFICE_365_USERS);
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.SHOW_OFFICE_365_EVENTS);
    }

    setUsers(filteredUsers);
  };

  const addUser = async () => {
    const authorizationCode = global.ipcRenderer.sendSync(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
      LOCAL_STORAGE_VARIABLES.OFFICE_365_AUTH_CODE,
    );
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.OFFICE_365_AUTH_CODE);

    if (!authorizationCode) return;

    const { access_token, refresh_token } = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.OFFICE365_GET_TOKENS,
      authorizationCode,
    );

    if (!access_token) return;

    const { userPrincipalName, mail, displayName, id } = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.OFFICE365_GET_PROFILE_INFO,
      access_token,
    );

    const username = userPrincipalName || mail || displayName || "";
    const isUserExists = users.some((user: Office365User) => id === user.userId);

    if (isUserExists) {
      alert(`Account ${username} has already logged`);
      return;
    }

    const user = {
      userId: id,
      accessToken: access_token,
      refreshToken: refresh_token,
      username: username,
    };
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.CALENDARS_CONNECTIONS, {
      calendar: TRACK_ANALYTICS.CALENDAR_OFFICE,
    });
    const newUsers = [...users, user];

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.OFFICE_365_USERS,
      JSON.stringify(newUsers),
    );
    setUsers(newUsers);
  };

  const handleCheckboxChange = () => {
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.SHOW_OFFICE_365_EVENTS,
      (!showEventsInTable).toString(),
    );
    setShowEventsInTable(!showEventsInTable);
  };

  const rerenderListener = () => {
    (async () => addUser())();
  };

  useEffect(() => {
    if (
      global.ipcRenderer.sendSync(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
        LOCAL_STORAGE_VARIABLES.SHOW_OFFICE_365_EVENTS,
      ) === "true"
    ) {
      setShowEventsInTable(true);
    }

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.OFFICE365_SHOULD_RERENDER, rerenderListener);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.OFFICE365_SHOULD_RERENDER);
    };
  }, [users]);

  return (
    <div className="p-4 flex flex-col items-start justify-between gap-2 border rounded-lg shadow dark:border-dark-form-border">
      <div className="flex justify-between items-center w-full ">
        <span className="font-medium dark:text-dark-heading">Microsoft Office 365</span>
        <Button
          text={!users.length ? "Add account" : "Add another account"}
          callback={handleSignInButton}
          type="button"
        />
      </div>
      <div className="flex items-center justify-between gap-4 w-full">
        {!users.length && (
          <div className="text-yellow-600 inline-flex  items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20">
            No one user authorized
          </div>
        )}
        {users.length > 0 && <Users users={users} onSignOutButton={handleSignOutButton} />}
      </div>
      <p className="text-sm text-gray-500  dark:text-dark-main">
        After connection, you will be able to fill in the Report with the information from events of your Microsoft
        Outlook Calendar
        <br />
        You can authorize with a work, or personal Microsoft account (e.g. Skype, Xbox)
      </p>
      {users.length > 0 && (
        <div className="flex items-start justify-between gap-6 w-full">
          <p className=" max-w-sm text-sm text-gray-500 dark:text-dark-main">Show Office365 events in activity table</p>
          <div>
            <input
              onChange={handleCheckboxChange}
              className="w-4 h-4"
              type="checkbox"
              checked={showEventsInTable}
            ></input>
          </div>
        </div>
      )}
    </div>
  );
};

export default Office365Connection;
