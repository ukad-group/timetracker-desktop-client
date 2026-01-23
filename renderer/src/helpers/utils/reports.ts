import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { ReportActivity, ReportAndNotes } from "./types";

export function parseReport(fileContent: string) {
  if (!fileContent) return [];

  let reportCount = 0;
  let reportComments = "";
  const timeRegex = /^[0-9]+:[0-9]+/;
  const hoursRegex = /^[0-9]+/;
  const minutesRegex = /[0-9]+$/;
  const dateRegex = /^\s*[0-9]{4}-[0-9]{2}-[0-9]{2}\s*/;
  const separatorRegex = /^[\s]*-[\s]*/;
  const workingTimeRegex = /^![\w]*/;
  const textRegex = /^[\w+\s*\w*\.]+/;
  const lines = fileContent.split("\n");
  const reportItems: Array<Partial<ReportActivity>> = [];
  const reportAndNotes: ReportAndNotes = [reportItems, reportComments];
  try {
    for (let i = 0; i < lines.length; i++) {
      if (!timeRegex.test(lines[i].slice(0, 8))) {
        reportComments += lines[i] + "\n";
        continue;
      }
      const registration = {
        id: reportCount,
        from: "",
        project: "",
        activity: "",
        description: "",
        isBreak: false,
        validation: { isValid: true },
        mistakes: "",
        isNewProject: false,
      };

      // This code uses the string type to write the time.
      const timeMatch = lines[i].match(timeRegex);
      const hours = parseInt(timeMatch[0].match(hoursRegex)[0]);
      const minutes = parseInt(timeMatch[0].match(minutesRegex)[0]);
      const startTime = new Date();
      startTime.setHours(hours);
      startTime.setMinutes(minutes);
      // const from = startTime;

      registration.from = timeRegex.exec(lines[i])[0];
      if (reportCount > 0) {
        reportItems[reportCount - 1].to = registration.from;

        //This code uses another function in the api.
        // reportItems[reportCount - 1].duration = Math.floor((reportItems[reportCount - 1].to - reportItems[reportCount - 1].from) / (1000 * 60));

        reportItems[reportCount - 1].duration = calcDurationBetweenTimes(
          reportItems[reportCount - 1].from,
          reportItems[reportCount - 1].to,
        );
      }
      // removing time
      let currentLine = lines[i].replace(timeRegex, "");

      // removing registrationDate if exists. Request from Denys Denysenko
      if (dateRegex.test(currentLine)) {
        const dateAsString = currentLine.match(dateRegex)[0];
        currentLine = currentLine.replace(dateAsString, "");
      }

      // removing ' - '
      currentLine = currentLine.replace(separatorRegex, "");

      // should skip registraion when task starts from !
      const isBreak = !currentLine.trim().length || workingTimeRegex.test(currentLine);

      if (isBreak) {
        registration.project = currentLine;
        registration.isBreak = true;
        reportItems.push(registration);
        reportCount++;
        continue;
      }
      let projectName = currentLine.match(textRegex) ? currentLine.match(textRegex)[0] : "";

      if (projectName) {
        registration.project = projectName.trim().toLowerCase();

        // removing project name
        const index = currentLine.indexOf(projectName);
        currentLine =
          index < 0 ? currentLine : currentLine.slice(0, index) + currentLine.slice(index + projectName.length);
        // removing ' - '
        currentLine = currentLine.replace(separatorRegex, "");
      }

      const activityInTheLinePattern = startTime > new Date(2016, 7, 23) ? /(.+?)\s-\s+/ : /(.+?)-\s*/;
      const activityInTheLineRegex = new RegExp(activityInTheLinePattern);
      const isEmptyActivity = currentLine.startsWith("- ");

      if (activityInTheLineRegex.test(currentLine) || isEmptyActivity) {
        let activityName = isEmptyActivity ? " " : currentLine.match(activityInTheLineRegex)[1].trim();

        registration.activity = startTime > new Date(2016, 7, 26) ? activityName : activityName.toLowerCase();

        // removing activity with '-'
        currentLine = isEmptyActivity ? currentLine.replace(/-/, "") : currentLine.replace(activityInTheLineRegex, "");
      }
      registration.description = currentLine.replace(/�/g, "-");

      reportItems.push(registration);

      reportCount++;
    }
    reportAndNotes[1] = reportComments.trimEnd();
    return reportAndNotes as ReportAndNotes;
  } catch (err) {
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.FRONTEND_ERROR,
      "Parsing error",
      "An issue with the file has been identified. Please attempt to rectify the error within the report using the Manual Input field.",
      err,
    );
    return reportAndNotes as ReportAndNotes;
  }
}

export function serializeReport(activities: Array<Partial<ReportActivity>>) {
  let report = "";

  try {
    for (const [i, activity] of activities.entries()) {
      const parts: Array<string> = [activity.from];
      parts.push(activity.project);

      if (activity.activity) {
        parts.push(activity.activity === " " ? "" : activity.activity);
      }

      if (activity.description) {
        parts.push(activity.description);
      }

      if (activity.activity && !activity.description) {
        parts.push("");
      }

      const notLastEmptyRegistration =
        !activity.project && !activity.activity && !activity.description && i !== activities.length - 1;

      if (notLastEmptyRegistration) {
        report += `${parts.join(" - ")}!\n`;
      } else {
        report += `${parts.join(" - ")}\n`;
      }

      const nextActivity = activities[i + 1];
      if (nextActivity && nextActivity.from !== activity.to) {
        activity.to ? (report += `${activity.to} - !\n`) : "";
      }
      if (!nextActivity) {
        activity.to ? (report += `${activity.to} - \n`) : "";
      }
    }

    return report;
  } catch (err) {
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.FRONTEND_ERROR,
      "Serializing error",
      "An issue with the file has been identified. Please attempt to rectify the error within the report using the Manual Input field. ",
      err,
    );
    return report;
  }
}

