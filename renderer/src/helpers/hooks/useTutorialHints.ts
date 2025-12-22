import { useEffect } from "react";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { HINTS_GROUP_NAMES, HINTS_ALERTS } from "@/helpers/constants";
import { changeHintConditions } from "@/helpers/utils/utils";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";

export const useTutorialHints = (tableActivities: any[], isLoading: boolean, prevTableActivities: any[]) => {
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const { screenSizes } = useScreenSizes();

  useEffect(() => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.SHORTCUTS_EDITING,
        newConditions: [false, false],
        existingConditions: [false, false],
      },
      {
        groupName: HINTS_GROUP_NAMES.COPY_BUTTON,
        newConditions: [true, false],
        existingConditions: ["same", false],
      },
      {
        groupName: HINTS_GROUP_NAMES.ONLINE_CALENDAR_EVENT,
        newConditions: [false],
        existingConditions: [false],
      },
      {
        groupName: HINTS_GROUP_NAMES.EDITING_BUTTON,
        newConditions: [false],
        existingConditions: [false],
      },
      {
        groupName: HINTS_GROUP_NAMES.TRACK_TIME_MODAL,
        newConditions: [false, false, false, false, false, false, false, false, false, false],
        existingConditions: ["same", "same", "same", "same", "same", "same", "same", "same", "same", "same"],
      },
    ]);
  }, []);

  useEffect(() => {
    const isNewActivity = tableActivities?.length - prevTableActivities?.length === 1;
    if (
      prevTableActivities &&
      tableActivities &&
      isNewActivity &&
      progress[`${HINTS_GROUP_NAMES.COPY_BUTTON}Conditions`] &&
      progress[`${HINTS_GROUP_NAMES.COPY_BUTTON}Conditions`].includes(false)
    ) {
      const description = tableActivities[tableActivities.length - 1].description;
      let duplicateFound = false;
      tableActivities.forEach((item: any, index: number) => {
        if (!duplicateFound && index !== tableActivities.length - 1 && item.description === description) {
          duplicateFound = true; // Only trigger once
          changeHintConditions(progress, setProgress, [
            {
              groupName: HINTS_GROUP_NAMES.COPY_BUTTON,
              newConditions: [true, true],
              existingConditions: ["same", true],
            },
          ]);
        }
      });
    }

    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.EDITING_BUTTON,
        newConditions: [!isLoading],
        existingConditions: [!isLoading],
      },
      {
        groupName: HINTS_GROUP_NAMES.ONLINE_CALENDAR_EVENT,
        newConditions: progress[HINTS_GROUP_NAMES.EDITING_BUTTON]
          ? [progress[HINTS_GROUP_NAMES.EDITING_BUTTON][0] && !isLoading]
          : [false],
        existingConditions: progress[HINTS_GROUP_NAMES.EDITING_BUTTON]
          ? [progress[HINTS_GROUP_NAMES.EDITING_BUTTON][0] && !isLoading]
          : [false],
      },
    ]);
  }, [tableActivities, isLoading]); // Added isLoading dependency

  useEffect(() => {
    setProgress(progress);
  }, [screenSizes]);

  const updateEditHint = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.SHORTCUTS_EDITING,
        newConditions: [true, false],
        existingConditions: [true, false],
      },
    ]);
  };

  const updateCopyHint = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.COPY_BUTTON,
        newConditions: [false, false],
        existingConditions: [false, false],
      },
    ]);
  };

  return { progress, setProgress, updateEditHint, updateCopyHint };
};
