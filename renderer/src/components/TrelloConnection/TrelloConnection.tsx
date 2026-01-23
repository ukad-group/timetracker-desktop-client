import React, { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/Button";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";

const TrelloConnection = () => {
  const [user, setUser] = useState(
    JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TRELLO_USER),
    ) || null,
  );

  const handleSignInButton = async () => {
    const online = isOnline();

    if (online) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "trello");
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    }
  };

  const handleSignOutButton = () => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.TRELLO_USER);
    setUser(null);
  };

  const addUser = async () => {
    const token = global.ipcRenderer.sendSync(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
      LOCAL_STORAGE_VARIABLES.TRELLO_AUTH_TOKEN,
    );
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.TRELLO_AUTH_TOKEN);

    if (!token) return;

    const { id, username, fullName } = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.TRELLO_GET_PROFILE_INFO,
      token,
    );

    const newUser = {
      userId: id,
      accessToken: token,
      username: username || fullName || "",
    };

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.TRELLO_USER,
      JSON.stringify(newUser),
    );
    setUser(newUser);
  };

  const rerenderListener = () => {
    (async () => addUser())();
  };

  useEffect(() => {
    global.ipcRenderer.on(IPC_MAIN_CHANNELS.TRELLO_SHOULD_RERENDER, rerenderListener);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.TRELLO_SHOULD_RERENDER);
    };
  }, [user]);

  return (
    <div className="p-4 flex flex-col items-start justify-between gap-2 border rounded-lg shadow dark:border-dark-form-border">
      <div className="flex justify-between items-center w-full">
        <span className="font-medium dark:text-dark-heading">Trello</span>
        {!user && <Button text="Add account" callback={handleSignInButton} type="button" />}
      </div>
      <div className="flex items-center justify-between gap-4 w-full">
        {!user && (
          <div className="text-yellow-600 inline-flex  items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20">
            No one user authorized
          </div>
        )}

        {user && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-4 items-center">
              <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-300 text-blue-900 dark:text-blue-400 dark:bg-blue-400/20">
                {user.username}
              </div>
              <div
                onClick={handleSignOutButton}
                className="cursor-pointer bg-gray-400 hover:bg-gray-500 transition duration-300 inline-flex gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium text-white dark:text-dark-heading dark:bg-dark-button-back-gray dark:hover:bg-dark-button-gray-hover"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 fill-white dark:fill-dark-heading" />
                Sign Out
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-dark-main">
        After connection, you will be able to fill in the Description field with tasks from the drop-down list. Just
        begin typing and in the drop-down list you will see Trello tasks that starting with "TT::". You can see only
        those tasks you joined in Trello
      </p>
    </div>
  );
};

export default TrelloConnection;
