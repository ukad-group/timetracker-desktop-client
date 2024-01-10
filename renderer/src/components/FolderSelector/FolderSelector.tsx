import { PencilIcon } from "@heroicons/react/24/solid";
import { FolderSelectorProps } from './types';

export default function FolderSelector({
  folderLocation,
  setFolderLocation,
}: FolderSelectorProps) {
  const clickHandler = () => {
    global.ipcRenderer
      .invoke("app:select-folder")
      .then((folder: string | null) => {
        if (folder) {
          setFolderLocation(folder);
        }
      });
  };

  return (
    <button
      className="min-w-0 py-2 px-3 w-[22em] shadow-sm text-gray-500 focus-visible:outline-blue-500 sm:text-sm border border-gray-300 rounded-md flex justify-between items-center gap-4 cursor-pointer dark:border-dark-form-border"
      title={folderLocation}
      onClick={clickHandler}
    >
      <span className="flex-shrink overflow-hidden text-ellipsis whitespace-nowrap">
        {folderLocation || "Select a folder"}
      </span>
      <PencilIcon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}