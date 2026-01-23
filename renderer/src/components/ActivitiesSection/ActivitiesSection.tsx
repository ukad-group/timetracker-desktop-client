import { useEffect, useMemo, useState } from "react";
import { ActivitiesTable } from "../ActivitiesTable";
import { loadGoogleEventsFromAllUsers } from "@/helpers/utils/google";
import { getOffice365Events } from "@/helpers/utils/office365";
import { checkIsToday } from "@/helpers/utils/datetime-ui";
import { ActivitiesSectionProps } from "./types";
import { validation } from "@/helpers/utils/reports";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import Placeholder from "./Placeholder";
import TrackTimeButton from "./TrackTimeButton";
import { KEY_CODES, LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";

const ActivitiesSection = ({
  onEditActivity,
  activities,
  selectedDate,
  latestProjAndAct,
  setSelectedDateReport,
}: ActivitiesSectionProps) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isGoogleEventsShown = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.SHOW_GOOGLE_EVENTS),
  );
  const isOffice365EventsShown = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.SHOW_OFFICE_365_EVENTS),
  );
  const validatedActivities = useMemo(() => {
    return validation(activities.filter((activity) => activity.to));
  }, [activities]);

  const handleCtrlSpace = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.code === KEY_CODES.SPACE) {
      onEditActivity("new");
    }
  };

  const loadEvents = async (isAvailable: { isAvailable: boolean }) => {
    if (checkIsToday(selectedDate)) {
      setIsLoading(true);

      const googleEvents = isGoogleEventsShown ? await loadGoogleEventsFromAllUsers() : [];
      const office365Events = isOffice365EventsShown ? await getOffice365Events() : [];

      const allEvents = [...googleEvents, ...office365Events];

      setIsLoading(false);
      isAvailable.isAvailable && setEvents(allEvents);
    } else {
      setEvents([]);
    }
  };

  useEffect(() => {
    const isAvailable = { isAvailable: true };

    loadEvents(isAvailable);

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.WINDOW_FOCUSED, () => {
      loadEvents(isAvailable);
    });

    return () => {
      setIsLoading(false);
      isAvailable.isAvailable = false;
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.WINDOW_FOCUSED);
    };
  }, [selectedDate]);

  useEffect(() => {
    document.addEventListener("keyup", handleCtrlSpace);

    return () => {
      document.removeEventListener("keyup", handleCtrlSpace);
    };
  }, []);

  if (!validatedActivities?.length && !events?.length && !isLoading) {
    return (
      <Placeholder
        onEditActivity={onEditActivity}
        selectedDate={selectedDate}
        setSelectedDateReport={setSelectedDateReport}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="px-4 py-5 sm:px-6">
          <ActivitiesTable
            onEditActivity={onEditActivity}
            activities={activities}
            selectedDate={selectedDate}
            latestProjAndAct={latestProjAndAct}
            events={events}
            isLoading={isLoading}
            validatedActivities={validatedActivities}
          />
        </div>
        <div>
          <TrackTimeButton onEditActivity={onEditActivity} />
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSection;
