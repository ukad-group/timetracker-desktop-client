import { FormattedReport, DayOff, ApiDayOff } from "@/components/Calendar/types";

export const DAY = 60 * 60 * 24 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function checkIsToday(date: Date): boolean {
  const now = new Date();
  const chosenDate = new Date(date);

  return now.setHours(0, 0, 0, 0) === chosenDate.setHours(0, 0, 0, 0);
}

export function isTheSameDates(date1: Date, date2: Date): boolean {
  const firstDate = new Date(date1);
  const socondDate = new Date(date2);

  return firstDate.setHours(0, 0, 0, 0) === socondDate.setHours(0, 0, 0, 0);
}

export const getWeekNumber = (dateString: string) => {
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1;
  const day = parseInt(dateString.substring(6, 8), 10);

  const date = new Date(year, month, day);

  date.setDate(date.getDate() + 4 - (date.getDay() || 7));

  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / DAY + 1) / 7);

  return weekNumber;
};

export function getDateFromString(dateString: string) {
  const year = parseInt(dateString.slice(0, 4), 10);
  const month = parseInt(dateString.slice(4, 6), 10) - 1;
  const day = parseInt(dateString.slice(6, 8), 10);

  return new Date(year, month, day);
}

export function getMonthWorkHours(monthReports: FormattedReport[], calendarDate: Date) {
  const currentYear = calendarDate.getFullYear();
  const currentMonth = (calendarDate.getMonth() + 1).toString().padStart(2, "0");

  const query = currentYear + currentMonth;

  return monthReports.reduce((acc, report) => {
    if (report.date.includes(query)) acc += report.workDurationMs;
    return acc;
  }, 0);
}

export function getRequiredHours(calendarDate: Date, daysOff: DayOff[], lastDay: Date) {
  if (!daysOff) return;

  let totalWorkHours = 0;

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const monthDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i);

    const isWeekend = monthDay.getDay() === 0 || monthDay.getDay() === 6;
    const dayOff = daysOff.find((day) => isTheSameDates(monthDay, day.date) && day.status !== 3);

    if (!isWeekend && !dayOff) {
      totalWorkHours += 8;
    } else if (dayOff && dayOff?.duration !== 8) {
      totalWorkHours += 8 - dayOff.duration; // detect not a full dayOff
    }
  }

  return totalWorkHours * 3600000;
}

export function mathOvertimeUndertime(
  formattedQuarterReports: FormattedReport[],
  calendarDate: Date,
  daysOff: DayOff[],
  selectedDate: Date,
) {
  const monthWorkHours = getMonthWorkHours(formattedQuarterReports, selectedDate);
  const requiredHours = getRequiredHours(calendarDate, daysOff, selectedDate);

  if (monthWorkHours - requiredHours === 0) {
    return { overUnder: "", overUnderHours: 0 };
  }

  if (monthWorkHours > requiredHours) {
    return {
      overUnder: "overtime",
      overUnderHours: monthWorkHours - requiredHours,
    };
  } else {
    return {
      overUnder: "undertime",
      overUnderHours: requiredHours - monthWorkHours,
    };
  }
}

export function extractDatesFromPeriod(period: ApiDayOff, holidays: DayOff[]) {
  const dateStart = new Date(new Date(period?.dateFrom).toISOString().slice(0, -1));
  const dateEnd = new Date(new Date(period?.dateTo).toISOString().slice(0, -1));
  const vacationRange = generateDateRange(dateStart, dateEnd);

  return vacationRange
    .filter((date) => {
      return (
        date.getDay() >= 1 && date.getDay() <= 5 && holidays.some((holiday) => !isTheSameDates(holiday.date, date))
      );
    })
    .map((date) => {
      return {
        date: date,
        duration: period?.quantity,
        description: period?.description,
        type: period?.type,
        status: period.status,
      };
    });
}

export function generateDateRange(startDate: Date, endDate: Date) {
  const dateRange: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateRange;
}

export function getCeiledTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const ceilHours = Math.ceil(minutes / 15 > 3 ? hours + 1 : hours)
    .toString()
    .padStart(2, "0");

  const ceilMinutes = (Math.ceil(minutes / 15 > 3 ? 0 : minutes / 15) * 15).toString().padStart(2, "0");

  return `${ceilHours}:${ceilMinutes}`;
}

export const getTimeFromEventObj = (date: string) => {
  let dateString = date;
  const dateArray = dateString ? dateString.split("") : [];

  if (dateArray.length && dateArray[dateArray.length - 1] === "Z") {
    dateArray.pop();
    dateString = dateArray.join("");
  }

  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const padStringToMinutes = (timeString: string) => {
  if (!timeString) return;

  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

export const convertMillisecondsToTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}`;
};

export const getWeekDates = (inputDate: Date) => {
  const startDate = new Date(inputDate);
  startDate.setDate(inputDate.getDate() - inputDate.getDay() + (inputDate.getDay() === 0 ? -6 : 1));

  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    weekDays.push(currentDate);
  }

  return weekDays;
};

export const getMonthDates = (inputDate: Date) => {
  const firstDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
  const lastDay = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);
  const monthDates = [];

  for (let i = firstDay.getDate(); i <= lastDay.getDate(); i++) {
    const currentDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), i);
    monthDates.push(currentDate);
  }

  return monthDates;
};

export const getCurrentTimeRoundedUp = () => {
  const currentTime = new Date();
  const minutes = currentTime.getMinutes();
  const minutesToAdd = (15 - (minutes % 15)) % 15;

  currentTime.setMinutes(minutes + minutesToAdd);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formattedTime;
};

export const formatDate = (date: Date, type: "short" | "long" = "long") =>
  date.toLocaleDateString("en-US", {
    month: type,
    day: "numeric",
    year: "numeric",
  });

export const getDateTimeData = (selectedDate: Date) => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const floorMinutes = (Math.floor(Number(minutes) / 15) * 15).toString().padStart(2, "0");
  const ceilHours = Math.ceil(Number(minutes) / 15 > 3 ? Number(hours) + 1 : Number(hours))
    .toString()
    .padStart(2, "0");
  const ceilMinutes = (Math.ceil(Number(minutes) / 15 > 3 ? 0 : Number(minutes) / 15) * 15).toString().padStart(2, "0");
  const isToday = checkIsToday(selectedDate);

  return {
    now,
    hours,
    minutes,
    floorMinutes,
    ceilHours,
    ceilMinutes,
    isToday,
  };
};
