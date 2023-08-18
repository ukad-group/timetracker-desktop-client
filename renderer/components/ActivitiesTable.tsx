import clsx from "clsx";
import { useMemo } from "react";
import { ReportActivity, formatDuration, validation } from "../utils/reports";

type ActivitiesTableProps = {
  activities: Array<ReportActivity>;
  onEditActivity: (activity: ReportActivity) => void;
};
const msPerHour = 60 * 60 * 1000;
export default function ActivitiesTable({
  activities,
  onEditActivity,
}: ActivitiesTableProps) {
  const nonBreakActivities = useMemo(() => {
    return validation(activities).filter((activity) => !activity.isBreak);
  }, [activities]);

  const totalDuration = useMemo(() => {
    return nonBreakActivities.reduce((value, activity) => {
      return value + (activity.duration ? activity.duration : 0);
    }, 0);
  }, [nonBreakActivities]);

  return (
    <table className="min-w-full divide-y divide-gray-300 table-fixed">
      <thead>
        <tr>
          <th
            scope="col"
            className="w-24 pb-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
          >
            Interval
          </th>
          <th
            scope="col"
            className="w-24 pb-3.5 px-3 text-left text-sm font-semibold text-gray-900"
          >
            Duration
          </th>
          <th
            scope="col"
            className="pb-3.5 px-3 text-left text-sm font-semibold text-gray-900 relative
            after:content-['activity'] after:block after:absolute after:text-xs after:text-gray-500 after:top-[18px]"
          >
            Project
          </th>
          <th
            scope="col"
            className="pb-3.5 px-3 text-left text-sm font-semibold text-gray-900"
          >
            Description
          </th>
          <th scope="col" className="relative pb-3.5 pl-3 pr-4 sm:pr-6 md:pr-0">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {nonBreakActivities.map((activity) => (
          <tr key={activity.id}>
            <td className="py-4 pl-4 pr-3 text-sm text-gray-500 whitespace-nowrap sm:pl-6 md:pl-0">
              <span
                className={clsx({
                  "py-1 px-2 -mx-2 rounded-full font-medium bg-red-100 text-red-800":
                    !activity.isValid,
                })}
              >
                {activity.from} - {activity.to}
              </span>
            </td>
            <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
              {formatDuration(activity.duration)}
            </td>
            <td className="px-3 py-4 text-sm font-medium text-gray-900">
              {activity.project}
              <span className="block text-xs text-gray-500 mt-1">
                {activity.activity}
              </span>
            </td>
            <td className="px-3 py-4 text-sm text-gray-500">
              <span
                className={clsx({
                  "py-1 px-2 -mx-2 rounded-full font-medium bg-yellow-100 text-yellow-800":
                    activity.mistakes?.includes("startsWith!"),
                })}
              >
                {activity.description}
              </span>
              {activity.mistakes?.includes("startsWith!") && (
                <span className="block text-xs text-gray-500 mt-1">
                  Perhaps you wanted to report a break
                </span>
              )}
            </td>
            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6 md:pr-0">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-900"
                onClick={() => onEditActivity(activity)}
              >
                Edit
              </a>
            </td>
          </tr>
        ))}
        <tr>
          <td className="py-4 pl-4 pr-3 text-sm text-gray-500 whitespace-nowrap sm:pl-6 md:pl-0">
            Total
          </td>
          <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
            {formatDuration(totalDuration)}
          </td>
          <td
            className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap"
            colSpan={4}
          >
            {totalDuration < 8 * msPerHour && getLackBadge(totalDuration)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function getLackBadge(hours: number) {
  if (hours < 6 * msPerHour) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        less than 6h
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      less than 8h
    </span>
  );
}
