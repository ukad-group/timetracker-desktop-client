import { shallow } from "zustand/shallow";
import FolderSelector from "./FolderSelector";
import { useMainStore } from "../store/mainStore";
import CalendarsModal from "./calendars-modal/CalendarsModal";

export default function Header() {
  const [reportsFolder, setReportsFolder] = useMainStore(
    (state) => [state.reportsFolder, state.setReportsFolder],
    shallow
  );

  return (
    <header className="bg-white shadow">
      <div className="flex justify-between h-16 px-2 mx-auto max-w-[1400px] sm:px-4 lg:px-8">
        <div className="flex w-full justify-start items-center">
          <CalendarsModal/>
        </div>
        <div className="flex w-full justify-end items-center flex-shrink min-w-0 gap-4">
          <FolderSelector
            folderLocation={reportsFolder}
            setFolderLocation={setReportsFolder}
          />
        </div>
      </div>
    </header>
  );
}
