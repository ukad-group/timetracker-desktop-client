import { useContext } from "react";
import Tooltip from "@/shared/Tooltip/Tooltip";
import { formatDuration } from "@/helpers/utils/reports";
import { TimeBadge } from "@/shared/TimeBadge";
import { MS_PER_HOUR } from "@/helpers/utils/datetime-ui";
import { Loader } from "@/shared/Loader";
import { ActivitiesTableContext } from "../context";
import CompactViewTable from "./CompactViewTable";

const CompactView = () => {
  const context = useContext(ActivitiesTableContext);
  if (!context) return null;
  const { totalDuration, tableActivities, selectedDate, isLoading } = context;

  return (
    <>
      <h2 id="manual-input-title" className="text-lg font-medium text-gray-900 dark:text-dark-heading">
        Registrations
      </h2>
      <table className="min-w-full divide-y divide-gray-300 table-fixed dark:divide-gray-600">
        <tbody className="text-gray-500 dark:text-slate-400">
          <CompactViewTable />
          <tr>
            <td className="pt-4 px-3 text-sm whitespace-nowrap">
              Total{" "}
              <Tooltip isClickable>
                <p
                  data-column="total"
                  className="px-1 py-1 text-sm font-medium text-gray-900 dark:text-dark-heading whitespace-nowrap"
                >
                  {formatDuration(totalDuration)}
                </p>
              </Tooltip>
            </td>
            <td className="px-1 pt-4 text-sm font-medium text-gray-900 dark:text-dark-heading whitespace-nowrap">
              {tableActivities.length > 0 && (
                <TimeBadge
                  hours={totalDuration / MS_PER_HOUR}
                  startTime={tableActivities[0].from}
                  selectedDate={selectedDate}
                />
              )}
            </td>
            <td>{isLoading && <Loader />}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CompactView;
