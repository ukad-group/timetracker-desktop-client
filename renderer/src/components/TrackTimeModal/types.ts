import { ReportActivity } from "@/helpers/utils/types";

export type TrackTimeModalProps = {
  activities: Array<ReportActivity> | null;
  isOpen: boolean;
  editedActivity: (Partial<ReportActivity> & { from: string; to: string }) | "new";
  latestProjAndAct: Record<string, [string]>;
  latestProjAndDesc: Record<string, [string]>;
  close: () => void;
  submitActivity: (activity: Omit<ReportActivity, "id"> & Pick<ReportActivity, "id">) => void;
  selectedDate: Date;
};
