import { useContext } from "react";
import Tooltip from "@/shared/Tooltip/Tooltip";
import { formatDuration } from "@/helpers/utils/reports";
import { TimeBadge } from "@/shared/TimeBadge";
import { MS_PER_HOUR } from "@/helpers/utils/datetime-ui";
import { Loader } from "@/shared/Loader";
import MainViewTable from "./MainViewTable";
import { ActivitiesTableContext } from "../context";

const MainView = () => {
  const context = useContext(ActivitiesTableContext);
  if (!context) return null;
  const { copyToClipboardHandle, totalDuration, tableActivities, selectedDate, isLoading } = context;

  return (
    <table className="min-w-full divide-y divide-gray-300 table-fixed dark:divide-gray-600">
      <thead className="text-gray-900 dark:text-dark-heading">
        <tr>
          <th scope="col" className="w-24 pb-6 px-3 text-left text-sm font-semibold">
            Interval
          </th>
          <th scope="col" className="w-24 pb-6 px-3 text-left text-sm font-semibold">
            Duration
          </th>
          <th scope="col" className="w-32 pb-6 px-3 text-left text-sm font-semibold relative">
            <span className="block absolute text-xs text-gray-500 top-[22px] dark:text-slate-400">activity</span>
            Project
          </th>
          <th scope="col" className="pb-6 px-3 text-left text-sm font-semibold">
            Description
          </th>

          <th scope="col" className="relative w-8 pb-6 pl-3 pr-4 sm:pr-6 md:pr-0">
            <span className="sr-only">Copy</span>
          </th>
          <th scope="col" className="relative w-8 pb-6 pl-3 pr-4 sm:pr-6 md:pr-0">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="text-gray-500 dark:text-slate-400">
        <MainViewTable />
        <tr>
          <td className="py-4 px-3 text-sm whitespace-nowrap">
            <p>Total</p>
          </td>
          <td
            className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-dark-heading whitespace-nowrap"
            onClick={copyToClipboardHandle}
          >
            <Tooltip isClickable>
              <p data-column="total">{formatDuration(totalDuration)}</p>
            </Tooltip>
          </td>
          <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-dark-heading whitespace-nowrap">
            {tableActivities.length > 0 && (
              <TimeBadge
                hours={totalDuration / MS_PER_HOUR}
                startTime={tableActivities[0].from}
                selectedDate={selectedDate}
              />
            )}
          </td>
          <td colSpan={3}>{isLoading && <Loader />}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default MainView;
