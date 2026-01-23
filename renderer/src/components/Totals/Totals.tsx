import React, { useState, useEffect, useRef } from "react";
import { convertMillisecondsToTime } from "@/helpers/utils/datetime-ui";
import { useMainStore } from "@/store/mainStore";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { Description, Total, PeriodName, PeriodWithDate } from "./types";
import { TOTAL_PERIODS, DATE_PERIODS } from "./constants";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { getTotals, createEnding } from "./utils";
import TotalsList from "./TotalsList";
import { Hint } from "@/shared/Hint";
import { SCREENS } from "@/constants";
import { HINTS_GROUP_NAMES, HINTS_ALERTS } from "@/helpers/constants";
import { changeHintConditions } from "@/helpers/utils/utils";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { getWeekNumber } from "@/helpers/utils/datetime-ui";

const Totals = ({ selectedDate }) => {
  const year = selectedDate.getFullYear();
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
  const shortMonth = selectedDate.toLocaleDateString("en-US", {
    month: "short",
  });
  const longMonth = selectedDate.toLocaleDateString("en-US", {
    month: "long",
  });
  const day = selectedDate.getDate().toString().padStart(2, "0");
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const [totals, setTotals] = useState<Total[]>([]);
  const [period, setPeriod] = useState<PeriodWithDate>({
    periodName: DATE_PERIODS.DAY,
    date: day + " " + shortMonth,
  });
  const { screenSizes } = useScreenSizes();
  const [showedProjects, setShowedProjects] = useState<string[]>([]);
  const totalsRef = useRef(null);
  const totalsSelectRef = useRef(null);
  const isShowedActivitiesList = (projectName: string) => {
    return showedProjects.includes(projectName);
  };

  useEffect(() => {
    getTotals({
      period: period.periodName,
      selectedDate,
      reportsFolder,
      setTotals,
    });

    const fileChangeListener = () => {
      getTotals({
        period: period.periodName,
        selectedDate,
        reportsFolder,
        setTotals,
      });
    };

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED, fileChangeListener);

    return () => {
      global.ipcRenderer.removeListener(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED, fileChangeListener);
    };
  }, [selectedDate, period]);

  useEffect(() => {
    changePeriod(period.periodName, selectedDate);
  }, [selectedDate]);

  const toggleActivitiesList = (projectName: string) => {
    if (isShowedActivitiesList(projectName)) {
      const filteredShowedProjects = showedProjects.filter((project) => project !== projectName);

      setShowedProjects(filteredShowedProjects);
    } else {
      setShowedProjects([...showedProjects, projectName]);
    }
  };

  const handleCopyDescriptions = (descriptions: Description[], withTime: boolean) => {
    const formattedDescriptions = descriptions.reduce((acc: string[], curr: Description) => {
      const name = curr.name ? curr.name : "";
      const duration = convertMillisecondsToTime(curr.duration);
      let textForCopying = "";

      switch (true) {
        case name.length > 0 && withTime:
          textForCopying = `(${duration}) ${name} `;
          break;

        case !name.length && withTime:
          textForCopying = `(${duration})`;
          break;

        case name.length > 0 && !withTime:
          textForCopying = name;
          break;

        default:
          break;
      }

      textForCopying.length > 0 && acc.push(textForCopying);

      return acc;
    }, []);

    const descriptionsString = formattedDescriptions.join(", ");

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(descriptionsString)
        .then(() => {})
        .catch((err) => {
          console.error("Unable to copy text to clipboard", err);
        });
    }
  };

  const handlePeriodDay = (selectedDate) => {
    const today = new Date();
    if (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth()
    ) {
      return "today";
    } else if (
      selectedDate.getFullYear() === today.getFullYear() &&
      today.getDate() - selectedDate.getDate() === 1 &&
      selectedDate.getMonth() === today.getMonth()
    ) {
      return "yesterday";
    } else {
      return shortMonth + " " + createEnding(day);
    }
  };

  const changePeriod = (periodName, selectedDate) => {
    let dateName = "";

    switch (periodName) {
      case DATE_PERIODS.DAY:
        dateName = handlePeriodDay(selectedDate);
        break;

      case DATE_PERIODS.WEEK:
        dateName = `week ${getWeekNumber(`${year}${month}${day}`)}`;
        break;

      case DATE_PERIODS.MONTH:
        dateName = longMonth;
        break;

      default:
        break;
    }

    setPeriod({ periodName: periodName, date: dateName });
  };

  const onChangeRange = (rangeName: PeriodName) => {
    setShowedProjects([]);
    changePeriod(rangeName, selectedDate);
  };

  useEffect(() => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.TOTALS,
        newConditions: [false],
        existingConditions: [false],
      },
    ]);
  }, []);

  useEffect(() => {
    setProgress(progress);
  }, [screenSizes]);

  const handleOnFocus = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.TOTALS,
        newConditions: [true],
        existingConditions: [true],
      },
    ]);
  };

  return (
    <section
      onFocus={handleOnFocus}
      className="px-4 py-5 bg-white shadow sm:rounded-lg sm:px-6 dark:bg-dark-container dark:border dark:border-dark-border"
    >
      {screenSizes.screenWidth >= SCREENS.LG && (
        <>
          <Hint
            displayCondition
            learningMethod="nextClick"
            order={1}
            groupName={HINTS_GROUP_NAMES.TOTALS}
            referenceRef={totalsRef}
            shiftY={200}
            shiftX={50}
            width={"medium"}
            position={{
              basePosition: "left",
              diagonalPosition: "top",
            }}
          >
            {HINTS_ALERTS.TOTALS}
          </Hint>
          <Hint
            learningMethod="buttonClick"
            order={2}
            groupName={HINTS_GROUP_NAMES.TOTALS}
            referenceRef={totalsSelectRef}
            shiftY={50}
            shiftX={200}
            width={"small"}
            position={{
              basePosition: "top",
              diagonalPosition: "left",
            }}
          >
            {HINTS_ALERTS.TOTALS_PERIOD}
          </Hint>
        </>
      )}

      {screenSizes.screenWidth < SCREENS.LG && (
        <>
          <Hint
            displayCondition
            learningMethod="nextClick"
            order={1}
            groupName={HINTS_GROUP_NAMES.TOTALS}
            referenceRef={totalsRef}
            shiftY={50}
            shiftX={200}
            width={"medium"}
            position={{
              basePosition: "top",
              diagonalPosition: "right",
            }}
          >
            {HINTS_ALERTS.TOTALS}
          </Hint>
          <Hint
            learningMethod="buttonClick"
            order={2}
            groupName={HINTS_GROUP_NAMES.TOTALS}
            referenceRef={totalsSelectRef}
            shiftY={50}
            shiftX={220}
            width={"small"}
            position={{
              basePosition: "top",
              diagonalPosition: "right",
            }}
          >
            {HINTS_ALERTS.TOTALS_PERIOD}
          </Hint>
        </>
      )}

      <h2 ref={totalsRef} className="flex gap-1 items-center text-lg font-medium text-gray-900 dark:text-dark-heading">
        <div>
          <Listbox value={period.periodName} onChange={onChangeRange}>
            <Listbox.Button ref={totalsSelectRef} className="capitalize flex" data-testid="totals-list-button">
              Totals {period.date}
              <ChevronDownIcon className="w-3 h-3 ml-1 mt-2 dark:text-gray-200" aria-hidden="true" />
            </Listbox.Button>
            <Listbox.Options
              className="absolute z-10 py-1  ml-12 border border-gray-700 cursor-pointer rounded-lg dark:text-dark-heading  capitalize bg-white dark:bg-dark-container focus:outline-none"
              data-testid="totals-options"
            >
              {TOTAL_PERIODS.map((period) => (
                <Listbox.Option className="px-2 hover:bg-dark-button-gray-hover" key={period.id} value={period.name}>
                  {period.name}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>
      </h2>
      {totals.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <TotalsList
            totals={totals}
            toggleActivitiesList={toggleActivitiesList}
            isShowedActivitiesList={isShowedActivitiesList}
            period={period.periodName}
            onCopyDescriptions={handleCopyDescriptions}
          />
        </div>
      )}
      {!totals.length && (
        <div className="text-sm text-gray-700 font-semibold pt-2 dark:text-dark-main ml-5">
          No tracked time this {period.periodName}
        </div>
      )}
    </section>
  );
};

export default Totals;
