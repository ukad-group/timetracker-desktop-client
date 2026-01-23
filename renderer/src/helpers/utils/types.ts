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

export type ReportAndNotes = [Array<Partial<ReportActivity>>, string];
