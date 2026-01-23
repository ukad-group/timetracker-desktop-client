import clsx from "clsx";
import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { useTimeInput } from "@/helpers/hooks";
import { calcDurationBetweenTimes, formatDurationAsDecimals, addDurationToTime } from "@/helpers/utils/reports";
import { AutocompleteSelector } from "@/shared/AutocompleteSelector";
import { shallow } from "zustand/shallow";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { useScheduledEventsStore } from "@/store/googleEventsStore";
import { getJiraCardsFromAPI } from "@/helpers/utils/jira";
import { getAllTrelloCardsFromApi } from "@/helpers/utils/trello";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { TrackTimeModalProps } from "./types";
import { Modal } from "@/shared/Modal";
import { TextField } from "@/shared/TextField";
import {
  getTimetrackerYearProjects,
  addSuggestions,
  setTimeOnOpen,
  handleDashedDescription,
  saveSheduledEvents,
  handleKey,
  addNewActivity,
} from "./utils";
import { Hint } from "@/shared/Hint";
import { HINTS_GROUP_NAMES, HINTS_ALERTS } from "@/helpers/constants";
import { SCREENS } from "@/constants";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";
import { KEY_CODES } from "@/helpers/constants";
import { TRACK_ANALYTICS } from "@/helpers/constants";

