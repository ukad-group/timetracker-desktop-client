import React, { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/Button";
import { JiraUser } from "@/helpers/utils/jira";
import { FlagIcon } from "@heroicons/react/24/outline";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";

const JiraConnection = () => {
  const [users, setUsers] = useState(
    JSON.parse(global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.JIRA_USERS)) ||
      [],
  );

  const handleSignInButton = async () => {
    const online = await isOnline();

    if (online) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "jira");
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    }
  };

  const handleSignOutButton = (id: string) => {
    const filteredUsers = users.filter((user: JiraUser) => user.userId !== id);

    if (filteredUsers.length > 0) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.JIRA_USERS,
        JSON.stringify(filteredUsers),
      );
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.JIRA_USERS);
    }

    setUsers(filteredUsers);
  };

  const addUser = async () => {
    const authorizationCode = global.ipcRenderer.sendSync(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
      LOCAL_STORAGE_VARIABLES.JIRA_AUTH_CODE,
    );
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.JIRA_AUTH_CODE);

    if (!authorizationCode) return;

    const { access_token, refresh_token } = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.JIRA_GET_TOKENS,
      authorizationCode,
    );

    if (!access_token) return;

    const { account_id, email } = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.JIRA_GET_PROFILE, access_token);

    const username = email || "";
    const isUserExists = users.some((user: JiraUser) => account_id === user.userId);

    if (isUserExists) {
      alert(`Account ${username} has already logged`);
      return;
    }

    const user = {
      userId: account_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      username: username,
    };

    const newUsers = [...users, user];

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.JIRA_USERS,
      JSON.stringify(newUsers),
    );
    setUsers(newUsers);
  };

  const rerenderListener = () => {
    (async () => addUser())();
  };

  useEffect(() => {
    global.ipcRenderer.on(IPC_MAIN_CHANNELS.JIRA_SHOULD_RERENDER, rerenderListener);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.JIRA_SHOULD_RERENDER);
    };
  }, [users]);

  return (
    <div className="p-4 flex flex-col items-start justify-between gap-2 border rounded-lg shadow dark:border-dark-form-border">
      <div className="flex justify-between items-center w-full ">
        <span className="font-medium dark:text-dark-heading">Jira</span>
        {!users.length && <Button text="Add account" callback={handleSignInButton} type="button" />}
      </div>
      <div className="flex items-center justify-between gap-4 w-full">
        {!users.length && (
          <div className="text-yellow-600 inline-flex  items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20">
            No one user authorized
          </div>
        )}
        {users.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {users.map((user) => (
              <div key={user.userId} className="flex gap-4 items-center">
                <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-300 text-blue-900 dark:text-blue-400 dark:bg-blue-400/20">
                  {user.username}
                </div>
                <div
                  onClick={() => handleSignOutButton(user.userId)}
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
      <p className="text-sm text-gray-500  dark:text-dark-main">
        After connection, you will be able to fill in the Description field with tasks from the drop-down list. Just
        begin typing and in the drop-down list you will see Jira tasks that starting with "JI::".
        <br />
        You can see only those tasks, where you are an assignee
        <br />
        <span className="flex gap-2 items-center">
          <FlagIcon className="w-4 h-4" />
          Ensure you have a Jira account connected to your Atlassian account.
        </span>
      </p>
    </div>
  );
};

export default JiraConnection;
