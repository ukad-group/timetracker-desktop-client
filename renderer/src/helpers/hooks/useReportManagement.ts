import { useState, useEffect } from "react";
import { useMainStore } from "@/store/mainStore";
import { shallow } from "zustand/shallow";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

export const useReportManagement = (selectedDate: Date) => {
  const [reportsFolder, mainStoreLoaded] = useMainStore(
    (state) => [state.reportsFolder, state.mainStoreLoaded],
    shallow,
  );

  const [selectedDateReport, setSelectedDateReport] = useState<null | string>(null);
  const [isFileExist, setIsFileExist] = useState(false);

  useEffect(() => {
    if (mainStoreLoaded) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.START_FOLDER_WATCHER, reportsFolder);
    }
    return () => {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder);
    };
  }, [reportsFolder, mainStoreLoaded]);

  useEffect(() => {
    readDayReport();

    global.ipcRenderer.send(IPC_MAIN_CHANNELS.START_FILE_WATCHER, reportsFolder, selectedDate);
    global.ipcRenderer.on(IPC_MAIN_CHANNELS.FILE_CHANGED, (event, data) => {
      if (selectedDateReport != data) {
        setSelectedDateReport(data || "");
      }
    });

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.FILE_CHANGED);
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder, selectedDate);
    };
  }, [selectedDate, reportsFolder]);

  const readDayReport = async () => {
    try {
      const dayReport = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT,
        reportsFolder,
        selectedDate,
      );

      setIsFileExist(dayReport !== null);
      setSelectedDateReport(dayReport || "");
    } catch (error) {
      console.error("Failed to read day report:", error);
      setIsFileExist(false);
      setSelectedDateReport("");
    }
  };

  const saveSerializedReport = (serializedReport: string) => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION);
    global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT, reportsFolder, selectedDate, serializedReport);

    setSelectedDateReport(serializedReport);
  };

  return {
    reportsFolder,
    mainStoreLoaded,
    selectedDateReport,
    setSelectedDateReport,
    isFileExist,
    setIsFileExist,
    saveSerializedReport,
  };
};
