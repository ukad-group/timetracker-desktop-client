import React, { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { useMainStore } from "@/store/mainStore";
import { shallow } from "zustand/shallow";
import { MONTHS } from "@/helpers/utils/datetime-ui";
import { formatDurationAsDecimals, parseReport } from "@/helpers/utils/reports";
import { ParsedReport, TTUserInfoProps } from "../Calendar/types";
import { Loader } from "@/shared/Loader";
import Tooltip from "@/shared/Tooltip/Tooltip";
import { BookingsProps, BookingFromApi, BookedSpentStat } from "./types";
import { LOCAL_STORAGE_VARIABLES, OFFLINE_MESSAGE } from "@/helpers/constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import RefreshIcon from "@/shared/RefreshIcon/RefreshIcon";
import isOnline from "is-online";
import { ReportActivity } from "@/helpers/utils/types";

const Bookings = ({ calendarDate }: BookingsProps) => {
  const showBookings = !!JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
  );

  if (!showBookings) return;

  const [loading, setLoading] = useState(false);
  const [bookedProjects, setBookedProjects] = useState<BookingFromApi[]>([]);
  const [bookedSpentStatistic, setBookedSpentStatistic] = useState<BookedSpentStat[]>([]);
  const currentReadableMonth = MONTHS[calendarDate.getMonth()];
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);

  const totalBookingTime: number = useMemo(() => {
    return bookedProjects.reduce((acc, project) => acc + (project?.plans[0]?.hours || 0), 0);
  }, [bookedProjects]);

  const totalSpentTime: number = useMemo(() => {
    return bookedSpentStatistic.reduce((acc, project) => acc + (project?.spent || 0), 0);
  }, [bookedSpentStatistic]);

  const getBookings = async (): Promise<BookingFromApi[]> => {
    const TTUserInfo: TTUserInfoProps = JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER),
    );

    if (!TTUserInfo) return;

    const { cookie, userName, refreshToken } = TTUserInfo;

    try {
      setLoading(true);

      const allLoggedProjects = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.TIMETRACKER_GET_BOOKINGS,
        cookie,
        userName,
        calendarDate,
      );

      if (allLoggedProjects === "invalid_token") {
        if (!refreshToken) return;

        const updatedCreds = await global.ipcRenderer.invoke(
          IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN,
          refreshToken,
        );

        const updatedCookie = await global.ipcRenderer.invoke(
          IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN,
          updatedCreds?.id_token,
        );

        const updatedUser = {
          ...TTUserInfo,
          idToken: updatedCreds?.id_token,
          cookie: updatedCookie,
          refreshToken: updatedCreds?.refresh_token,
        };

        global.ipcRenderer.send(
          IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
          LOCAL_STORAGE_VARIABLES.TIMETRACKER_USER,
          JSON.stringify(updatedUser),
        );

        return await getBookings();
      }

      return allLoggedProjects.filter((project: BookingFromApi) => {
        const projectBooking = project?.plans[0];

        if (
          projectBooking?.hours !== 0 &&
          projectBooking?.month === calendarDate?.getMonth() + 1 &&
          projectBooking?.year === calendarDate?.getFullYear()
        ) {
          return project;
        }
      });
    } catch (error) {
      console.log(error);

      const online = await isOnline();

      if (!online) {
        console.log(OFFLINE_MESSAGE);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMonthLocalActivities = async (): Promise<ReportActivity[]> => {
    try {
      const monthLocalReports = await global.ipcRenderer.invoke(
        IPC_MAIN_CHANNELS.APP_FIND_MONTH_PROJECTS,
        reportsFolder,
        calendarDate,
      );
      const oneMonthLocalReports = monthLocalReports.filter((report) => {
        return (
          report.reportDate.split("").slice(4, 6).join("") === (calendarDate.getMonth() + 1).toString().padStart(2, "0")
        );
      });

      const monthParsedActivities = oneMonthLocalReports.map((report: ParsedReport) => {
        return (parseReport(report?.data)[0] || []).filter((activity: ReportActivity) => !activity.isBreak);
      });

      return monthParsedActivities.flat();
    } catch (error) {
      console.log(error);
    }
  };

  const getBookedStatistic = async () => {
    const bookedProjects = await getBookings();

    if (!bookedProjects || bookedProjects?.length === 0) {
      setBookedProjects([]);
      setBookedSpentStatistic([]);
      return;
    }

    setBookedProjects(bookedProjects);

    const monthLocalActivities = await getMonthLocalActivities();
    const bookedSpentStatisticArray: BookedSpentStat[] = bookedProjects
      .map((booking) => {
        const spentProjectTime = monthLocalActivities.reduce((acc, activity) => {
          if (activity?.project === booking?.name && activity?.duration && activity?.duration > 0) {
            return acc + activity?.duration;
          } else {
            return acc;
          }
        }, 0);

        return {
          project: booking?.name,
          booked: booking?.plans[0]?.hours,
          spent: spentProjectTime,
          isOvertime: booking?.plans[0].isOvertime,
          isUndertime: booking?.plans[0].isUndertime,
        };
      })
      .sort((a, b) => {
        const nameA = a.project.toLowerCase();
        const nameB = b.project.toLowerCase();

        if (nameA < nameB) {
          return -1;
        } else if (nameA > nameB) {
          return 1;
        } else {
          return 0;
        }
      });

    setBookedSpentStatistic(bookedSpentStatisticArray);
  };

  const handleRefreshButton = async () => {
    try {
      setLoading(true);
      const online = await isOnline();

      if (!online) {
        alert(OFFLINE_MESSAGE);
      } else {
        getBookedStatistic();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBookedStatistic();

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED, getBookedStatistic);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED);
    };
  }, [calendarDate]);

  const renderProjectsHours = () =>
    bookedSpentStatistic.map((project, i) => (
      <tr key={i} className="border-b dark:border-gray-700">
        <td className="pr-6 py-2 text-gray-700 dark:text-dark-main">
          <Tooltip
            tooltipText={(project.isOvertime && "Overtime") || (project.isUndertime && "Undertime")}
            disabled={!(project.isOvertime || project.isUndertime)}
          >
            <span
              className={clsx("py-1 px-1 rounded-full font-medium -ml-1", {
                "bg-red-100 text-red-800 dark:text-red-400 dark:bg-red-400/20": project.isOvertime,

                "bg-yellow-100 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-400/20": project.isUndertime,
              })}
            >
              {project.project}
            </span>
          </Tooltip>
        </td>

        <td className="px-6 py-2 text-gray-700 dark:text-dark-main">{project.booked}h</td>
        <td className="px-6 py-2 text-gray-700 dark:text-dark-main">{formatDurationAsDecimals(project.spent)}</td>
      </tr>
    ));

  return (
    <div className="relative px-4 py-5 bg-white shadow sm:rounded-lg sm:px-6 dark:bg-dark-container dark:border dark:border-dark-border">
      <div className="flex items-center gap-2 text-gray-900 dark:text-dark-heading mb-2">
        <h2 className="text-lg font-medium">Bookings in {currentReadableMonth}</h2>
        <button
          className="h-4 w-4 hover:rotate-180 duration-300"
          onClick={handleRefreshButton}
          title="Refresh bookings"
          disabled={loading}
        >
          <RefreshIcon className="hover:stroke-blue-400" />
        </button>
      </div>
      {loading && (
        <div className="absolute top-5 right-4">
          <Loader />
        </div>
      )}
      <div className="relative ">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-900 dark:text-dark-heading border-b dark:border-gray-700">
            <tr>
              <th scope="col" className="pr-6 py-3 font-semibold">
                Project
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Booked
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {renderProjectsHours()}
            <tr>
              <td className="pr-6 py-2 text-gray-700 dark:text-dark-main ">Total:</td>
              <td className="px-6 py-2 text-gray-700 dark:text-dark-main">{totalBookingTime}h</td>
              <td className="px-6 py-2 text-gray-700 dark:text-dark-main">
                {formatDurationAsDecimals(totalSpentTime)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
