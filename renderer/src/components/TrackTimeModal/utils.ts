import { Dispatch, SetStateAction } from "react";
import { LOCAL_STORAGE_VARIABLES, OFFLINE_MESSAGE } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { KEY_CODES } from "@/helpers/constants";
import { getDateTimeData } from "@/helpers/utils/datetime-ui";
import { changeHintConditions } from "@/helpers/utils/utils";
import { padStringToMinutes } from "@/helpers/utils/datetime-ui";
import { formatDurationAsDecimals } from "@/helpers/utils/reports";
import { HINTS_GROUP_NAMES } from "@/helpers/constants";
import { TutorialProgress } from "@/store/types";
import { ScheduledEvents } from "@/store/types";
import isOnline from "is-online";
import { ReportActivity } from "@/helpers/utils/types";

export const changeHours = (eventKey: string, hours: number) => {
  let newHours = hours;

  if (eventKey === KEY_CODES.ARROW_UP) {
    newHours += 1;
  } else if (eventKey === KEY_CODES.ARROW_DOWN) {
    newHours -= 1;
  }

  if (newHours < 0) {
    newHours = 23;
  } else if (newHours >= 24) {
    newHours = 0;
  }

  return newHours;
};

export const changeMinutesAndHours = (eventKey: string, minutes: number, hours: number) => {
  let newMinutes = minutes;
  let newHours = hours;

  if (eventKey === KEY_CODES.ARROW_UP) {
    newMinutes += 15;
  } else if (eventKey === KEY_CODES.ARROW_DOWN) {
    newMinutes -= 15;
  }

  if (newMinutes < 0) {
    newHours = changeHours(eventKey, hours);
    newMinutes += 60;
  } else if (newMinutes >= 60) {
    newHours = changeHours(eventKey, hours);
    newMinutes -= 60;
  }

  return [newMinutes, newHours];
};

export const getTimetrackerYearProjects = async (setWebTrackerProjects: Dispatch<SetStateAction<string[]>>) => {
  const TTUserInfo = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );

  if (!TTUserInfo) return;

  const { cookie, refreshToken } = TTUserInfo;

  try {
    const yearProjectsFromApi = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PROJECTS, cookie);

    if (yearProjectsFromApi === "invalid_token") {
      if (!refreshToken) return;

      const updatedCreds = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN,
        refreshToken,
      );

      const updatedIdToken = updatedCreds?.id_token;

      const updatedCookie = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, updatedIdToken);

      const updatedUser = {
        ...TTUserInfo,
        idToken: updatedIdToken,
        cookie: updatedCookie,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(updatedUser),
      );

      return await getTimetrackerYearProjects(setWebTrackerProjects);
    }

    const updatedUserInfo = {
      ...TTUserInfo,
      yearProjects: yearProjectsFromApi,
    };

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
      JSON.stringify(updatedUserInfo),
    );

    setWebTrackerProjects(yearProjectsFromApi);
  } catch (error) {
    console.log(error);
    setWebTrackerProjects(TTUserInfo.yearProjects);

    const online = await isOnline();

    if (!online) {
      console.log(OFFLINE_MESSAGE);
    }
  }
};

export function addSuggestions(
  activities: Array<ReportActivity> | null,
  latestProjAndDesc: Record<string, [string]>,
  latestProjAndAct: Record<string, [string]>,
  webTrackerProjects: string[],
  setUniqueWebTrackerProjects: Dispatch<SetStateAction<string[]>>,
  setLatestProjects: Dispatch<SetStateAction<string[]>>,
) {
  try {
    for (let i = 0; i < activities.length; i++) {
      if (!Object.keys(latestProjAndDesc).length) break;

      if (
        !activities[i].project ||
        activities[i].project?.startsWith("!") ||
        (!activities[i].description && !activities[i].activity)
      ) {
        continue;
      }

      const projectKey = activities[i].project.trim();

      if (!latestProjAndDesc.hasOwnProperty(projectKey) || !latestProjAndAct.hasOwnProperty(projectKey)) {
        latestProjAndDesc[projectKey] = [activities[i].description];
        latestProjAndAct[projectKey] = [activities[i].activity];
        continue;
      }

      if (activities[i].description) {
        if (!latestProjAndDesc[projectKey].includes(activities[i].description)) {
          latestProjAndDesc[projectKey].unshift(activities[i].description);
        } else {
          latestProjAndDesc[projectKey]?.splice(latestProjAndDesc[projectKey].indexOf(activities[i].description), 1);
          latestProjAndDesc[projectKey]?.unshift(activities[i].description);
        }
      }

      if (activities[i].activity) {
        if (!latestProjAndAct[projectKey].includes(activities[i].activity)) {
          latestProjAndAct[projectKey].unshift(activities[i].activity);
        } else {
          latestProjAndAct[projectKey]?.splice(latestProjAndAct[projectKey].indexOf(activities[i].activity), 1);
          latestProjAndAct[projectKey]?.unshift(activities[i].activity);
        }
      }
    }
    const tempLatestProj = Object.keys(latestProjAndAct);

    if (webTrackerProjects) {
      const tempWebTrackerProjects = [];
      for (let i = 0; i < webTrackerProjects.length; i++) {
        if (!tempLatestProj.includes(webTrackerProjects[i])) {
          tempWebTrackerProjects.push(webTrackerProjects[i]);
          global.ipcRenderer.send(IPC_MAIN_CHANNELS.DICTIONATY_UPDATE, webTrackerProjects[i]);
        }
      }
      setUniqueWebTrackerProjects(tempWebTrackerProjects);
    }

    setLatestProjects(tempLatestProj);
  } catch (err) {
    console.log(err);
  }
}

