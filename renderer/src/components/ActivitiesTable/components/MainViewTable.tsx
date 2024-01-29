import { useContext } from "react";
import clsx from "clsx";
import Tooltip from "@/shared/Tooltip/Tooltip";
import { formatDuration } from "@/helpers/utils/reports";
import { PencilSquareIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ActivitiesTableContext } from "../context";

const MainViewTable = () => {
  const {
    tableActivities,
    ctrlPressed,
    firstKey,
    secondKey,
    copyToClipboardHandle,
    copyActivityHandler,
    editActivityHandler
  } = useContext(ActivitiesTableContext);

  return tableActivities.length > 0 &&
    tableActivities?.map((activity, i) => (
      <tr
        key={i}
        className={clsx(
          `border-b border-gray-200 dark:border-gray-300 transition-transform `,
          {
            "border-dashed border-b-2 border-gray-200 dark:border-gray-400":
              tableActivities[i].to != tableActivities[i + 1]?.from &&
              i + 1 !== tableActivities.length &&
              !activity.calendarId,
            "dark:border-b-2 dark:border-zinc-800": activity.calendarId,
            "scale-105 ":
              (Number(firstKey) === i + 1 && !secondKey) ||
              (Number(firstKey + secondKey) === i + 1 && secondKey),
          },
        )}
      >
        <td
          className={`relative py-4 pl-4 pr-3 text-sm  whitespace-nowrap sm:pl-6 md:pl-0 ${
            activity.calendarId ? "opacity-50" : ""
          }`}
        >
          {ctrlPressed && (
            <span className="absolute -left-4 text-blue-700">{i + 1}</span>
          )}
          <span
            className={clsx({
              "py-1 px-2 -mx-2 rounded-full font-medium bg-red-100 text-red-800 dark:text-red-400 dark:bg-red-400/20":
                !activity.isValid,
            })}
          >
            {activity.from} - {activity.to}
          </span>
        </td>
        <td
          className={`px-3 py-4 text-sm font-medium text-gray-900 dark:text-dark-heading whitespace-nowrap ${
            activity.calendarId ? "opacity-50" : ""
          }`}
        >
          <Tooltip isClickable>
            <p data-column="duration" onClick={copyToClipboardHandle}>
              {formatDuration(activity.duration)}
            </p>
          </Tooltip>
        </td>
        <td
          className={`relative px-3 py-4 ${
            activity.calendarId ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center gap-1">
            <Tooltip isClickable>
              <p
                className="text-sm font-medium text-gray-900 dark:text-dark-heading"
                onClick={copyToClipboardHandle}
              >
                {activity.project}
              </p>
            </Tooltip>
            {activity.isNewProject && (
              <p
                className="flex items-center h-fit w-fit text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:text-green-400 dark:bg-green-400/20 ">
                new
              </p>
            )}
          </div>
          {activity.activity && (
            <Tooltip isClickable>
              <p
                className="block text-xs font-semibold mt-1 old-break-word "
                onClick={copyToClipboardHandle}
              >
                {activity.activity}
              </p>
            </Tooltip>
          )}
        </td>
        <td
          className={`px-3 py-4 text-sm ${
            activity.calendarId ? "opacity-50" : ""
          }`}
        >
          {activity.description && (
            <Tooltip isClickable>
              <p onClick={copyToClipboardHandle} className="old-break-word">
                {activity.description}
              </p>
            </Tooltip>
          )}
          {activity.mistakes && (
            <p
              onClick={copyToClipboardHandle}
              className="w-fit old-break-word py-1 px-2 -mx-2 rounded-2xl font-medium bg-yellow-100 text-yellow-800 dark:text-yellow-400 dark:bg-yellow-400/20"
            >
              {activity.mistakes}
            </p>
          )}
        </td>
        <td className="relative text-sm font-medium text-right whitespace-nowrap">
          <div className={`${activity.calendarId ? "invisible" : ""}`}>
            <button
              className="group py-4 px-3"
              title="Copy"
              onClick={() => {
                copyActivityHandler(activity);
              }}
            >
              <Square2StackIcon
                className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 group-hover:dark:text-dark-heading" />
            </button>
          </div>
        </td>
        <td className="relative text-sm font-medium text-right whitespace-nowrap">
          <button
            className="group py-4 px-3"
            title={activity.calendarId ? "Add" : "Edit"}
            onClick={() => {
              editActivityHandler(activity);
            }}
          >
            {!activity.calendarId && (
              <PencilSquareIcon
                className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 group-hover:dark:text-dark-heading" />
            )}

            {activity.calendarId && (
              <PlusIcon
                className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 group-hover:dark:text-dark-heading" />
            )}
          </button>
        </td>
      </tr>
    ));
};

export default MainViewTable;