import { useEffect, useState } from "react";
import { TrackTimeModal } from "@/components/TrackTimeModal";
import { MainPage } from "@/components/MainPage";
import { Notifications } from "@/shared/Notifications";
import { useMainStore } from "@/store/mainStore";
import { shallow } from "zustand/shallow";
import useColorTheme from "@/helpers/hooks/useTheme";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { addPastTime, editActivity } from "@/helpers/utils/utils";
import { ReportActivity } from "@/helpers/utils/types";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateActivities, setSelectedDateActivities] = useState<Array<ReportActivity> | null>([]);
  const [shouldAutosave, setShouldAutosave] = useState(false);
  const [trackTimeModalActivity, setTrackTimeModalActivity] = useState<ReportActivity | "new">(null);
  const [latestProjAndAct, setLatestProjAndAct] = useState<Record<string, [string]>>({});
  const [latestProjAndDesc, setLatestProjAndDesc] = useState<Record<string, [string]>>({});
  const [lastRenderedDay, setLastRenderedDay] = useState(new Date().getDate());
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);

  useEffect(() => {
    const checkDayChange = () => {
      const currentDay = new Date().getDate();
      if (currentDay !== lastRenderedDay) {
        setLastRenderedDay(currentDay);
        setSelectedDate(new Date());
      }
    };

    const intervalId = setInterval(checkDayChange, 1000);

    return () => clearInterval(intervalId);
  }, [lastRenderedDay]);

  useEffect(() => {
    try {
      (async () => {
        const sortedActAndDesc = await global.ipcRenderer.invoke(
          IPC_MAIN_CHANNELS.APP_FIND_LATEST_PROJECTS,
          reportsFolder,
          selectedDate,
        );

        setLatestProjAndAct(sortedActAndDesc.sortedProjAndAct || {});
        setLatestProjAndDesc(sortedActAndDesc.descriptionsSet || {});
      })();
    } catch (err) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.FRONTEND_ERROR,
        "Reports reading error",
        "An error occurred while reading reports. ",
        err,
      );
    }
  }, [selectedDate, reportsFolder, lastRenderedDay]);

  const submitActivity = (activity: ReportActivity) => {
    const tempActivities: Array<ReportActivity> = [];

    if (!selectedDateActivities.length) {
      activity.id = 1;
      tempActivities.push(activity);
      setSelectedDateActivities(tempActivities);
      setShouldAutosave(true);
      return;
    }

    const isEdit = editActivity(activity, selectedDateActivities, setSelectedDateActivities, setShouldAutosave);

    if (isEdit) return;

    const isPastTime = addPastTime(activity, tempActivities, selectedDateActivities, setSelectedDateActivities);
    tempActivities.forEach((act, i) => ((act.id = i), act.isBreak ? (act.to = "") : (act.to = act.to)));

    if (tempActivities.length === selectedDateActivities.length) {
      !isPastTime && tempActivities.push(activity);
      setSelectedDateActivities(tempActivities.filter((act) => act.duration));
    }

    setShouldAutosave(true);
  };

  const setFocusOnNewActivityBtn = () => {
    const newActivityBtn = document.getElementById("newActivityBtn");

    if (newActivityBtn) {
      setTimeout(() => {
        newActivityBtn.focus();
      }, 0);
    }
  };

  const handleCloseModal = () => {
    setTrackTimeModalActivity(null);
    setFocusOnNewActivityBtn();
  };

  useColorTheme();

  return (
    <div className="h-full bg-gray-100 dark:bg-dark-back">
      <Notifications />
      <main className="pt-10">
        <MainPage
          selectedDate={selectedDate}
          selectedDateActivities={selectedDateActivities}
          setSelectedDateActivities={setSelectedDateActivities}
          shouldAutosave={shouldAutosave}
          setShouldAutosave={setShouldAutosave}
          setSelectedDate={setSelectedDate}
          latestProjAndAct={latestProjAndAct}
          setTrackTimeModalActivity={setTrackTimeModalActivity}
        />
      </main>
      {trackTimeModalActivity && (
        <TrackTimeModal
          activities={selectedDateActivities}
          isOpen={trackTimeModalActivity !== null}
          editedActivity={trackTimeModalActivity}
          latestProjAndAct={latestProjAndAct}
          latestProjAndDesc={latestProjAndDesc}
          close={handleCloseModal}
          submitActivity={submitActivity}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
