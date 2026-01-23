import React, { useEffect, useState } from "react";
import { Button } from "@/shared/Button";
import { getGoogleCredentials, getGoogleUserInfo } from "@/API/googleCalendarAPI";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { GoogleCredentails, GoogleUser } from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";
import { TRACK_ANALYTICS } from "@/helpers/constants";

const GoogleConnection = () => {
  const [showGoogleEvents, setShowGoogleEvents] = useState(false);
  const [loggedUsers, setLoggedUsers] = useState([]);

  const handleSignIn = async () => {
    const online = await isOnline();

    if (online) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "google");
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    }
  };

  const handleSignOut = (id: string) => {
    const loggedUsersFromLs = JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.GOOGLE_USERS),
    );
    const filteredUsers = loggedUsersFromLs.filter((user: GoogleUser) => user.accountId !== id);

    if (filteredUsers.length === 0) {
      setShowGoogleEvents(false);
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.SHOW_GOOGLE_EVENTS,
        "false",
      );
    }

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.GOOGLE_USERS,
      JSON.stringify(filteredUsers),
    );
    setLoggedUsers(filteredUsers);
  };

  const loadGoogleCredentials = async (authorizationCode: string) => {
    try {
      const credentials = await getGoogleCredentials(authorizationCode);
      const googleProfileInfo = await loadGoogleUserInfo(credentials);
      const googleProfileUsername = googleProfileInfo?.names[0]?.displayName;
      const googleProfileId = googleProfileInfo?.resourceName;
      const googleUsersFromLs = JSON.parse(
        global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.GOOGLE_USERS),
      );

      if (
        googleUsersFromLs.some((user) => {
          return user.accountId === googleProfileId;
        })
      ) {
        alert(`Account ${googleProfileUsername} has already logged`);
      } else {
        const userObject: GoogleUser = {
          googleAccessToken: credentials.access_token,
          googleRefreshToken: credentials.refresh_token,
          userName: googleProfileUsername,
          accountId: googleProfileId,
        };
        global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.CALENDARS_CONNECTIONS, {
          calendar: TRACK_ANALYTICS.CALENDAR_GOOGLE,
        });
        googleUsersFromLs.push(userObject);
        global.ipcRenderer.send(
          IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
          LOCAL_STORAGE_VARIABLES.GOOGLE_USERS,
          JSON.stringify(googleUsersFromLs),
        );
        setLoggedUsers(googleUsersFromLs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGoogleUserInfo = async (gCreds: GoogleCredentails) => {
    try {
      return await getGoogleUserInfo(gCreds.access_token);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckboxChange = () => {
    setShowGoogleEvents((prev) => !prev);
    const reversShowGoogleEvents = !showGoogleEvents;
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.SHOW_GOOGLE_EVENTS,
      reversShowGoogleEvents.toString(),
    );
  };

  const rerenderListener = () => {
    const googleUsers = JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.GOOGLE_USERS),
    );
    const authorizationCode = global.ipcRenderer.sendSync(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
      LOCAL_STORAGE_VARIABLES.GOOGLE_AUTH_CODE,
    );
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.GOOGLE_AUTH_CODE);

    if (!googleUsers) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.GOOGLE_USERS,
        JSON.stringify([]),
      );
    }

    if (authorizationCode) {
      loadGoogleCredentials(authorizationCode);
    }
  };

  useEffect(() => {
    if (
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.SHOW_GOOGLE_EVENTS) ===
      "true"
    ) {
      setShowGoogleEvents(true);
    }

    const loggedUsersFromLs = JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.GOOGLE_USERS),
    );

    if (loggedUsersFromLs) {
      setLoggedUsers(loggedUsersFromLs);
    }

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.GOOGLE_SHOULD_RERENDER, rerenderListener);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.GOOGLE_SHOULD_RERENDER);
    };
  }, []);

  return (
    <div className="p-4 flex flex-col items-start justify-between gap-2 border rounded-lg shadow dark:border-dark-form-border">
      <div className="flex justify-between items-center w-full">
        <span className="font-medium dark:text-dark-heading">Google</span>
        <Button
          text={!loggedUsers.length ? "Add account" : "Add another account"}
          callback={handleSignIn}
          type="button"
        />
      </div>
      <div className="flex items-center justify-between gap-4 w-full">
        {!loggedUsers.length && (
          <div className="text-yellow-600 inline-flex  items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20">
            No one user authorized
          </div>
        )}
        {loggedUsers.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {loggedUsers.map((user) => (
              <div key={user.accountId} className="flex gap-4 items-center">
                <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-300 text-blue-900 dark:text-blue-400 dark:bg-blue-400/20">
                  {user.userName}
                </div>
                <div
                  onClick={() => handleSignOut(user.accountId)}
                  className="cursor-pointer bg-gray-400 hover:bg-gray-500 transition duration-300 inline-flex gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium text-white dark:text-dark-heading dark:bg-dark-button-back-gray dark:hover:bg-dark-button-gray-hover"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 fill-white dark:fill-dark-heading" />
                  Sign Out
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-dark-main">
        After connection, you will be able to fill in the Report with the information from events of your Google
        Calendar
      </p>
      {loggedUsers?.length > 0 && (
        <div className="flex items-start justify-between gap-6 w-full">
          <p className=" max-w-sm text-sm text-gray-500 dark:text-dark-main">Show google events in activity table</p>
          <div>
            <input
              onChange={handleCheckboxChange}
              className="w-4 h-4"
              type="checkbox"
              checked={showGoogleEvents}
            ></input>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleConnection;
