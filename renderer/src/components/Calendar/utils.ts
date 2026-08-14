import { extractDatesFromPeriod, getWeekNumber, isTheSameDates } from "@/helpers/utils/datetime-ui";
import {
  DayOff,
  ApiDayOff,
  TTUserInfoProps,
  ParsedReport,
  VacationSickDaysData,
  FormattedReport,
  SumWorkDurationByWeekProps,
} from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES, OFFLINE_MESSAGE } from "@/helpers/constants";
import { parseReport, validation } from "@/helpers/utils/reports";
import { isOnline } from "@/utils/onlineStatus";
import { ReportActivity } from "@/helpers/utils/types";

export const loadHolidaysAndVacations = async (calendarDate: Date): Promise<DayOff[]> => {
  try {
    const TTUserInfo: TTUserInfoProps = await JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
    );

    if (!TTUserInfo) return [];

    const { accessToken, userEmail, refreshToken } = TTUserInfo;

    const userPromises = [];
    let nextYearVacationsPromise: Promise<VacationSickDaysData> | undefined;
    let prevYearVacationsPromise: Promise<VacationSickDaysData> | undefined;

    const vacationsPromise: Promise<VacationSickDaysData> = global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.TIMETRACKER_GET_VACATIONS,
      accessToken,
      userEmail,
      calendarDate,
    );

    // if calendar is in december - get next year info
    if (calendarDate.getMonth() === 11) {
      const currentDate = new Date(calendarDate);
      const nextYear = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));

      nextYearVacationsPromise = global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_GET_VACATIONS,
        accessToken,
        userEmail,
        nextYear,
      );
    }

    // if calendar is in january - get previous year info
    if (calendarDate.getMonth() === 0) {
      const currentDate = new Date(calendarDate);
      const prevYear = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));

      prevYearVacationsPromise = global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_GET_VACATIONS,
        accessToken,
        userEmail,
        prevYear,
      );
    }

    userPromises.push(vacationsPromise);

    if (nextYearVacationsPromise) userPromises.push(nextYearVacationsPromise);
    if (prevYearVacationsPromise) userPromises.push(prevYearVacationsPromise);

    const userFetchedData = (await Promise.all(userPromises)) as (VacationSickDaysData | string)[];

    if (userFetchedData.some((data) => data === "invalid_token")) {
      const refreshedPlannerCreds = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_PLANNER_TOKEN,
        refreshToken,
      );

      const refreshedUserInfo = {
        ...TTUserInfo,
        accessToken: refreshedPlannerCreds?.access_token,
        refreshToken: refreshedPlannerCreds?.refresh_token,
      };

      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
        LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
        JSON.stringify(refreshedUserInfo),
      );

      return await loadHolidaysAndVacations(calendarDate);
    }

    const vacationsAndSickdays: ApiDayOff[] = [];

    userFetchedData.forEach((data) => {
      if (typeof data !== "string" && data.periods) {
        data.periods.forEach((period: ApiDayOff) => vacationsAndSickdays.push(period));
      }
    });

    const userDaysOff: DayOff[] = [];

    vacationsAndSickdays.forEach((item) => {
      const singleDayOff = isTheSameDates(new Date(item.dateFrom), new Date(item.dateTo));

      if (singleDayOff) {
        userDaysOff.push({
          date: new Date(item?.dateFrom),
          duration: item?.quantity,
          description: item?.description,
          type: item?.type,
          status: item.status,
        });
      }
    });

    vacationsAndSickdays.forEach((item) => {
      const periodDayOff = !isTheSameDates(new Date(item.dateFrom), new Date(item.dateTo));

      if (periodDayOff) {
        const formattedPeriodDates = extractDatesFromPeriod(item, userDaysOff);

        formattedPeriodDates.forEach((periodDay) => {
          userDaysOff.push(periodDay);
        });
      }
    });

    return userDaysOff;
  } catch (error) {
    console.log(error);

    const online = await isOnline();

    if (!online) {
      console.log(OFFLINE_MESSAGE);
    }
    return [];
  }
};

export const getFormattedReports = (reports: ParsedReport[]) => {
  return reports.map((report) => {
    const { reportDate, data } = report;
    const parsedActivities = (parseReport(data)[0] || []).filter(
      (activity: Partial<ReportActivity>): activity is ReportActivity =>
        activity.id !== undefined && !!activity.from && !!activity.to && !activity.isBreak,
    );
    const activities: ReportActivity[] = validation(parsedActivities);
    const workDurationMs = activities.reduce((acc, { duration }) => acc + (duration || 0), 0);

    return {
      date: reportDate,
      week: getWeekNumber(reportDate),
      workDurationMs: workDurationMs,
      isValid: activities.every((report: ReportActivity) => report.validation.isValid),
    };
  });
};

export const getSumWorkDurationByWeek = (dataArray: FormattedReport[]): SumWorkDurationByWeekProps => {
  const result: SumWorkDurationByWeekProps = {};

  dataArray.forEach((item) => {
    if (result[item.week]) {
      result[item.week] += item.workDurationMs;
    } else {
      result[item.week] = item.workDurationMs;
    }
  });

  return result;
};
