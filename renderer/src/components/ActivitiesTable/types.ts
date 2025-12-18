import { ReportActivity } from "@/helpers/utils/types";

export type ActivitiesTableProps = {
  activities: ReportActivity[];
  onEditActivity: (activity: (Partial<ReportActivity> & { from: string; to: string }) | "new") => void;
  selectedDate: Date;
  latestProjAndAct: Record<string, [string]>;
  events: ReportActivity[];
  isLoading: boolean;
  validatedActivities: ReportActivity[];
};
