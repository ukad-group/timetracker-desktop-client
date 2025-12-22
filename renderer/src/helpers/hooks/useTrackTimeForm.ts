import { useState, useMemo, useEffect } from "react";
import { useTimeInput } from "@/helpers/hooks";
import { formatDurationAsDecimals, calcDurationBetweenTimes, addDurationToTime } from "@/helpers/utils/reports";
import { getAllTrelloCardsFromApi } from "@/helpers/utils/trello";
import { getJiraCardsFromAPI } from "@/helpers/utils/jira";
import {
  getTimetrackerYearProjects,
  setTimeOnOpen,
  addSuggestions,
  addNewActivity,
} from "@/components/TrackTimeModal/utils";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";

export const useTrackTimeForm = (
  isOpen: boolean,
  editedActivity: any,
  activities: any[],
  selectedDate: Date,
  latestProjAndDesc: any,
  latestProjAndAct: any,
  progress: any,
  setProgress: any,
) => {
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

  const [latestProjects, setLatestProjects] = useState([]);
  const [webTrackerProjects, setWebTrackerProjects] = useState([]);
  const [uniqueWebTrackerProjects, setUniqueWebTrackerProjects] = useState([]);

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
    if (editedActivity !== "new") return;
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
  }, []);

  const getBoardTasks = async () => {
    const allTrelloCards = await getAllTrelloCardsFromApi();
    setUserTrelloTasks(allTrelloCards[0]);
    setOtherTrelloTasks(allTrelloCards[1]);

    const allJiraCards = await getJiraCardsFromAPI();
    setUserJiraTasks(allJiraCards[0]);
    setOtherJiraTasks(allJiraCards[1]);
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatDurationRegex = /^-?(\d*\.?\d*)?[hm]?$|^-?[hm](?![hm.])$/i;

    if (formatDurationRegex.test(value)) {
      setIsTypingFromDuration(true);
      setFormattedDuration(value);
      setTo(addDurationToTime(from, value));
    }
  };

  const handleDurationBlur = () => {
    setIsTypingFromDuration(false);
    setFormattedDuration(formatDurationAsDecimals(duration));
  };

  return {
    from,
    setFrom,
    onFromChange,
    onFromBlur,
    to,
    setTo,
    onToChange,
    onToBlur,
    formattedDuration,
    setFormattedDuration,
    handleDurationChange,
    handleDurationBlur,
    project,
    setProject,
    activity,
    setActivity,
    description,
    setDescription,
    isValidationEnabled,
    setIsValidationEnabled,
    uniqueWebTrackerProjects,
    latestProjects,
    thirdPartyItems,
    isFormInvalid,
    duration,
    resetModal,
  };
};
