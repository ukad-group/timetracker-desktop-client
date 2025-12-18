import { getTimeFromEventObj, padStringToMinutes } from "@/helpers/utils/datetime-ui";
import { parseEventTitle } from "@/helpers/utils/utils";
import { calcDurationBetweenTimes } from "@/helpers/utils/reports";
import { ReportActivity } from "@/helpers/utils/types";

export const getTotalDuration = (nonBreakActivities: ReportActivity[]): number =>
  nonBreakActivities.reduce(
    (value: number, activity: ReportActivity) => value + (activity.duration ? activity.duration : 0),
    0,
  );

export const formatEvents = (events: any[], latestProjAndAct: Record<string, [string]>): ReportActivity[] => {
  if (!events.length) {
    return [];
  }

  return events.map((event: any, index: number) => {
    const { start, end } = event;

    const startDateTime = start?.timeZone === "UTC" ? `${start?.dateTime}Z` : start?.dateTime;
    const endDateTime = end?.timeZone === "UTC" ? `${end?.dateTime}Z` : end?.dateTime;

    const from = getTimeFromEventObj(startDateTime || "");
    const to = getTimeFromEventObj(endDateTime || "");

    event = parseEventTitle(event, latestProjAndAct);

    return {
      id: -index - 1, // Use negative IDs for calendar events to avoid conflicts
      from: from,
      to: to,
      duration: calcDurationBetweenTimes(from, to),
      project: event.project || "",
      activity: event.activity || "",
      description: event.description || "",
      validation: { isValid: true },
      calendarId: event.id,
    };
  });
};

export const getActualEvents = (events: any[], activities: ReportActivity[]): any[] => {
  if (!events.length) return [];

  return events.filter((event: any) => {
    const { end } = event;
    const endDateTime = end?.timeZone === "UTC" ? `${end?.dateTime}Z` : end?.dateTime;
    if (!endDateTime) return false;
    const to = getTimeFromEventObj(endDateTime);
    const isOverlapped = activities.some((activity: ReportActivity) => {
      if (!activity.to || !to) return false;
      const activityMinutes = padStringToMinutes(activity.to);
      const eventMinutes = padStringToMinutes(to);
      return activityMinutes !== undefined && eventMinutes !== undefined && activityMinutes >= eventMinutes;
    });

    if (event?.start?.dateTime && event?.end?.dateTime && !isOverlapped) {
      return event;
    }
  });
};
