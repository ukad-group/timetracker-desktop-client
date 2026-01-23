import { ReportActivity } from "@/helpers/utils/types";
import { Dispatch, SetStateAction } from "react";

export type TrackTimeButtonProps = {
  onEditActivity: (activity: ReportActivity | "new") => void;
};

export type ActivitiesSectionProps = {
  onEditActivity: (activity: ReportActivity | "new") => void;
  activities: Array<ReportActivity>;
  selectedDate: Date;
  latestProjAndAct: Record<string, [string]>;
  setSelectedDateReport: Dispatch<SetStateAction<String>>;
};

export type PlaceholderProps = {
  onEditActivity: (activity: ReportActivity | "new") => void;
  backgroundError?: string;
  selectedDate: Date;
  setSelectedDateReport: Dispatch<SetStateAction<String>>;
};