const TrackTimeModal = ({
  activities,
  isOpen,
  editedActivity,
  latestProjAndAct,
  latestProjAndDesc,
  close,
  submitActivity,
  selectedDate,
}: TrackTimeModalProps) => {
  const [from, onFromChange, onFromBlur, setFrom] = useTimeInput();
  const [to, onToChange, onToBlur, setTo] = useTimeInput();
  const [formattedDuration, setFormattedDuration] = useState("");
  const [project, setProject] = useState("");
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [isTypingFromDuration, setIsTypingFromDuration] = useState(false);
  const [isValidationEnabled, setIsValidationEnabled] = useState(false);
  const [userTrelloTasks, setUserTrelloTasks] = useState([]);
  const [otherTrelloTasks, setOtherTrelloTasks] = useState([]);
  const [userJiraTasks, setUserJiraTasks] = useState([]);
  const [otherJiraTasks, setOtherJiraTasks] = useState([]);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const [scheduledEvents, setScheduledEvents] = useScheduledEventsStore(
    (state) => [state.event, state.setEvent],
    shallow,
  );
  const [latestProjects, setLatestProjects] = useState([]);
  const [webTrackerProjects, setWebTrackerProjects] = useState([]);
  const [uniqueWebTrackerProjects, setUniqueWebTrackerProjects] = useState([]);
  const { screenSizes } = useScreenSizes();
  const timeInputRef = useRef(null);
  const textInputRef = useRef(null);

  const duration = useMemo(() => {
    if (!from.includes(":") || !to.includes(":")) return null;

    return calcDurationBetweenTimes(from, to);
  }, [from, to]);

  const isFormInvalid = useMemo(() => {
    return !from || !to || !duration || duration < 0 || !project || to.length < 5 || from.length < 5;
  }, [from, to, duration, project]);

  const thirdPartyItems = useMemo(() => {
    return [...userTrelloTasks, ...userJiraTasks, ...otherTrelloTasks, ...otherJiraTasks];
  }, [userTrelloTasks, otherTrelloTasks, userJiraTasks, otherJiraTasks]);

  useEffect(() => {
    addNewActivity(
      progress,
      setProgress,
      editedActivity,
      activities,
      setFrom,
      setTo,
      setFormattedDuration,
      setProject,
      setActivity,
      setDescription,
      resetModal,
    );
  }, [editedActivity]);

  useEffect(() => {
    if (editedActivity !== "new") {
      return;
    }
    setTimeOnOpen(activities, selectedDate, setFrom, setTo);
  }, [isOpen]);

  useEffect(() => {
    addSuggestions(
      activities,
      latestProjAndDesc,
      latestProjAndAct,
      webTrackerProjects,
      setUniqueWebTrackerProjects,
      setLatestProjects,
    );
  }, [isOpen, latestProjAndDesc, latestProjAndAct, webTrackerProjects]);

  useEffect(() => {
    if (duration === null || isTypingFromDuration) return;

    setFormattedDuration(formatDurationAsDecimals(duration));
  }, [from, to]);

  useEffect(() => {
    getBoardTasks();
    getTimetrackerYearProjects(setWebTrackerProjects);

    document.addEventListener("keyup", handleCloseModal);

    return () => {
      document.removeEventListener("keyup", handleCloseModal);
    };
  }, []);

  useEffect(() => {
    setProgress(progress);
  }, [screenSizes]);

  const getBoardTasks = async () => {
    const allTrelloCards = await getAllTrelloCardsFromApi();
    setUserTrelloTasks(allTrelloCards[0]);
    setOtherTrelloTasks(allTrelloCards[1]);

    const allJiraCards = await getJiraCardsFromAPI();
    setUserJiraTasks(allJiraCards[0]);
    setOtherJiraTasks(allJiraCards[1]);
  };

  const onSave = (e: FormEvent | MouseEvent) => {
    e.preventDefault();

    if (isFormInvalid) {
      setIsValidationEnabled(true);
      return;
    }

    if (
      progress[HINTS_GROUP_NAMES.SHORTCUTS_EDITING + "Conditions"] &&
      progress[HINTS_GROUP_NAMES.SHORTCUTS_EDITING + "Conditions"][0]
    ) {
      progress[HINTS_GROUP_NAMES.SHORTCUTS_EDITING + "Conditions"][1] = true;
      setProgress(progress);
    }
    const newActivity = handleDashedDescription(description, activity, setActivity);

    submitActivity({
      id: editedActivity === "new" ? null : editedActivity.id,
      from,
      to,
      duration,
      project,
      activity: newActivity,
      description,
      calendarId: editedActivity === "new" ? null : editedActivity.calendarId,
      validation: { isValid: true },
    });

    saveSheduledEvents(scheduledEvents, setScheduledEvents, description, editedActivity, project, activity);

    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.REGISTRATIONS, {
      registration: TRACK_ANALYTICS.TIME_REGISTRATION,
    });
    close();
  };

  const resetModal = () => {
    setFrom("");
    setTo("");
    setFormattedDuration("");
    setProject("");
    setActivity("");
    setDescription("");
    setIsValidationEnabled(false);
  };

  const disableTextDrag = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const onDurationChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    const formatDurationRegex = /^-?(\d*\.?\d*)?[hm]?$|^-?[hm](?![hm.])$/i;

    if (formatDurationRegex.test(value)) {
      setIsTypingFromDuration(true);
      setFormattedDuration(value);
      setTo(addDurationToTime(from, value));
    }
  };

  const onDurationBlur = () => {
    setIsTypingFromDuration(false);
    setFormattedDuration(formatDurationAsDecimals(duration));
  };

  const selectText = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleCloseModal = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === KEY_CODES.ENTER) {
      e.preventDefault();
      onSave(e);
    }

    if (e.key === KEY_CODES.ESCAPE || e.key === KEY_CODES.ESC) {
      close();
    }
  };

  return (
    <Modal isOpen={isOpen} onSubmit={onSave} onClose={close} title="Track time">
      <div className="grid grid-cols-6 gap-6">
        <div className="col-span-6 sm:col-span-2">
          <TextField
            id="from"
            reference={timeInputRef}
            label="From"
            onKeyDown={(event) => handleKey(event, setFrom)}
            required
            value={from}
            onChange={onFromChange}
            onBlur={onFromBlur}
            onFocus={selectText}
            tabIndex={1}
            className={clsx(
              "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
              {
                "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                  isValidationEnabled && (!from || from.length < 5),
              },
            )}
            onDragStart={disableTextDrag}
          />
          <Hint
            learningMethod="nextClick"
            order={1}
            groupName={HINTS_GROUP_NAMES.TRACK_TIME_MODAL}
            referenceRef={timeInputRef}
            shiftY={25}
            shiftX={screenSizes.screenWidth >= SCREENS.LG ? 300 : 150}
            width={"large"}
            position={{
              basePosition: screenSizes.screenWidth >= SCREENS.LG ? "top" : "bottom",
              diagonalPosition: "right",
            }}
          >
            {HINTS_ALERTS.MODAL_TIME_FIELD}
          </Hint>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <TextField
            id="to"
            label="To"
            onKeyDown={(event) => handleKey(event, setTo)}
            required
            value={to}
            onChange={onToChange}
            onBlur={onToBlur}
            onFocus={selectText}
            tabIndex={2}
            className={clsx(
              "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
              {
                "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                  isValidationEnabled && (!to || to.length < 5),
              },
            )}
            onDragStart={disableTextDrag}
          />
        </div>

        <div className="col-span-6 sm:col-span-2">
          <TextField
            id="duration"
            label="Duration"
            onKeyDown={(event) => handleKey(event)}
            onChange={onDurationChange}
            onBlur={onDurationBlur}
            onFocus={selectText}
            value={formattedDuration}
            tabIndex={3}
            className={clsx(
              "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
              {
                "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                  isValidationEnabled && (!duration || duration < 0),
              },
            )}
            onDragStart={disableTextDrag}
          />
        </div>
        <div className="col-span-6">
          <AutocompleteSelector
            isNewCheck
            onSave={onSave}
            title="Project"
            required
            availableItems={latestProjects}
            additionalItems={uniqueWebTrackerProjects ? uniqueWebTrackerProjects : []}
            selectedItem={project}
            setSelectedItem={setProject}
            isValidationEnabled={isValidationEnabled}
            showedSuggestionsNumber={Object.keys(latestProjAndAct).length}
            tabIndex={4}
          />
        </div>
        <div ref={textInputRef} className="col-span-6">
          <AutocompleteSelector
            isNewCheck
            onSave={onSave}
            title="Activity"
            availableItems={latestProjAndAct[project] ? latestProjAndAct[project] : []}
            selectedItem={activity}
            setSelectedItem={setActivity}
            showedSuggestionsNumber={3}
            tabIndex={5}
          />
        </div>
        <Hint
          learningMethod="nextClick"
          order={2}
          groupName={HINTS_GROUP_NAMES.TRACK_TIME_MODAL}
          referenceRef={textInputRef}
          shiftY={screenSizes.screenWidth >= SCREENS.LG ? 175 : 30}
          shiftX={30}
          width={"medium"}
          position={
            screenSizes.screenWidth >= SCREENS.LG
              ? {
                  basePosition: "left",
                  diagonalPosition: "top",
                }
              : {
                  basePosition: "top",
                  diagonalPosition: "right",
                }
          }
        >
          {HINTS_ALERTS.MODAL_TEXT_FIELD}
        </Hint>
        <div className="col-span-6">
          <AutocompleteSelector
            onSave={onSave}
            title="Description"
            availableItems={latestProjAndDesc[project] ? latestProjAndDesc[project] : []}
            additionalItems={thirdPartyItems}
            selectedItem={description}
            setSelectedItem={setDescription}
            showedSuggestionsNumber={3}
            tabIndex={6}
            spellCheck
          />
        </div>
      </div>
    </Modal>
  );
};
export default TrackTimeModal;