export function calcDurationBetweenTimes(from: string, to: string): number {
  if (from == undefined || to == undefined) {
    return null;
  }
  try {
    const startParts = from.split(":");
    const endParts = to.split(":");

    const startHours = parseInt(startParts[0], 10) || 0;
    const startMinutes = parseInt(startParts[1], 10) || 0;

    const endHours = parseInt(endParts[0], 10) || 0;
    const endMinutes = parseInt(endParts[1], 10) || 0;

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const totalMinutes = endTotalMinutes - startTotalMinutes;

    return totalMinutes * 60 * 1000;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export function formatDuration(ms: number): string {
  if (ms === undefined) return "";

  const msPerMinute = 60 * 1000;
  const msPerHour = 60 * msPerMinute;

  const hours = Math.floor(ms / msPerHour);
  const minutes = Math.floor((ms % msPerHour) / msPerMinute);

  if (ms === 0) return `${minutes}h`;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatDurationAsDecimals(ms: number): string {
  if (ms === undefined) return "";

  const minutes = ms / 1000 / 60;
  const hours = minutes / 60;

  return `${Math.floor(hours * 100) / 100}h`;
}

export function addDurationToTime(fromTime: string, duration: string) {
  const [fromHours, fromMinutes] = fromTime.split(":").map(Number);

  let totalMinutes = fromHours * 60 + fromMinutes;
  try {
    if (duration.includes("m") || parseInt(duration) > 24) {
      const durationMinutes = parseInt(duration);
      if (durationMinutes) totalMinutes += durationMinutes;
    } else {
      const durationHours = parseFloat(duration);
      if (durationHours) totalMinutes += durationHours * 60;
    }

    if (totalMinutes >= 1440) {
      totalMinutes = 1439;
    } else if (totalMinutes < 0) {
      totalMinutes = 0;
    }

    const toHours = Math.floor(totalMinutes / 60);
    const toMinutes = Math.round(totalMinutes % 60);

    const h = String(toHours).padStart(2, "0");
    const m = String(toMinutes).padStart(2, "0");

    return `${h}:${m}`;
  } catch (err) {
    console.log(err);
    return `00:00`;
  }
}

export function checkIntersection(previousTo: string, currentFrom: string) {
  const [hoursTo, minutesTo] = previousTo.split(":");
  const [hoursFrom, minutesFrom] = currentFrom.split(":");
  const toInMinutes = Number(hoursTo) * 60 + Number(minutesTo);
  const fromInMinutes = Number(hoursFrom) * 60 + Number(minutesFrom);
  return fromInMinutes <= toInMinutes;
}

export function validation(activities: Array<ReportActivity>) {
  try {
    for (let i = 0; i < activities.length; i++) {
      const [toHours, toMinutes] = activities[i].to ? activities[i].to.split(":").map((item) => Number(item)) : [];
      const [fromHours, fromMinutes] = activities[i].from
        ? activities[i].from?.split(":")?.map((item) => Number(item))
        : [];
      activities[i].validation = { isValid: true };

      if (i > 1 && checkIntersection(activities[i - 2].to, activities[i].from)) {
        activities[i - 2].validation.isValid = false;
        activities[i - 2].validation.cell = "time";
        activities[i - 2].validation.description = "Intersection of time intervals";
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "time";
        activities[i].validation.description = "Intersection of time intervals";
      }
      if (activities[i].duration <= 0) {
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "duration";
        activities[i].validation.description = "Negative or zero duration";
      }
      if (activities[i].project && !activities[i].to) {
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "time";
        activities[i].validation.description = "The event has no end time";
      }
      if (activities[i].description.startsWith("!")) {
        activities[i].mistakes += " startsWith!";
      }
      if (activities[i].to && !activities[i].project) {
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "project";
        activities[i].validation.description = "The project must be specified in the activity";
      }
      if (!activities[i].project) {
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "project";
        activities[i].validation.description = "The project must be specified in the activity";
      }
      if (
        toHours < 0 ||
        toHours > 23 ||
        fromHours < 0 ||
        fromHours > 23 ||
        toMinutes < 0 ||
        toMinutes > 59 ||
        fromMinutes < 0 ||
        fromMinutes > 59
      ) {
        activities[i].validation.isValid = false;
        activities[i].validation.cell = "time";
        activities[i].validation.description = "Impossible time";
      }
      if (
        activities[i].project &&
        !activities[i].project.startsWith("!") &&
        !activities[i].activity &&
        !activities[i].description
      ) {
        activities[i].mistakes += "No activity or description";
      }
    }

    return activities;
  } catch (err) {
    console.log(err);
    return activities;
  }
}

export function stringToMinutes(str: string) {
  const [hours, minutes] = str.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function addSuggestions(
  activities: Array<ReportActivity> | null,
  latestProjAndDesc: Record<string, [string]>,
  latestProjAndAct: Record<string, [string]>,
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
  } catch (err) {
    console.log(err);
  }
}
