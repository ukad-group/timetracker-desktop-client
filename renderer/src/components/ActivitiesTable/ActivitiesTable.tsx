import { useMemo, useEffect, useState } from "react";
import { checkIsToday, getCeiledTime } from "@/helpers/utils/datetime-ui";
import { shallow } from "zustand/shallow";
import { useScheduledEventsStore } from "@/store/googleEventsStore";
import { concatSortArrays } from "@/helpers/utils/utils";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";
import { useClipboard } from "@/helpers/hooks/useClipboard";
import { ActivitiesTableProps } from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { SCREENS } from "@/constants";
import { ActivitiesTableContext } from "./context";
import { MainView, CompactView } from "./components";
import { getTotalDuration, formatEvents, getActualEvents } from "./utils";
import { KEY_CODES, LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import { TRACK_ANALYTICS } from "@/helpers/constants";
import { ReportActivity } from "@/helpers/utils/types";

const ActivitiesTable = ({
  activities,
  onEditActivity,
  selectedDate,
  latestProjAndAct,
  events,
  isLoading,
  validatedActivities,
}: ActivitiesTableProps) => {
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [secondKey, setSecondtKey] = useState<string | null>(null);
  const [firstKeyPressTime, setFirstKeyPressTime] = useState<number | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [scheduledEvents] = useScheduledEventsStore((state) => [state.event, state.setEvent], shallow);
  const { screenSizes } = useScreenSizes();
  const showAsMain = global.ipcRenderer.sendSync(
    IPC_MAIN_CHANNELS.ELECTRON_STORE_GET,
    LOCAL_STORAGE_VARIABLES.WIDGET_ORDER,
  )
    ? JSON.parse(
        global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.WIDGET_ORDER),
      ).find((section: { id: string; side: string }) => section.id === "Activities Table").side === "left"
    : true;

  const totalDuration = useMemo(
    () => getTotalDuration(validatedActivities.filter((activity) => !activity.isBreak)),
    [validatedActivities],
  );

  const tableActivities: ReportActivity[] = useMemo(() => {
    const badgedActivities = validatedActivities.map((activity) => {
      const userInfo = JSON.parse(
        global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
      );
      if (userInfo && !userInfo?.yearProjects?.includes(activity.project)) {
        return { ...activity, isNewProject: true };
      }
      return activity;
    });
    const actualEvents = getActualEvents(events, activities);
    const formattedEvents: ReportActivity[] = formatEvents(actualEvents, latestProjAndAct);

    for (let i = 0; i < formattedEvents.length; i++) {
      const description = formattedEvents[i].description;
      if (description && Object.keys(scheduledEvents).includes(description)) {
        formattedEvents[i].project = formattedEvents[i].project
          ? formattedEvents[i].project
          : scheduledEvents[description]?.project || "";
        formattedEvents[i].activity = formattedEvents[i].activity
          ? formattedEvents[i].activity
          : scheduledEvents[description]?.activity || "";
      }
    }
    return formattedEvents && formattedEvents.length > 0
      ? concatSortArrays(badgedActivities, formattedEvents)
      : badgedActivities;
  }, [validatedActivities, events]);

  const { copyToClipboardHandle } = useClipboard();

  const handleCopyActivity = (activity: ReportActivity) => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.COPY_REGISTRATION);
    const lastActivity = activities[activities.length - 2];
    onEditActivity({
      ...activity,
      from: lastActivity?.to || activity.from,
      to: checkIsToday(selectedDate) ? getCeiledTime() : activity.to,
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey && event.key === KEY_CODES.ARROW_UP) || (event.metaKey && event.key === KEY_CODES.ARROW_UP)) {
      if (validatedActivities.length > 0) {
        const lastActivity = validatedActivities[validatedActivities.length - 1];

        onEditActivity(lastActivity);
      }
    }
    if (event.key === KEY_CODES.CONTROL || event.metaKey) {
      setCtrlPressed(true);
    }

    if ((event.ctrlKey || event.key === KEY_CODES.CONTROL || event.metaKey) && /^[0-9]$/.test(event.key)) {
      const number = parseInt(event.key, 10);

      if (!firstKey && number >= 1 && number <= tableActivities.length) {
        setFirstKey(event.key);
        const selectedActivity = tableActivities[Number(event.key) - 1];
        const timerId = setTimeout(() => {
          if (selectedActivity.calendarId) {
            onEditActivity({
              ...selectedActivity,
            });
          } else {
            onEditActivity(selectedActivity);
          }
        }, 500);
        setTimerId(timerId);
        setFirstKeyPressTime(Date.now());
      }

      if (firstKeyPressTime !== null && Date.now() - firstKeyPressTime < 500) {
        if (timerId !== null) {
          clearTimeout(timerId);
        }
        setSecondtKey(event.key);
        const selectedActivity = tableActivities[Number(firstKey + event.key) - 1];

        if (selectedActivity) {
          onEditActivity(selectedActivity);
        }
      }
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === KEY_CODES.CONTROL || event.key === KEY_CODES.META) {
      setFirstKey(null);
      setSecondtKey(null);
      setCtrlPressed(false);
    }
  };

  const handleEditActivity = (activity: Partial<ReportActivity> & { from: string; to: string }) => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.EDIT_REGISTRATION);
    if (activity.calendarId) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.REGISTRATIONS, {
        registration: TRACK_ANALYTICS.GOOGLE_CALENDAR_EVENT_REGISTRATION,
      });
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.REGISTRATIONS, {
        registration: TRACK_ANALYTICS.ALL_CALENDAR_EVENT_REGISTRATION,
      });
    }
    onEditActivity(activity);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    };
  }, [firstKey, tableActivities]);

  const value = useMemo(
    () => ({
      totalDuration,
      tableActivities,
      selectedDate,
      isLoading,
      ctrlPressed,
      copyToClipboardHandle,
      onEditActivity,
      activities,
      firstKey,
      secondKey,
      handleEditActivity,
      handleCopyActivity,
    }),
    [
      totalDuration,
      tableActivities,
      selectedDate,
      isLoading,
      ctrlPressed,
      copyToClipboardHandle,
      onEditActivity,
      activities,
      firstKey,
      secondKey,
      handleEditActivity,
      handleCopyActivity,
    ],
  );

  return (
    <ActivitiesTableContext.Provider value={value}>
      {showAsMain || screenSizes.screenWidth < SCREENS.LG ? <MainView /> : <CompactView />}
    </ActivitiesTableContext.Provider>
  );
};

export default ActivitiesTable;
