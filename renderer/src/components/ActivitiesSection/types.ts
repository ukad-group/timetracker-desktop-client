import { ReportActivity } from "@/helpers/utils/types";
import { Dispatch, SetStateAction } from "react";

export type TrackTimeButtonProps = {
  onEditActivity: (activity: (Partial<ReportActivity> & { from: string; to: string }) | "new") => void;
};

export type ActivitiesSectionProps = {
  onEditActivity: (activity: (Partial<ReportActivity> & { from: string; to: string }) | "new") => void;
  activities: Array<ReportActivity>;
  selectedDate: Date;
  latestProjAndAct: Record<string, [string]>;
  setSelectedDateReport: Dispatch<SetStateAction<string | null>>;
};

export type PlaceholderProps = {
  onEditActivity: (activity: (Partial<ReportActivity> & { from: string; to: string }) | "new") => void;
  backgroundError?: string;
  selectedDate: Date;
  setSelectedDateReport: Dispatch<SetStateAction<string | null>>;
};
