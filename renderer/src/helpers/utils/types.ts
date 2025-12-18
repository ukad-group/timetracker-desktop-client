export type HintConitions = {
  groupName: string;
  newConditions: Array<boolean>;
  existingConditions: Array<boolean | "same">;
};

export type ReportActivity = {
  id: number;
  from: string;
  to: string;
  duration: number;
  project: string;
  activity?: string;
  description?: string;
  isBreak?: boolean;
  validation: {
    isValid: boolean;
    cell?: "time" | "duration" | "project" | "activity" | "description";
    description?: string;
  };
  mistakes?: string;
  calendarId?: string;
  isNewProject?: boolean;
};

export type ActivitiesTableContextType = {
  totalDuration: number;
  tableActivities: ReportActivity[];
  selectedDate: Date;
  isLoading: boolean;
  ctrlPressed: boolean;
  copyToClipboardHandle: (e: React.MouseEvent) => void;
  onEditActivity: (activity: (Partial<ReportActivity> & { from: string; to: string }) | "new") => void;
  activities: ReportActivity[];
  firstKey: string | null;
  secondKey: string | null;
  handleEditActivity: (activity: Partial<ReportActivity> & { from: string; to: string }) => void;
  handleCopyActivity: (activity: ReportActivity) => void;
};

export type ReportAndNotes = [Array<Partial<ReportActivity>>, string];
