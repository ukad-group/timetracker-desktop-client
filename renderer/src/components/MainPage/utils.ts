import { ReportActivity } from "@/helpers/utils/types";

export function toReportActivities(parsedActivities: Array<Partial<ReportActivity>> | undefined): ReportActivity[] {
  if (!parsedActivities?.length) {
    return [];
  }

  return parsedActivities.filter((activity): activity is ReportActivity => {
    if (activity.id === undefined || !activity.from) {
      return false;
    }

    if (activity.to) {
      return true;
    }

    return Boolean(activity.project) && !activity.isBreak;
  }) as ReportActivity[];
}
