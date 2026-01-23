import { ReportActivity } from "@/helpers/utils/types";
import { Dispatch, SetStateAction } from "react";

export type MainPageProps = {
  selectedDateActivities: Array<ReportActivity>;
  setSelectedDateActivities: Dispatch<SetStateAction<Array<ReportActivity>>>;
  setShouldAutosave: Dispatch<SetStateAction<boolean>>;
  selectedDate: Date;
  shouldAutosave: boolean;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  latestProjAndAct: Record<string, [string]>;
  setTrackTimeModalActivity: Dispatch<SetStateAction<ReportActivity | "new">>;
};

export type Section = {
  sectionName: string;
  section: JSX.Element;
  order: number;
  side: "left" | "right";
};
