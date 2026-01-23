import { getMonthDates, getWeekDates } from "@/helpers/utils/datetime-ui";
import { Activity, Total } from "@/components/Totals/types";
import { parseReport } from "@/helpers/utils/reports";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { ReportActivity } from "@/helpers/utils/types";

export const getDates = (period, selectedDate) => {
  switch (period) {
    case "week":
      return getWeekDates(selectedDate);

    case "month":
      return getMonthDates(selectedDate);

    case "day":
    default:
      return [selectedDate];
  }
};

const getParsedActivities = async (day: Date, reportsFolder) => {
  const dayReport = await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT, reportsFolder, day);

  const parsedReportsAndNotes = parseReport(dayReport);

  return parsedReportsAndNotes[0];
};

const getProjectTotals = (activities: ReportActivity[]) =>
  activities.reduce((acc: Total[], curr: ReportActivity) => {
    if (!curr?.project || curr?.project.startsWith("!")) return acc;

    const existingTotal = acc.find((item) => item.name === curr.project);
    const name = curr.activity ? `${curr.activity} - ${curr.description}` : curr.description;

    if (!existingTotal) {
      acc.push({
        id: curr.project,
        name: curr.project,
        duration: curr.duration,
        descriptions: [
          {
            id: name,
            name: name,
            duration: curr.duration,
          },
        ],
        activities: [],
      });
    } else {
      existingTotal.duration += curr.duration ? curr.duration : 0;

      const existingDescription = existingTotal.descriptions.find((desc) => desc.name === name);

      if (existingDescription) {
        existingDescription.duration += curr.duration;
      } else {
        existingTotal.descriptions.push({
          id: name,
          name: name,
          duration: curr.duration,
        });
      }
    }

    return acc;
  }, []);

const sortTotals = (totals) => {
  return totals.sort((totalA, totalB) => totalA.name.localeCompare(totalB.name));
};

const getActivityTotals = (projectName: string, activities: ReportActivity[]) => {
  const filteredActivities = activities.filter((activity: ReportActivity) => activity.project === projectName);

  return filteredActivities.reduce((acc: Activity[], curr: ReportActivity) => {
    const existingTotal = acc.find((item) => item.name === curr.activity);

    if (!existingTotal) {
      acc.push({
        id: curr.activity,
        name: curr.activity,
        duration: curr.duration,
        descriptions: [
          {
            id: curr.description,
            name: curr.description,
            duration: curr.duration,
          },
        ],
      });
    } else {
      existingTotal.duration += curr.duration;

      const existingDescription = existingTotal.descriptions.find((desc) => desc.name === curr.description);

      if (existingDescription) {
        existingDescription.duration += curr.duration;
      } else {
        existingTotal.descriptions.push({
          id: curr.description,
          name: curr.description,
          duration: curr.duration,
        });
      }
    }

    return acc;
  }, []);
};

export const getTotals = async ({ period, selectedDate, reportsFolder, setTotals }) => {
  const dates = getDates(period, selectedDate);

  const parsedActivities = await Promise.all(dates.map((date) => getParsedActivities(date, reportsFolder)));

  const combinedActivities = parsedActivities.reduce((acc, act) => {
    if (act) {
      return [...acc, ...act];
    }

    return acc;
  }, []);

  const initialProjectTotals = getProjectTotals(combinedActivities);
  const sortedProjectTotals = sortTotals(initialProjectTotals);
  const fullProjectTotals = sortedProjectTotals.map((total: Total) => {
    const projectActivities = getActivityTotals(total.name, combinedActivities);
    const sortedProjectActivities = sortTotals(projectActivities);

    return { ...total, activities: sortedProjectActivities };
  });

  setTotals(fullProjectTotals);
};

export const createEnding = (date: number) => {
  let suffix = "";

  if (date >= 11 && date <= 13) {
    suffix = "th";
  } else {
    switch (date % 10) {
      case 1:
        suffix = "st";
        break;
      case 2:
        suffix = "nd";
        break;
      case 3:
        suffix = "rd";
        break;
      default:
        suffix = "th";
    }
  }

  return `${date}${suffix}`;
};
