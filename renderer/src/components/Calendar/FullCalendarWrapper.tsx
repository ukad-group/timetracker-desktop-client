import { cloneElement, ReactElement, Children } from "react";
import { isTheSameDates, MS_PER_HOUR, getWeekNumber } from "@/helpers/utils/datetime-ui";
import { formatDuration } from "@/helpers/utils/reports";
import { DatePointApi, DayCellContentArg, EventContentArg, WeekNumberContentArg } from "@fullcalendar/core";
import { CalendarDaysIcon, FaceFrownIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { DayOff, FullCalendarWrapperProps, daysOffAccumulatorType } from "./types";

const FullCalendarWrapper = ({
  children,
  setSelectedDate,
  calendarDate,
  selectedDate,
  weekNumberRef,
  daysOff,
  workDurationByWeek,
}: FullCalendarWrapperProps) => {
  const dateClickHandle = (info: DatePointApi) => {
    info.date.setHours(1); // by default info.date is 00:00, sometimes it can cause a bug, considering the date as the previous day
    setSelectedDate(info.date);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <>
        {eventInfo.event.extendedProps.isValid === false && (
          <ExclamationCircleIcon className="w-5 h-5 absolute fill-red-500 -top-[25px] -left-[1px] dark:fill-red-500/70" />
        )}
        {eventInfo.event.extendedProps.workDurationMs ? (
          <p className="whitespace-normal">{formatDuration(eventInfo.event.extendedProps.workDurationMs)}</p>
        ) : (
          <p className="whitespace-normal">Empty file</p>
        )}
      </>
    );
  };

  const addCellClassNameHandle = (info: DayCellContentArg) => {
    return isTheSameDates(info.date, selectedDate) ? "fc-custom-today-date" : "";
  };

  const renderWeekNumberContent = (options: WeekNumberContentArg) => {
    const daysOffWeekTotal = daysOff
      ? daysOff.reduce(
          (acc: daysOffAccumulatorType, day: DayOff) => {
            const dayOffStringDate = `${day.date.getFullYear()}${String(day.date.getMonth() + 1).padStart(2, "0")}${String(day.date.getDate()).padStart(2, "0")}`;

            if (
              day.date.getFullYear() === calendarDate.getFullYear() &&
              getWeekNumber(dayOffStringDate) === options.num &&
              !acc.numberedDays.includes(dayOffStringDate)
            ) {
              acc.numberedDays.push(dayOffStringDate);
              acc.hours += day.duration;
            }

            return acc;
          },
          { numberedDays: [], hours: 0 },
        ).hours
      : 0;

    const weekTotalHours = formatDuration((workDurationByWeek[options.num] ?? 0) + daysOffWeekTotal * MS_PER_HOUR);

    return (
      <div ref={weekNumberRef} className="flex flex-col text-xs text-zinc-400">
        <span>week {options.num}</span>
        <span className="self-start">{weekTotalHours}</span>
      </div>
    );
  };

  const getDayCellContent = (info: DayCellContentArg) => {
    if (!daysOff || daysOff?.length === 0) {
      return info.dayNumberText;
    }

    const userDayOff = daysOff?.find((day: DayOff) => isTheSameDates(info.date, day.date));

    if (!userDayOff) {
      return info.dayNumberText;
    }

    const duration = userDayOff?.duration === 8 ? "all day" : userDayOff?.duration + "h";
    let icon: ReactElement | undefined;
    let title: string | undefined;

    switch (userDayOff?.type) {
      case 0:
        icon = <CalendarDaysIcon className="absolute top-[30px] right-[2px] w-5 h-5" />;
        title = `Vacation, ${duration}`;

        break;

      case 1:
        icon = <FaceFrownIcon className="absolute top-[30px] right-[2px] w-5 h-5" />;
        title = `Sickday, ${duration}`;

        break;

      case 2:
        icon = <GlobeAltIcon className="absolute top-[30px] right-[2px] w-5 h-5" />;
        title = userDayOff?.description ? `${userDayOff?.description}, ${duration}` : "Holiday";

        break;

      default:
        return info.dayNumberText;
    }

    return (
      <div>
        {info.dayNumberText}
        {cloneElement(icon, { title })}
      </div>
    );
  };

  const renderChildren = () => {
    return Children.map(children, (child) => {
      return cloneElement(child, {
        dateClick: dateClickHandle,
        eventContent: renderEventContent,
        dayCellClassNames: addCellClassNameHandle,
        weekNumberContent: renderWeekNumberContent,
        dayCellContent: getDayCellContent,
      });
    });
  };

  return <div>{renderChildren()}</div>;
};

export default FullCalendarWrapper;
