import { TutorialProgress } from "@/store/types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import { Dispatch, SetStateAction } from "react";
import { HintConitions, ReportActivity } from "./types";

export const replaceHyphensWithSpaces = (inputString: string): string => inputString.replace(/ - /g, " ");

export const concatSortArrays = (firstArr: ReportActivity[], secondArr: ReportActivity[]) => {
  const combinedArray = firstArr.concat(secondArr);

  combinedArray.sort((a, b) => {
    const timeA = a.from.split(":").map(Number);
    const timeB = b.from.split(":").map(Number);

    if (timeA[0] !== timeB[0]) {
      return timeA[0] - timeB[0];
    }

    return timeA[1] - timeB[1];
  });

  return combinedArray;
};

export function parseEventTitle(event, latestProjAndAct: Record<string, [string]>) {
  const { summary } = event; // Google
  const { subject } = event; // Office365
  const eventTitle = summary || subject;
  const items = eventTitle ? eventTitle.trim().split(" - ") : "";
  const words = eventTitle ? eventTitle.trim().split(" ") : "";
  let allProjects: Array<string> = Object.keys(latestProjAndAct);
  const userInfo = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );

  if (userInfo && userInfo.yearProjects) {
    allProjects = Object.keys(latestProjAndAct).concat(userInfo.yearProjects);
  }

  switch (items.length) {
    case 0:
      event.description = "";
      break;

    case 1:
      for (let i = 0; words.length > i; i++) {
        const project = words[i].toLowerCase();

        if (allProjects.includes(project)) {
          event.project = project;
          for (let j = 0; words.length > j; j++) {
            const activities = latestProjAndAct[project];
            if (activities && activities.includes(words[j].toLowerCase())) {
              event.activity = activities[activities.indexOf(words[j].toLowerCase())];
            }
          }
          break;
        }
      }

      event.description = items[0];
      break;

    case 2:
      if (allProjects.includes(items[0])) {
        event.project = items[0];
        event.description = items[1];
      } else {
        event.activity = items[0];
        event.description = items[1];
      }
      break;

    case 3:
      const project = items[0].toLowerCase();
      const activity = items[1];
      const description = items[2];

      if (allProjects.includes(project)) {
        const activities = latestProjAndAct[project];

        if (activities && activities.includes(activity.toLowerCase())) {
          event.activity = activities[activities.indexOf(activity.toLowerCase())];
        } else event.activity = activity;
      } else event.activity = activity;

      event.project = project;
      event.description = description;
      break;

    default:
      if (items) {
        event.description = items.join(" - ");
      }
  }

  return event;
}

export const changeHintConditions = (
  progress: TutorialProgress,
  setProgress: (event: TutorialProgress) => void,
  hints: Array<HintConitions>,
) => {
  hints.forEach((hint) => {
    if (!progress[`${hint.groupName}Conditions`]) {
      progress[`${hint.groupName}Conditions`] = hint.newConditions;
    } else {
      hint.existingConditions.forEach((condition, i) => {
        if (condition !== "same") {
          progress[`${hint.groupName}Conditions`][i] = condition;
        }
      });
    }
  });

  setProgress(progress);
};

export function extractTokenFromString(inputString: string) {
  const parts = inputString.split("#");

  if (parts.length >= 2) {
    const afterHash = parts[1];
    const tokenPart = afterHash.split("=");

    if (tokenPart.length === 2 && tokenPart[0] === "token") {
      return tokenPart[1];
    }
  }

  return "";
}

export const trackConnections = (connectedName: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  if (
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, connectedName + "Connection") !==
    `${year}-${month}-${day}`
  ) {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, "connections", {
      connected: connectedName,
    });

    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      connectedName + "Connection",
      `${year}-${month}-${day}`,
    );
  }
};

