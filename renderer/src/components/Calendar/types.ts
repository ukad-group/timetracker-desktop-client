import { Dispatch, SetStateAction, MutableRefObject, ReactElement } from "react";

export type CalendarProps = {
  reportsFolder: string;
  calendarDate: Date;
  setCalendarDate: Dispatch<SetStateAction<Date>>;
  selectedDate: Date;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  selectedDateReport: string | null;
};

export type ParsedReport = {
  data: string;
  reportDate: string;
};

export type FormattedReport = {
  date: string;
  week: number;
  workDurationMs: number;
  isValid: boolean;
  validationTitle?: string;
};

export type DayOff = {
  date: Date;
  duration: number;
  description: string;
  type: number;
  status: number;
};

export type ApiDayOff = {
  dateFrom: string;
  dateTo: string;
  quantity: number;
  description: string;
  type: number;
  status: number;
};

export type TTUserInfoProps = {
  idToken: string;
  refreshToken: string;
  userName: string;
  userEmail: string;
  cookie: string;
  yearProjects: string[];
  accessToken: string;
};

export type VacationSickDaysData = {
  periods: ApiDayOff[];
};

export type FullCalendarWrapperProps = {
  children: ReactElement;
  calendarDate: Date;
  selectedDate: Date;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  daysOff: DayOff[];
  weekNumberRef: MutableRefObject<any>;
  workDurationByWeek: SumWorkDurationByWeekProps;
};

export type daysOffAccumulatorType = { numberedDays: string[]; hours: number };

export interface SumWorkDurationByWeekProps {
  [week: number]: number;
}
