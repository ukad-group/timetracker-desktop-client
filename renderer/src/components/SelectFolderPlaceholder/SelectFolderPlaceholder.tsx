import { PlusIcon } from "@heroicons/react/24/solid";
import { shallow } from "zustand/shallow";
import { useMainStore } from "@/store/mainStore";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

const SelectFolderPlaceholder = () => {
  const [_, setReportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);
  const handleButtonClick = () => {
    global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_SELECT_FOLDER).then((folder: string | null) => {
      if (folder) {
        setReportsFolder(folder);
      }
    });
  };

  return (
    <div className="py-16 text-center bg-white shadow sm:rounded-lg lg:col-start-1 lg:col-span-3 dark:bg-dark-container  dark:border dark:border-dark-border">
      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-heading">Select a Folder</h3>
      <div className="mt-4 max-w-3xl mx-auto">
        <div className="mb-4">
          <h4 className="text-gray-900 dark:text-dark-heading mb-1">For UKAD Users</h4>
          <p className="text-sm text-gray-500 dark:text-dark-main mx-auto">
            The designated folder should be created and shared with you on Dropbox by the UKAD DevOps team. <br /> To
            locate your Dropbox root folder, please navigate to C:\Users[Windows user]\Dropbox. <br /> Our application's
            folder structure mirrors the format 'John Galt {">"} 2024 {">"} week 05.' <br /> Kindly select the 'John
            Galt' folder as your designated storage location.
          </p>
        </div>
        <div>
          <h4 className="text-gray-900 dark:text-dark-heading mb-1">For other Users</h4>
          <p className="text-sm text-gray-500 dark:text-dark-main mx-auto">
            As a Non-UKAD user, you have the flexibility to choose any folder of your preference for storing your
            reports. However, we strongly recommend utilizing cloud storage services like Dropbox, Google Drive, etc.
            These services facilitate seamless report synchronization across your devices, offer automatic backups, and
            preserve a historical record of your data.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleButtonClick}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-dark-heading dark:bg-dark-button-back  hover:dark:bg-dark-button-hover focus:dark:border-focus-border focus:dark:ring-focus-border"
        >
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
          Select Folder
        </button>
      </div>
    </div>
  );
};
export default SelectFolderPlaceholder;