export function stringToMinutes(str: string) {
  const [hours, minutes] = str.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export const closeWindowIfNeeded = () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (window.location.hash || window.location.search) {
    if (
      window.location.search.includes("code") &&
      window.location.search.includes("state=office365code") &&
      !window.location.search.includes("error")
    ) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.OFFICE_365_AUTH_CODE,
        urlParams.get("code"),
      );
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, "office365");
    }

    if (
      window.location.search.includes("code") &&
      window.location.search.includes("state=jiracode") &&
      !window.location.search.includes("error")
    ) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.JIRA_AUTH_CODE,
        urlParams.get("code"),
      );
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, "jira");
    }

    if (
      window.location.search.includes("code") &&
      window.location.search.includes("state=googlecalendarcode") &&
      !window.location.search.includes("error")
    ) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.GOOGLE_AUTH_CODE,
        urlParams.get("code"),
      );
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, "google");
    }

    if (window.location.hash.includes("token") && !window.location.hash.includes("error")) {
      const tokenFromUrl = extractTokenFromString(window.location.hash);

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TRELLO_AUTH_TOKEN,
        tokenFromUrl,
      );
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, "trello");
    }

    if (window.location.search.includes("code") && window.location.search.includes("state=azure-base")) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_WEBSITE_CODE,
        urlParams.get("code"),
      );
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, "timetracker-website");
    }

    if (window.location.search.includes("code") && window.location.search.includes("state=azure-additional")) {
      return;
    }

    window.close();
  }
};

export const editActivity = (
  activity: ReportActivity,
  selectedDateActivities: Array<ReportActivity>,
  setSelectedDateActivities: Dispatch<SetStateAction<Array<ReportActivity>>>,
  setShouldAutosave: Dispatch<SetStateAction<boolean>>,
) => {
  const activityIndex = selectedDateActivities.findIndex((act) => act.id === activity.id);

  if (activityIndex >= 0) {
    setSelectedDateActivities((activities) => {
      try {
        const oldActivity = activities[activityIndex];
        const previousActivity = activities[activityIndex - 1] || false;
        const nextActivity = activities[activityIndex + 1] || false;

        if (
          Object.keys(activity).every((key) => {
            return oldActivity[key] === activity[key];
          })
        ) {
          return activities;
        }

        activities[activityIndex] = activity;

        if (previousActivity && previousActivity.isBreak) {
          previousActivity.to = activity.from;
        }

        if (nextActivity && nextActivity.isBreak) {
          nextActivity.from = activity.to;
        }

        return [...activities];
      } catch (err) {
        global.ipcRenderer.send(
          IPC_MAIN_CHANNELS.FRONTEND_ERROR,
          "Activity editing error",
          "An error occurred while editing reports. ",
          err,
        );
        return [...activities];
      }
    });
    setShouldAutosave(true);
    return true;
  } else {
    return false;
  }
};

export const addPastTime = (
  activity: ReportActivity,
  tempActivities: Array<ReportActivity>,
  selectedDateActivities: Array<ReportActivity>,
  setSelectedDateActivities: Dispatch<SetStateAction<Array<ReportActivity>>>,
) => {
  const newActFrom = stringToMinutes(activity.from);
  let isPastTime = false;

  for (let i = 0; i < selectedDateActivities.length; i++) {
    try {
      const indexActFrom = stringToMinutes(selectedDateActivities[i].from);
      const indexActTo = selectedDateActivities[i].to ? stringToMinutes(selectedDateActivities[i].to) : undefined;

      if (
        !isPastTime &&
        selectedDateActivities[i].isBreak &&
        i &&
        (newActFrom <= indexActFrom || (i !== selectedDateActivities.length - 1 && newActFrom < indexActTo))
      ) {
        tempActivities.push(activity);
        isPastTime = true;
      } else {
        if (!i && newActFrom < indexActFrom) {
          isPastTime = true;
          tempActivities.push(activity);
          tempActivities.push(...selectedDateActivities);
          break;
        }
        tempActivities.push(selectedDateActivities[i]);
      }
    } catch (err) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.FRONTEND_ERROR,
        "Adding activity error",
        "An error occurred when adding a new activity to the report. ",
        err,
      );
      console.log(activity);
    }
  }
  if (isPastTime) {
    setSelectedDateActivities(tempActivities);
  }
  return isPastTime;
};
