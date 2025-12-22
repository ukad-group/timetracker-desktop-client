import React, { useEffect, useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/Button";
import { useRouter } from "next/router";
import { Loader } from "@/shared/Loader";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";

const TimetrackerWebsiteConnection = () => {
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
    ),
  );
  const [loading, setLoading] = useState(false);

  const handleSignInButton = async () => {
    const online = await isOnline();

    if (online) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, "timetracker-website");
    } else {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE);
    }
  };

  const handleSignOutButton = () => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER);
    setLoggedUser(null);
  };

  const loadUserInfo = async () => {
    setLoading(true);
    document.body.style.overflow = "hidden";

    const authorizationCode = global.ipcRenderer.sendSync(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
      LOCAL_STORAGE_VARIABLES.TIMETRACKER_WEBSITE_CODE,
    );
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, LOCAL_STORAGE_VARIABLES.TIMETRACKER_WEBSITE_CODE);

    if (!authorizationCode) return;

    try {
      const userCreds = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_GET_USER_INFO_TOKEN,
        authorizationCode,
      );

      const profilePromise = global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.OFFICE365_GET_PROFILE_INFO,
        userCreds.access_token,
      );

      const TTCookiePromise = global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, userCreds?.id_token);
      const [userInfo, timetrackerCookie] = await Promise.all([profilePromise, TTCookiePromise]);

      const yearProjectsFromApi = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_GET_PROJECTS,
        timetrackerCookie,
      );

      const TTUserInfo = {
        refreshToken: userCreds?.refresh_token,
        idToken: userCreds?.id_token,
        userName: userInfo?.displayName || "",
        userEmail: userInfo?.userPrincipalName || userInfo?.mail || "",
        cookie: timetrackerCookie,
        yearProjects: yearProjectsFromApi,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(TTUserInfo),
      );
      setLoggedUser(TTUserInfo);

      await router.push("/settings");
    } catch (error) {
      console.log(error);
      alert(error);
    } finally {
      setLoading(false);
      document.body.removeAttribute("style");
    }
  };

  useEffect(() => {
    const searchParams = window.location.search;

    if (searchParams.includes("error")) {
      console.log("There are some problems with authorize");
      console.log(searchParams);
      return;
    }

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.TIMETRACKER_SHOULD_RERENDER, async () => await loadUserInfo());

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.TIMETRACKER_SHOULD_RERENDER);
    };
  }, []);

  if (loading) {
    return (
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 overflow-hidden">
        <div className="absolute top-1/2 left-1/2">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-start justify-between gap-2 border rounded-lg shadow dark:border-dark-form-border">
      <div className="flex justify-between items-center w-full ">
        <span className="font-medium dark:text-dark-heading">Timetracker website</span>
        {!loggedUser && <Button text="Add account" callback={handleSignInButton} type="button" />}
      </div>
      <div className="flex items-center justify-between gap-4 w-full">
        {!loggedUser && (
          <div className="text-yellow-600 inline-flex  items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20">
            No one user authorized
          </div>
        )}

        {loggedUser && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-4 items-center">
              <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-300 text-blue-900 dark:text-blue-400 dark:bg-blue-400/20">
                {loggedUser.userEmail}
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
        After connection, you will be able to see a company holidays, your vacations, sickdays and the required amount
        of time you need to work in a month in calendar. Also active projects of the company will be added to the
        project selector.
      </p>
    </div>
  );
};

export default TimetrackerWebsiteConnection;
