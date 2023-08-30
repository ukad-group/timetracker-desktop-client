import next from "next/types";

export type ReportActivity = {
  id: number;
  from: string;
  to: string;
  duration: number;
  project: string;
  activity?: string;
  description?: string;
  isBreak?: boolean;
  isValid?: boolean;
  mistakes?: string;
};
export type ReportAndNotes = [Array<Partial<ReportActivity>>, string];
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

  for (const line of lines) {
    if (!timeRegex.test(line.slice(0, 8))) {
      reportComments += line + "\n";
      continue;
    }
    const registration = {
      id: reportCount,
      from: "",
      project: "",
      activity: "",
      description: "",
      isBreak: false,
      isValid: true,
      mistakes: "",
    };

    // This code uses the string type to write the time.
    const timeMatch = line.match(timeRegex);
    const hours = parseInt(timeMatch[0].match(hoursRegex)[0]);
    const minutes = parseInt(timeMatch[0].match(minutesRegex)[0]);
    const startTime = new Date();
    startTime.setHours(hours);
    startTime.setMinutes(minutes);
    // const from = startTime;

    registration.from = timeRegex.exec(line)[0];
    if (reportCount > 0) {
      reportItems[reportCount - 1].to = registration.from;

      //This code uses another function in the api.
      // reportItems[reportCount - 1].duration = Math.floor((reportItems[reportCount - 1].to - reportItems[reportCount - 1].from) / (1000 * 60));

      reportItems[reportCount - 1].duration = calcDurationBetweenTimes(
        reportItems[reportCount - 1].from,
        reportItems[reportCount - 1].to
      );
    }
    // removing time
    let currentLine = line.replace(timeRegex, "");

    // removing registrationDate if exists. Request from Denys Denysenko
    if (dateRegex.test(currentLine)) {
      const dateAsString = currentLine.match(dateRegex)[0];
      currentLine = currentLine.replace(dateAsString, "");
    }

    // removing ' - '
    currentLine = currentLine.replace(separatorRegex, "");

    // should skip registraion when task starts from !
    const isBreak = workingTimeRegex.test(currentLine);
    if (isBreak) {
      registration.project = currentLine;
      registration.isBreak = isBreak;
      reportItems.push(registration);
      reportCount++;
      continue;
    }
    let projectName = currentLine.match(textRegex)
      ? currentLine.match(textRegex)[0]
      : "";

    if (projectName) {
      registration.project = projectName.trim().toLowerCase();

      // removing project name
      const index = currentLine.indexOf(projectName);
      currentLine =
        index < 0
          ? currentLine
          : currentLine.slice(0, index) +
            currentLine.slice(index + projectName.length);
      // removing ' - '
      currentLine = currentLine.replace(separatorRegex, "");
    }

    const activityInTheLinePattern =
      startTime > new Date(2016, 7, 23) ? /(.+?)\s-\s+/ : /(.+?)-\s*/;
    const activityInTheLineRegex = new RegExp(activityInTheLinePattern);

    if (activityInTheLineRegex.test(currentLine)) {
      let activityName = currentLine.match(activityInTheLineRegex)[1];

      registration.activity =
        startTime > new Date(2016, 7, 26)
          ? activityName.trim()
          : activityName.trim().toLowerCase();

      // removing activity with '-'
      currentLine = currentLine.replace(activityInTheLineRegex, "");
    }
    registration.description = currentLine.replace(/�/g, "-");

    reportItems.push(registration);

    reportCount++;
  }
  reportAndNotes[1] = reportComments.trimEnd();
  return reportAndNotes as ReportAndNotes;
}

export function serializeReport(activities: Array<Partial<ReportActivity>>) {
  let report = "";
  for (const [i, activity] of activities.entries()) {
    const parts: Array<string> = [activity.from];
    parts.push(activity.project);

    if (activity.activity) {
      parts.push(activity.activity);
    }

    if (activity.description) {
      parts.push(activity.description);
    }

    report += `${parts.join(" - ")}\n`;
    const nextActivity = activities[i + 1];
    if (nextActivity && nextActivity.from !== activity.to) {
      activity.to ? (report += `${activity.to} - !\n`) : "";
    }
    if (!nextActivity) {
      activity.to ? (report += `${activity.to} - \n`) : "";
    }
  }
  return report;
}

export function calcDurationBetweenTimes(from: string, to: string): number {
  if (from == undefined || to == undefined) {
    return null;
  }
  const startParts = from.split(":");
  const endParts = to.split(":");

  const startHours = parseInt(startParts[0], 10) || 0;
  const startMinutes = parseInt(startParts[1], 10) || 0;

  const endHours = parseInt(endParts[0], 10) || 0;
  const endMinutes = parseInt(endParts[1], 10) || 0;

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const totalMinutes = endTotalMinutes - startTotalMinutes;

  const milliseconds = totalMinutes * 60 * 1000;

  return milliseconds;
}

export function formatDuration(ms: number): string {
  if (ms == undefined) return;
  const minutes = ms / 1000 / 60;
  const hours = minutes / 60;

  if (Math.abs(hours) < 1) {
    const minutes = Math.round(ms / 1000 / 60);
    return `${minutes}m`;
  }
  return `${Math.floor(hours * 100) / 100}h`;
}

export function checkIntersection(previousTo: string, currentFrom: string) {
  const [hoursTo, minutesTo] = previousTo.split(":");
  const [hoursFrom, minutesFrom] = currentFrom.split(":");
  const toInMinutes = Number(hoursTo) * 60 + Number(minutesTo);
  const fromInMinutes = Number(hoursFrom) * 60 + Number(minutesFrom);
  return fromInMinutes < toInMinutes;
}
export function validation(activities: Array<ReportActivity>) {
  for (let i = 0; i < activities.length; i++) {
    if (i > 0 && checkIntersection(activities[i - 1].to, activities[i].from)) {
      activities[i - 1].isValid = false;
    }
    if (
      activities[i].duration <= 0 ||
      (activities[i].project && !activities[i].to)
    ) {
      activities[i].isValid = false;
    }
    if (activities[i].description.startsWith("!")) {
      activities[i].mistakes += " startsWith!";
    }
    if (i > 0 && activities[i].to && !activities[i].project) {
      activities[i].isValid = false;
    }
  }
  return activities;
}
