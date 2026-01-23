import { useEffect, useState } from "react";
import { NavButtons } from "@/shared/NavButtons";
import { Button } from "@/shared/Button";
import { ButtonTransparent } from "@/shared/ButtonTransparent";
import { Square2StackIcon } from "@heroicons/react/24/outline";
import Popup from "@/shared/Popup/Popup";
import { useMainStore } from "@/store/mainStore";
import { shallow } from "zustand/shallow";
import { DAY as day, formatDate } from "@/helpers/utils/datetime-ui";
import { DateSelectorProps } from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { KEY_CODES } from "@/helpers/constants";
import DropboxIcon from "@/shared/DropboxIcon/DropboxIcon";
import { PopupButton } from "@/shared/Popup/types";

export default function DateSelector({
  isDropboxConnected,
  selectedDate,
  setSelectedDate,
  selectedDateReport,
}: DateSelectorProps) {
  const today = new Date();
  const isSelectedDateToday = selectedDate.toDateString() === today.toDateString();
  const [showModal, setShowModal] = useState(false);
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);

  const increaseDate = () => {
    setSelectedDate((date) => new Date(date.getTime() + day));
  };

  const decreaseDate = () => {
    setSelectedDate((date) => new Date(date.getTime() - day));
  };

  const handleTodayButton = () => {
    setSelectedDate(new Date());
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.code === KEY_CODES.TAB) {
      if (e.shiftKey) {
        decreaseDate();
      } else {
        increaseDate();
      }
    }
  };

  const writeTodayReport = () => {
    global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT, reportsFolder, today, selectedDateReport);
  };

  const copyCurrentReport = async () => {
    const todayReportExist = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.APP_CHECK_EXIST_REPORT,
      reportsFolder,
      today,
    );

    if (todayReportExist) {
      setShowModal(true);
    } else {
      writeTodayReport();
      setSelectedDate(today);
    }
  };

  const popupButtonsOptions: PopupButton[] = [
    {
      text: "Ok",
      color: "green",
      callback: () => {
        writeTodayReport();
        setShowModal(false);
        setSelectedDate(today);
      },
    },
    {
      text: "Cancel",
      color: "gray",
      callback: () => setShowModal(false),
    },
  ];

  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-5 sm:px-6 relative">
      <div>
        <h1 className="text-lg flex items-center font-semibold leading-6 text-gray-900 dark:text-dark-heading">
          <time dateTime="2022-01-22" className="sm:hidden">
            {formatDate(selectedDate, "short")}
          </time>
          <time dateTime="2022-01-22" className="hidden sm:inline">
            {formatDate(selectedDate, "long")}
          </time>
          {isSelectedDateToday && (
            <span className="inline-flex px-2.5 py-0.5 ml-3 rounded-full text-xs font-medium bg-blue-300 text-white dark:text-blue-400 dark:bg-blue-400/20">
              Today
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 flex">
          {selectedDate?.toLocaleDateString("en-US", { weekday: "long" })}
          {!isDropboxConnected && (
            <span title="Dropbox is not enabled">
              <DropboxIcon />
            </span>
          )}
        </p>
      </div>
      <div className="flex gap-4">
        {!isSelectedDateToday && selectedDateReport && (
          <ButtonTransparent callback={copyCurrentReport}>
            <Square2StackIcon className="w-5 h-5" />
            Copy as today
          </ButtonTransparent>
        )}
        {!isSelectedDateToday && <Button text="Go to current day" callback={handleTodayButton} type={"button"} />}
        <NavButtons prevCallback={decreaseDate} nextCallback={increaseDate} />
      </div>
      {showModal && (
        <Popup
          title="You already have a report for today"
          description="Today's report will be overwritten"
          left="20px"
          buttons={popupButtonsOptions}
        />
      )}
    </div>
  );
}
