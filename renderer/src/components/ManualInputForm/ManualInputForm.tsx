import { useEffect, useState, useRef } from "react";
import { Button } from "@/shared/Button";
import { DeleteMessage } from "@/shared/DeleteMessage";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { ManualInputFormProps } from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { Hint } from "@/shared/Hint";
import { HINTS_GROUP_NAMES, HINTS_ALERTS, KEY_CODES } from "@/helpers/constants";
import { changeHintConditions } from "@/helpers/utils/utils";
import { TRACK_ANALYTICS } from "@/helpers/constants";
import TextAreaWithSuggestions from "../TextareaWithSuggestions/TextAreaWithSuggestions";

const ManualInputForm = ({
  saveReportTrigger,
  onSave,
  selectedDateReport,
  selectedDate,
  setSelectedDateReport,
  isFileExist,
  setIsFileExist,
  isToday,
}: ManualInputFormProps) => {
  const [report, setReport] = useState("");
  const [saveBtnStatus, setSaveBtnStatus] = useState("disabled");
  const textareaRef = useRef(null);
  const [showDeleteMessage, setShowDeleteMessage] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const [isFieldDisabled, setIsFieldDisabled] = useState(!isToday);

  const handleCtrlSSave = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.code === KEY_CODES.KEY_S && selectedDateReport !== report) {
      e.preventDefault();
      handleSaveReport();
    }
  };

  const handleSaveReport = () => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.MANUAL_SAVE);
    onSave(report, true);
    setSaveBtnStatus("inprogress");
    if (!isToday) {
      setIsFieldDisabled(true);
    }
  };

  const handleOnFocus = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.MANUAL_INPUT,
        newConditions: [true],
        existingConditions: [true],
      },
    ]);
  };

  const handleRemoveFileBtn = () => {
    setIsFileExist(false);
    setShowDeleteMessage(true);
  };

  useEffect(() => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.MANUAL_INPUT,
        newConditions: [false],
        existingConditions: [false],
      },
    ]);
  }, []);

  useEffect(() => {
    const newSaveBtnStatus = selectedDateReport !== report ? "enabled" : "disabled";

    setSaveBtnStatus(newSaveBtnStatus);

    document.addEventListener("keydown", handleCtrlSSave);

    return () => {
      document.removeEventListener("keydown", handleCtrlSSave);
    };
  }, [selectedDateReport, report]);

  useEffect(() => {
    setShowDeleteButton(isFileExist && !report?.length);
  }, [isFileExist, report]);

  useEffect(() => {
    setReport(selectedDateReport);
  }, [selectedDateReport]);

  useEffect(() => {
    setReport(report);

    if (cursorPosition) {
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }

    setCursorPosition(0);
  }, [report]);

  useEffect(() => {
    if (saveReportTrigger && selectedDateReport !== report) {
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.ANALYTICS_DATA, TRACK_ANALYTICS.MANUAL_SAVE);
      onSave(report, true);
    }
  }, [saveReportTrigger]);

  const textAreaDefaultClassNames =
    "block w-full px-3 py-2 mt-3 border border-gray-300 rounded-md shadow-sm focus-visible:outline-blue-500 sm:text-sm dark:bg-dark-back dark:border-dark-border dark:text-slate-400 focus-visible:dark:outline-slate-500 resize-none";
  const textAreaDisabledClassnames = "opacity-40";

  const textAreaClassNames = `${textAreaDefaultClassNames} ${isFieldDisabled ? textAreaDisabledClassnames : ""}`;

  useEffect(() => {
    if (isToday) {
      setIsFieldDisabled(false);
    } else {
      setIsFieldDisabled(true);
    }
  }, [selectedDate]);

  const renderButtons = () => {
    if (isToday) {
      return (
        <Button
          text="Save"
          callback={handleSaveReport}
          status={saveBtnStatus}
          disabled={saveBtnStatus === "disabled"}
          type={"button"}
        />
      );
    }

    return (
      <>
        {isFieldDisabled ? (
          <Button text="Edit" callback={() => setIsFieldDisabled(false)} type="button" />
        ) : (
          <Button
            text="Save"
            callback={handleSaveReport}
            status={saveBtnStatus}
            disabled={saveBtnStatus === "disabled"}
            type="button"
          />
        )}
      </>
    );
  };

  return (
    <div>
      <Hint
        displayCondition
        learningMethod="nextClick"
        order={1}
        groupName={HINTS_GROUP_NAMES.MANUAL_INPUT}
        referenceRef={textareaRef}
        shiftY={30}
        shiftX={200}
        width={"medium"}
        position={{
          basePosition: "bottom",
          diagonalPosition: "left",
        }}
      >
        {HINTS_ALERTS.MANUAL_INPUT}
      </Hint>

      <h2 id="manual-input-title" className="text-lg font-medium text-gray-900 dark:text-dark-heading">
        Manual input
      </h2>

      {/* <textarea
        value={report}
        onFocus={handleOnFocus}
        onChange={(e) => setReport(e.target.value)}
        rows={15}
        className={textAreaClassNames}
        spellCheck={true}
        ref={textareaRef}
        // onKeyDown={handleTextAreaKeyDown}
        disabled={isFieldDisabled}
      /> */}
      {selectedDateReport !== null && (
        <TextAreaWithSuggestions
          key={selectedDateReport}
          className={textAreaClassNames}
          defaultValue={selectedDateReport}
          onFocus={handleOnFocus}
          onChange={(value) => setReport(value)}
          spellCheck={true}
          setSelectedDateReport={setSelectedDateReport}
          disabled={isFieldDisabled}
          report={report}
        />
      )}
      <div className="relative flex flex-col gap-4 mt-6 justify-stretch">
        {showDeleteMessage && (
          <DeleteMessage
            setShowDeleteButton={setShowDeleteButton}
            setShowDeleteMessage={setShowDeleteMessage}
            selectedDate={selectedDate}
            setSelectedDateReport={setSelectedDateReport}
          />
        )}
        <div className="flex flex-col justify-stretch">
          {renderButtons()}
          <span className="block text-xs text-gray-500 text-center">or press ctrl/command + s</span>
        </div>
        {showDeleteButton && (
          <button
            onClick={handleRemoveFileBtn}
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 hover:text-white shadow-sm hover:bg-red-600 sm:w-auto dark:text-dark-heading dark:border dark:border-red-500/50 hover:dark:border-transparent dark:bg-transparent hover:dark:bg-red-400/20"
          >
            Remove an empty file
          </button>
        )}
      </div>
    </div>
  );
};

export default ManualInputForm;
