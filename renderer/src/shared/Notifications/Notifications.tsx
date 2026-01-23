import { useEffect, useState } from "react";
import { CheckIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { UpdateInfo } from "electron-updater";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import isOnline from "is-online";
import { ErrorPlaceholder, RenderError } from "../ErrorPlaceholder";
import { RELEASES_LINK } from "@/components/ActivitiesSection/constants";

const Notifications = () => {
  const [isUpdate, setIsUpdate] = useState(false);
  const [isDownload, setIsDownload] = useState(false);
  const [version, setVersion] = useState("");
  const storedVersionData = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.VERSION_DATA),
  ) || {
    version: "",
    showMessage: true,
  };
  const [showMessage, setShowMessage] = useState(storedVersionData.showMessage);
  const [renderError, setRenderError] = useState<RenderError>({
    errorTitle: "",
    errorMessage: "",
  });
  const [errorType, setErrorType] = useState<null | "updater">(null);
  const [backgroundError, setBackgroundError] = useState("");
  const [isErrorShown, setIsErrorShown] = useState<boolean>(true);

  const handleUpdateDownloadClick = () => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.REDIRECT, RELEASES_LINK);
  };

  const handleCloseButton = () => {
    setIsErrorShown(false);
  };

  useEffect(() => {
    (async () => {
      const online = await isOnline();

      if (!online) return;

      global.ipcRenderer.on(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE, (_, data: boolean, info: UpdateInfo) => {
        setIsUpdate(data);
        setVersion(info.version);
      });
      global.ipcRenderer.on(IPC_MAIN_CHANNELS.DOWNLOADED, (_, data: boolean, info: UpdateInfo) => {
        setIsDownload(data);
        setVersion(info.version);
      });
      global.ipcRenderer.on(IPC_MAIN_CHANNELS.BACKEND_ERROR, (_, errorMessage, data) => {
        setBackgroundError(errorMessage);
        console.log("Error data ", data);

        const errorMessageArray = errorMessage ? errorMessage.split(" ") : [];
        if (errorMessageArray.includes("Updater")) {
          setErrorType("updater");
        }
      });

      return () => {
        global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE);
        global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.DOWNLOADED);
        global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.BACKEND_ERROR);
      };
    })();
  }, []);

  useEffect(() => {
    global.ipcRenderer.on(IPC_MAIN_CHANNELS.RENDER_ERROR, (_, errorTitle, errorMessage, data) => {
      setRenderError({ errorTitle, errorMessage });
      console.log("Error data ", data);
    });

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.RENDER_ERROR);
    };
  }, []);

  useEffect(() => {
    if (version.length > 0 && version !== storedVersionData.version) {
      storedVersionData.version = version;
      storedVersionData.showMessage = true;

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.VERSION_DATA,
        JSON.stringify(storedVersionData),
      );
    }

    setShowMessage(storedVersionData.showMessage);
  }, [version]);

  const install = () => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.INSTALL_VERSION);
  };

  const handleCloseBtnClick = () => {
    storedVersionData.showMessage = false;
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.VERSION_DATA,
      JSON.stringify(storedVersionData),
    );

    setShowMessage(storedVersionData.showMessage);
  };

  return (
    <div className="flex justify-center pt-2">
      <div className="flex flex-col gap-2 items-center px-2 lg:px-0">
        {isUpdate && !isDownload && showMessage && (
          <span className="flex gap-2 items-center rounded-lg px-3 py-2 bg-blue-300 text-blue-800 dark:text-blue-500 dark:bg-blue-400/30">
            <ExclamationCircleIcon className="w-6 h-6 fill-blue-400 dark:fill-blue-400/30 stroke-white bg:stroke-gray-300" />
            The version {version} is loading
          </span>
        )}
        {isDownload && showMessage && (
          <span className="relative flex gap-2 items-center rounded-lg px-12 py-2 text-sm bg-green-300 text-green-800 dark:bg-green-300/30 dark:text-green-400/70">
            <CheckIcon className="w-6 h-6 fill-green-800 dark:fill-green-400/70" />
            <p className="whitespace-normal">
              New version {version} is downloaded. Turn off the app, or click the Install button
            </p>
            <button
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-green-600/50 hover:dark:bg-green-600/70 focus:dark:border-focus-border focus:dark:ring-focus-border"
              onClick={install}
            >
              Install
            </button>
            <XMarkIcon
              className="w-6 h-6 fill-green-800 dark:fill-green-400/70 absolute right-1 top-1 cursor-pointer"
              onClick={handleCloseBtnClick}
            />
          </span>
        )}
        {backgroundError && isErrorShown && (
          <div className="relative border-t-4 border-red-700 p-5 shadow-lg text-gray-700 text-left dark:text-slate-400">
            <div className="flex justify-start gap-2 w-full text-gray-900 font-bold dark:text-white">
              <ExclamationCircleIcon className="w-7 h-7 text-red-700" aria-hidden="true" />
              <p>Noncritical error</p>
            </div>
            <div className="pl-9 pr-8">
              <div>{backgroundError} Refer to the console for specific error information.</div>
              {errorType !== "updater" && (
                <button
                  className="text-dark-button-back hover:text-dark-button-hover"
                  onClick={handleUpdateDownloadClick}
                >
                  You can download the new version manually from the link
                </button>
              )}
              <XMarkIcon
                className="w-6 h-6 fill-gray-600 dark:fill-gray-400/70 absolute right-1 top-1 cursor-pointer"
                onClick={handleCloseButton}
              />
            </div>
          </div>
        )}

        {!renderError.errorTitle && renderError.errorMessage && <ErrorPlaceholder {...renderError} />}
      </div>
    </div>
  );
};

export default Notifications;
