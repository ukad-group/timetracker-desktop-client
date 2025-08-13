import { getCurrentTimeRoundedUp } from "@/helpers/utils/datetime-ui";
import { parseReport, serializeReport } from "@/helpers/utils/reports";

export const getCurrentCursorLineValue = (textarea: HTMLTextAreaElement, report: string) => {
  const cursorPosition = textarea.selectionStart;
  const currentLineStart = report.lastIndexOf("\n", cursorPosition - 1) + 1;
  const currentLineEnd = report.indexOf("\n", cursorPosition);

  return report.slice(currentLineStart, currentLineEnd !== -1 ? currentLineEnd : undefined);
};

export const getReportWithCopiedLine = (currentLine: string, report: string): string => {
  const reportAndNotes = parseReport(report);
  const activities = reportAndNotes[0] || [];
  const lastActivity = activities[activities.length - 1];

  const isCursorOnRegistration = parseReport(currentLine)[0]?.length !== 0;

  if (!isCursorOnRegistration) return report;

  const currentLineItems = currentLine.split(" - ");

  // forbid copying the end of the day
  if (currentLineItems.length <= 2 && !currentLineItems[1]?.trim()) return report;

  const project = currentLineItems[1];
  let activity = "";
  let description = "";

  if (currentLineItems.length === 3) {
    description = currentLineItems[2];
  }

  if (currentLineItems.length === 4) {
    activity = currentLineItems[2];
    description = currentLineItems[3];
  }

  // if user hasn't end of the day
  if (!lastActivity?.isBreak) {
    activities.push({
      from: getCurrentTimeRoundedUp(),
      project: project,
      activity: activity,
      description: description,
      to: getCurrentTimeRoundedUp(),
    });
  } else {
    lastActivity.project = project;
    lastActivity.activity = activity;
    lastActivity.description = description;
    lastActivity.to = getCurrentTimeRoundedUp();
  }

  return (
    serializeReport(activities) +
    (!reportAndNotes[1] || reportAndNotes[1].startsWith("undefined") ? "" : reportAndNotes[1])
  );
};
