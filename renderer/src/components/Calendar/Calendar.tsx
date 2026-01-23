import { useState, useEffect, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { formatDuration } from "@/helpers/utils/reports";
import { NavButtons } from "@/shared/NavButtons";
import { Button } from "@/shared/Button";
import { ErrorPlaceholder, RenderError } from "@/shared/ErrorPlaceholder";
import { getMonthWorkHours, getRequiredHours, MONTHS, mathOvertimeUndertime } from "@/helpers/utils/datetime-ui";
import { getFormattedReports, loadHolidaysAndVacations, getSumWorkDurationByWeek } from "./utils";
import { CalendarProps, ParsedReport, FormattedReport, TTUserInfoProps, DayOff } from "./types";
import {
  LOCAL_STORAGE_VARIABLES,
  TRACK_ANALYTICS,
  HINTS_GROUP_NAMES,
  HINTS_ALERTS,
  OFFLINE_MESSAGE,
} from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { Hint } from "@/shared/Hint";
import { SCREENS } from "@/constants";
import { MS_PER_HOUR } from "@/helpers/utils/datetime-ui";
import { changeHintConditions, trackConnections } from "@/helpers/utils/utils";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";
import FullCalendarWrapper from "./FullCalendarWrapper";
import RefreshIcon from "@/shared/RefreshIcon/RefreshIcon";
import isOnline from "is-online";
import { Loader } from "@/shared/Loader";

export const Calendar = ({
  reportsFolder,
  selectedDate,
  setSelectedDate,
  calendarDate,
  setCalendarDate,
  selectedDateReport,
}: CalendarProps) => {
  const [parsedQuarterReports, setParsedQuarterReports] = useState<ParsedReport[]>([]);
  const [formattedQuarterReports, setFormattedQuarterReports] = useState<FormattedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef(null);
  const allCalendarRef = useRef(null);
  const totalTimeRef = useRef(null);
  const weekNumberRef = useRef(null);
  const currentReadableMonth = MONTHS[calendarDate.getMonth()];
  const currentYear = calendarDate.getFullYear();
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [renderError, setRenderError] = useState<RenderError>({
    errorTitle: "",
    errorMessage: "",
  });
  const { screenSizes } = useScreenSizes();
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const timetrackerUserInfo: TTUserInfoProps = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );
  const getCalendarApi = () => calendarRef.current.getApi();

  const monthWorkedHours = useMemo(() => {
    return formatDuration(getMonthWorkHours(formattedQuarterReports, calendarDate));
  }, [formattedQuarterReports, calendarDate]);

  const monthRequiredHours = useMemo(() => {
    const lastDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);

    return formatDuration(getRequiredHours(calendarDate, daysOff, lastDayOfMonth));
  }, [daysOff, calendarDate]);

  const workRequiredHours = useMemo(() => {
    const { overUnder, overUnderHours } = mathOvertimeUndertime(
      formattedQuarterReports,
      calendarDate,
      daysOff,
      selectedDate,
    );

    const daysRequiredHours = formatDuration(getRequiredHours(calendarDate, daysOff, selectedDate));

    if (!getRequiredHours(calendarDate, daysOff, selectedDate)) return;

    return (
      <p>
        (out of {daysRequiredHours})
        {!!overUnderHours && (
          <span
            className={`ml-1 ${overUnder === "undertime" && overUnderHours >= 8 * MS_PER_HOUR && "text-red-500/50"}`}
          >
            {overUnder === "undertime" ? "-" : "+"}
            {formatDuration(overUnderHours)}
          </span>
        )}
      </p>
    );
  }, [formattedQuarterReports, calendarDate, daysOff, selectedDate]);

  const prevButtonHandle = () => {
    getCalendarApi().prev();
    setCalendarDate((date) => new Date(date.setMonth(date.getMonth() - 1, 1)));
  };

  const nextButtonHandle = () => {
    getCalendarApi().next();
    setCalendarDate((date) => new Date(date.setMonth(date.getMonth() + 1, 1)));
  };

  const todayButtonHandle = () => {
    getCalendarApi().today();
    setCalendarDate(new Date());
  };

  const getQuarterReports = async () => {
    try {
      setParsedQuarterReports(
        await global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_FIND_QUARTER_PROJECTS, reportsFolder, calendarDate),
      );
    } catch (err) {
      console.log("Error details ", err);
      setRenderError({
        errorTitle: "Calendar error",
        errorMessage: "An error occurred when validating reports for the last month. ",
      });
    }
  };

  const handleHintsBehaviour = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.CALENDAR,
        newConditions: [false],
        existingConditions: [false],
      },
    ]);

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      if (scrollTop + clientHeight + 50 >= scrollHeight) {
        changeHintConditions(progress, setProgress, [
          {
            groupName: HINTS_GROUP_NAMES.CALENDAR,
            newConditions: [true],
            existingConditions: [true],
          },
        ]);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  };

  const handleRefreshButton = async () => {
    try {
      setLoading(true);
      const online = await isOnline();

      if (!online) {
        alert(OFFLINE_MESSAGE);
      } else {
        setDaysOff(await loadHolidaysAndVacations(calendarDate));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timetrackerUserInfo) {
      trackConnections(TRACK_ANALYTICS.TIMETRACKER_WEB);
    }

    handleHintsBehaviour();
  }, []);

  useEffect(() => {
    getQuarterReports();

    const calendarFileChangeListener = () => {
      getQuarterReports();
    };

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED, calendarFileChangeListener);

    return () => {
      global.ipcRenderer.removeListener(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED, calendarFileChangeListener);
    };
  }, [calendarDate, selectedDateReport, reportsFolder]);

  useEffect(() => {
    try {
      setFormattedQuarterReports(getFormattedReports(parsedQuarterReports));
    } catch (err) {
      console.log("Error details ", err);
      setRenderError({
        errorTitle: "Calendar error",
        errorMessage: "An error occurred when validating reports for the last month. ",
      });
    }
  }, [parsedQuarterReports]);

  useEffect(() => {
    (async () => {
      setDaysOff(await loadHolidaysAndVacations(calendarDate));
    })();

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.WINDOW_FOCUSED, () => {
      (async () => {
        setDaysOff(await loadHolidaysAndVacations(calendarDate));
      })();
    });

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.WINDOW_FOCUSED);
    };
  }, [calendarDate, selectedDate]);

  useEffect(() => {
    setProgress(progress);
  }, [screenSizes]);

  useEffect(() => {
    if (
      selectedDate.getFullYear() === calendarDate.getFullYear() &&
      selectedDate.getMonth() === calendarDate.getMonth()
    )
      return;

    queueMicrotask(() => {
      const reportDate = new Date(selectedDate);
      getCalendarApi().gotoDate(reportDate);
      setCalendarDate(reportDate);
    });
  }, [selectedDate]);

  if (renderError.errorMessage && renderError.errorTitle) {
    return <ErrorPlaceholder {...renderError} />;
  }

  return (
    <div
      ref={allCalendarRef}
      className="wrapper bg-white p-4 rounded-lg shadow dark:bg-dark-container dark:border dark:border-dark-border"
    >
      <div className="calendar-header h-10 flex items-center justify-between mb-4">
        <div ref={totalTimeRef}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-heading">{`${currentReadableMonth} ${currentYear}`}</h3>
          <div className="flex gap-1 text-xs text-gray-500 dark:text-dark-main">
            Total: {monthWorkedHours} {workRequiredHours}
          </div>
          {timetrackerUserInfo && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-dark-main">
              <p className="text-xs">Required: {monthRequiredHours}</p>
              <button
                className="h-4 w-4 hover:rotate-180 duration-300"
                onClick={handleRefreshButton}
                title="Refresh hours"
              >
                <RefreshIcon className="hover:stroke-blue-400" />
              </button>
              {loading && <Loader className="h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          {calendarDate.getMonth() !== new Date().getMonth() && (
            <Button text="Go to current month" callback={todayButtonHandle} type={"button"} />
          )}
          <NavButtons prevCallback={prevButtonHandle} nextCallback={nextButtonHandle} />
        </div>
        {screenSizes.screenWidth >= SCREENS.LG && (
          <Hint
            displayCondition
            learningMethod="nextClick"
            order={1}
            groupName={HINTS_GROUP_NAMES.CALENDAR}
            referenceRef={allCalendarRef}
            shiftY={150}
            shiftX={50}
            width={"medium"}
            position={{
              basePosition: "right",
              diagonalPosition: "top",
            }}
          >
            {HINTS_ALERTS.CALENDAR}
          </Hint>
        )}
        {screenSizes.screenWidth < SCREENS.LG && (
          <Hint
            displayCondition
            learningMethod="nextClick"
            order={1}
            groupName={HINTS_GROUP_NAMES.CALENDAR}
            referenceRef={allCalendarRef}
            shiftY={50}
            shiftX={0}
            width={"medium"}
            position={{
              basePosition: "top",
              diagonalPosition: "right",
            }}
          >
            {HINTS_ALERTS.CALENDAR}
          </Hint>
        )}
        <Hint
          learningMethod="nextClick"
          order={2}
          groupName={HINTS_GROUP_NAMES.CALENDAR}
          referenceRef={totalTimeRef}
          shiftY={200}
          shiftX={50}
          width={"medium"}
          position={{
            basePosition: "right",
            diagonalPosition: "bottom",
          }}
        >
          {HINTS_ALERTS.CALENDAR_TOTALS}
        </Hint>
        <Hint
          learningMethod="nextClick"
          order={3}
          groupName={HINTS_GROUP_NAMES.CALENDAR}
          referenceRef={weekNumberRef}
          shiftY={200}
          shiftX={50}
          width={"medium"}
          position={{
            basePosition: "right",
            diagonalPosition: "top",
          }}
        >
          {HINTS_ALERTS.CALENDAR_WEEKS}
        </Hint>
      </div>
      <FullCalendarWrapper
        setSelectedDate={setSelectedDate}
        selectedDate={selectedDate}
        calendarDate={calendarDate}
        weekNumberRef={weekNumberRef}
        daysOff={daysOff}
        workDurationByWeek={getSumWorkDurationByWeek(formattedQuarterReports)}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          headerToolbar={false}
          initialView="dayGridMonth"
          firstDay={1}
          events={formattedQuarterReports}
          weekNumbers
          height="auto"
        />
      </FullCalendarWrapper>
    </div>
  );
};
