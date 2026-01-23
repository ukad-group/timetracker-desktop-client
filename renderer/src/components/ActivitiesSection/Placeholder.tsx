import { PlaceholderProps } from "@/components/ActivitiesSection/types";
import { useState, useRef } from "react";
import { useMainStore } from "@/store/mainStore";
import { shallow } from "zustand/shallow";
import { ClockIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ButtonTransparent } from "@/shared/ButtonTransparent";
import { Popup } from "@/shared/Popup";
import { Hint } from "@/shared/Hint";
import { HINTS_GROUP_NAMES, HINTS_ALERTS } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

const Placeholder = ({ onEditActivity, selectedDate, setSelectedDateReport }: PlaceholderProps) => {
  const [showModal, setShowModal] = useState(false);
  const placeholderButtonRef = useRef(null);
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);

  const copyLastReport = async () => {
    const prevDayReport = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.APP_FIND_LAST_REPORT,
      reportsFolder,
      selectedDate,
    );

    if (prevDayReport) {
      global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT, reportsFolder, selectedDate, prevDayReport);

      setSelectedDateReport(prevDayReport);
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="py-6 text-center">
      <ClockIcon className="w-12 h-12 mx-auto text-gray-400" aria-hidden="true" />

      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-heading">No tracked time</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Get started by tracking some activity</p>
      <div className="mt-6 mb-2">
        <button
          ref={placeholderButtonRef}
          onClick={() => onEditActivity("new")}
          type="button"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500   dark:bg-dark-button-back  dark:hover:bg-dark-button-hover"
        >
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
          New activity
        </button>
        <Hint
          learningMethod="buttonClick"
          order={1}
          groupName={HINTS_GROUP_NAMES.PLACEHOLDER}
          referenceRef={placeholderButtonRef}
          shiftY={150}
          shiftX={60}
          width={"small"}
          position={{ basePosition: "left", diagonalPosition: "bottom" }}
        >
          {HINTS_ALERTS.PLACEHOLDER_BUTTON}
        </Hint>
        <span className="block text-gray-500 text-xs">or press ctrl/command + space</span>
      </div>
      <ButtonTransparent callback={copyLastReport}>
        <Square2StackIcon className="w-5 h-5" />
        Copy last report
      </ButtonTransparent>
      {showModal && (
        <Popup
          title="Failed to copy last report"
          description="Either the last report is empty or you haven't written it for too long"
          left="25%"
          top="160px"
          buttons={[
            {
              text: "Ok",
              color: "green",
              callback: () => setShowModal(false),
            },
          ]}
        />
      )}
    </div>
  );
};

export default Placeholder;