export function setTimeOnOpen(
  activities: Array<ReportActivity> | null,
  selectedDate: Date,
  setFrom: Dispatch<SetStateAction<string>>,
  setTo: Dispatch<SetStateAction<string>>,
) {
  const { hours, floorMinutes, isToday, ceilHours, ceilMinutes } = getDateTimeData(selectedDate);

  if (activities?.length && activities[activities?.length - 1].to) {
    setFrom(activities[activities?.length - 1].to);
  } else if (activities?.length && !activities[activities?.length - 1].to) {
    setFrom(activities[activities?.length - 1].from);
  } else {
    setFrom(`${hours}:${floorMinutes}`);
  }

  isToday ? setTo(`${ceilHours}:${ceilMinutes}`) : setTo("");
}

export function saveSheduledEvents(
  scheduledEvents: ScheduledEvents,
  setScheduledEvents: (e: ScheduledEvents) => void,
  dashedDescription: string,
  editedActivity: ReportActivity | "new",
  project: string,
  activity: string,
) {
  if (!scheduledEvents[dashedDescription] && editedActivity !== "new" && editedActivity.calendarId?.length > 0) {
    scheduledEvents[dashedDescription] = { project: "", activity: "" };
  }

  if (scheduledEvents[dashedDescription] && !scheduledEvents[dashedDescription].project) {
    scheduledEvents[dashedDescription].project = project;
  }

  if (scheduledEvents[dashedDescription] && scheduledEvents[dashedDescription].activity !== activity) {
    scheduledEvents[dashedDescription].activity = activity || "";
  }

  setScheduledEvents(scheduledEvents);
}

export function handleDashedDescription(
  description: string,
  activity: string,
  setActivity: Dispatch<SetStateAction<string>>,
) {
  if (description.includes(" - ") && !activity) {
    setActivity(" ");
    return " ";
  }
  return activity;
}

export function handleKey(
  e: React.KeyboardEvent<HTMLInputElement>,
  callback: (value: string) => void | undefined = undefined,
) {
  if (e.key === KEY_CODES.ARROW_UP || e.key === KEY_CODES.ARROW_DOWN) {
    e.preventDefault();

    if (!callback) return;

    const input = e.target as HTMLInputElement;
    const value = input.value;

    if (value.length < 5) return;

    if (input.selectionStart === 0 && input.selectionEnd === value.length) {
      input.selectionStart = value.length;
      input.selectionEnd = value.length;
    }

    const cursorPosition = input.selectionStart;
    let [hours, minutes] = value.split(":").map(Number);

    if (cursorPosition > 2) {
      const [newMinutes, newHours] = changeMinutesAndHours(e.key, minutes, hours);
      minutes = newMinutes;
      hours = newHours;
    } else {
      hours = changeHours(e.key, hours);
    }

    const adjustedTime = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");

    input.value = adjustedTime;
    input.selectionStart = cursorPosition;
    input.selectionEnd = cursorPosition;
    callback(adjustedTime);
  }
}

export function addNewActivity(
  progress: TutorialProgress,
  setProgress: (event: TutorialProgress) => void,
  editedActivity: ReportActivity | "new",
  activities: Array<ReportActivity> | null,
  setFrom: Dispatch<SetStateAction<string>>,
  setTo: Dispatch<SetStateAction<string>>,
  setFormattedDuration: Dispatch<SetStateAction<string>>,
  setProject: Dispatch<SetStateAction<string>>,
  setActivity: Dispatch<SetStateAction<string>>,
  setDescription: Dispatch<SetStateAction<string>>,
  resetModal: () => void,
) {
  if (!editedActivity || editedActivity === "new") {
    let trackingConditions = [];
    if (
      progress[HINTS_GROUP_NAMES.TRACK_TIME_MODAL + "Conditions"] &&
      progress[HINTS_GROUP_NAMES.TRACK_TIME_MODAL + "Conditions"].includes(false)
    ) {
      const lastFalse = progress[HINTS_GROUP_NAMES.TRACK_TIME_MODAL + "Conditions"].lastIndexOf(false);
      trackingConditions = progress[HINTS_GROUP_NAMES.TRACK_TIME_MODAL + "Conditions"];
      trackingConditions[lastFalse] = true;
    }
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.TRACK_TIME_MODAL,
        newConditions: trackingConditions,
        existingConditions: Array(10).fill("same"),
      },
    ]);
    resetModal();
    return;
  }

  if (editedActivity?.calendarId) {
    const lastRegistrationTo = activities[activities?.length - 2]?.to;

    padStringToMinutes(lastRegistrationTo) > padStringToMinutes(editedActivity?.from)
      ? setFrom(lastRegistrationTo || "")
      : setFrom(editedActivity?.from || "");
  } else {
    setFrom(editedActivity?.from || "");
  }

  setTo(editedActivity.to || "");
  setFormattedDuration(formatDurationAsDecimals(editedActivity.duration) || "");
  setProject(editedActivity.project || "");
  setActivity(editedActivity.activity || "");
  setDescription(editedActivity.description || "");
}
