import { useEffect, useState, useRef } from "react";
import { DateSelector } from "@/components/DateSelector";
import { ManualInputForm } from "@/components/ManualInputForm";
import { Calendar } from "@/components/Calendar/Calendar";
import { Totals } from "@/components/Totals";
import { Bookings } from "@/components/Bookings";
import { ActivitiesSection } from "@/components/ActivitiesSection";
import { SelectFolderPlaceholder } from "@/components/SelectFolderPlaceholder";
import { UpdateDescription } from "@/components/UpdateDescription";
import { SupportSection } from "../SupportSection";
import { Search } from "@/components/Search";
import { Hint } from "@/shared/Hint";
import { useMainStore } from "@/store/mainStore";
import { useBetaStore } from "@/store/betaUpdatesStore";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { parseReport, serializeReport, ReportAndNotes } from "@/helpers/utils/reports";
import { changeHintConditions } from "@/helpers/utils/utils";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES, HINTS_GROUP_NAMES, HINTS_ALERTS, KEY_CODES } from "@/helpers/contstants";
import { MainPageProps, Section } from "./types";
import { StoredSection } from "@/components/WidgetOrderSection/types";
import Link from "next/link";
import { Cog8ToothIcon } from "@heroicons/react/24/solid";

const MainPage = ({
  selectedDate,
  selectedDateActivities,
  setSelectedDateActivities,
  shouldAutosave,
  setShouldAutosave,
  setSelectedDate,
  latestProjAndAct,
  setTrackTimeModalActivity,
}: MainPageProps) => {
  const [isDropboxConnected, setIsDropboxConnected] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [reportAndNotes, setReportAndNotes] = useState<any[] | ReportAndNotes>([]);
  const [selectedDateReport, setSelectedDateReport] = useState("");
  const [saveReportTrigger, setSaveReportTrigger] = useState(false);
  const [reportsFolder] = useMainStore((state) => [state.reportsFolder, state.setReportsFolder], shallow);
  const [isBeta] = useBetaStore((state) => [state.isBeta, state.setIsBeta], shallow);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const storedSectionsOptions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.WIDGET_ORDER));
  const mainPageRef = useRef(null);

  useEffect(() => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.START_FOLDER_WATCHER, reportsFolder);
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION);
    if (reportsFolder) {
      global.ipcRenderer.on(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION, (event, data) => {
        setIsDropboxConnected(!reportsFolder.includes("Dropbox") || data);
      });
    }
    // console.log("isBeta", isBeta);
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.BETA_CHANNEL, isBeta);
    global.ipcRenderer.on(IPC_MAIN_CHANNELS.WINDOW_FOCUSED, handleWindowFocus);

    document.addEventListener("keydown", handleCtrlPlus);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION);
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder);
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.WINDOW_FOCUSED);
      document.removeEventListener("keydown", handleCtrlPlus);
    };
  }, []);

  useEffect(() => {
    try {
      if (shouldAutosave) {
        const serializedReport =
          serializeReport(selectedDateActivities) +
          (!reportAndNotes[1] || reportAndNotes[1].startsWith("undefined") ? "" : reportAndNotes[1]);

        saveSerializedReport(serializedReport);
        setShouldAutosave(false);
      }
    } catch (err) {
      global.ipcRenderer.send(
        IPC_MAIN_CHANNELS.FRONTEND_ERROR,
        "Reports saving error",
        "An error occurred while saving reports. ",
        err,
      );
    }
  }, [selectedDateActivities]);

  useEffect(() => {
    if (selectedDateReport?.length > 0) {
      const parsedReportsAndNotes = parseReport(selectedDateReport);
      const parsedActivities = parsedReportsAndNotes[0];

      setReportAndNotes(parsedReportsAndNotes);
      setSelectedDateActivities(parsedActivities);
      return;
    }

    setReportAndNotes([]);
    setSelectedDateActivities([]);
  }, [selectedDateReport]);

  useEffect(() => {
    readDayReport();
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.START_FILE_WATCHER, reportsFolder, selectedDate);

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.FILE_CHANGED, (event, data) => {
      if (selectedDateReport != data) {
        setSelectedDateReport(data || "");
      }
    });

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.FILE_CHANGED);
      global.ipcRenderer.send(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder, selectedDate);
    };
  }, [selectedDate, reportsFolder]);

  const readDayReport = async () => {
    const dayReport = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT,
      reportsFolder,
      selectedDate,
    );

    setSelectedDateReport(dayReport || "");
  };

  const handleSave = (report: string, shouldAutosave: boolean) => {
    setSelectedDateReport(report);
    setShouldAutosave(shouldAutosave);
  };

  const saveSerializedReport = (serializedReport: string) => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION);
    global.ipcRenderer.invoke(IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT, reportsFolder, selectedDate, serializedReport);
    setSelectedDateReport(serializedReport);
  };

  const handleWindowFocus = () => {
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.ZOOM_IN,
        newConditions: [false],
        existingConditions: [false],
      },
    ]);
    progress[HINTS_GROUP_NAMES.ZOOM_IN] = [false];
    setProgress(progress);
  };

  const handleCtrlPlus = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === KEY_CODES.EQUAL_SIGN) {
      changeHintConditions(progress, setProgress, [
        {
          groupName: HINTS_GROUP_NAMES.ZOOM_IN,
          newConditions: [true],
          existingConditions: [true],
        },
      ]);
    }
  };

  const MAIN_PAGE_SECTIONS: Section[] = [
    {
      sectionName: "Date Selector",
      section: (
        <section className="bg-white shadow sm:rounded-lg dark:bg-dark-container dark:border dark:border-dark-border">
          <DateSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isDropboxConnected={isDropboxConnected}
            selectedDateReport={selectedDateReport}
          />
        </section>
      ),
      order: 1,
      side: "left",
    },
    {
      sectionName: "Activities Table",
      section: (
        <section className="bg-white shadow sm:rounded-lg h-full dark:bg-dark-container dark:border dark:border-dark-border">
          <ActivitiesSection
            activities={selectedDateActivities}
            onEditActivity={setTrackTimeModalActivity}
            selectedDate={selectedDate}
            latestProjAndAct={latestProjAndAct}
            setSelectedDateReport={setSelectedDateReport}
          />
        </section>
      ),
      order: 2,
      side: "left",
    },
    {
      sectionName: "Manual InputForm",
      section: (
        <section className="px-4 py-5 bg-white shadow sm:rounded-lg sm:px-6 dark:bg-dark-container dark:border dark:border-dark-border">
          <ManualInputForm
            saveReportTrigger={saveReportTrigger}
            onSave={handleSave}
            selectedDateReport={selectedDateReport}
            selectedDate={selectedDate}
            setSelectedDateReport={setSelectedDateReport}
          />
        </section>
      ),
      order: 1,
      side: "right",
    },
    {
      sectionName: "Calendar",
      section: (
        <section className="lg:col-span-2">
          <Calendar
            reportsFolder={reportsFolder}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
          />
        </section>
      ),
      order: 4,
      side: "left",
    },
    {
      sectionName: "Totals",
      section: <Totals selectedDate={selectedDate} />,
      order: 2,
      side: "right",
    },
    {
      sectionName: "Bookings",
      section: <Bookings calendarDate={calendarDate} />,
      order: 3,
      side: "right",
    },
    {
      sectionName: "Update Description",
      section: (
        <section>
          <UpdateDescription />
        </section>
      ),
      order: 4,
      side: "right",
    },
  ];

  const [sections, setSections] = useState<Section[]>(MAIN_PAGE_SECTIONS);

  useEffect(() => {
    const tempSections = storedSectionsOptions
      ? MAIN_PAGE_SECTIONS.map((item) => {
          const storedSectionOption = storedSectionsOptions.find(
            (section: StoredSection) => section.id === item.sectionName,
          );
          item.side = storedSectionOption?.side || "left";
          item.order = storedSectionOption?.order || 0;
          return item;
        })
      : MAIN_PAGE_SECTIONS;

    setSections(tempSections);
  }, [
    selectedDate,
    selectedDateReport,
    isDropboxConnected,
    latestProjAndAct,
    saveReportTrigger,
    reportsFolder,
    calendarDate,
    selectedDateActivities,
  ]);

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6 mx-auto sm:px-6 lg:max-w-[1400px] lg:grid-cols-[31%_31%_auto]">
      <span className="mx-auto" ref={mainPageRef}>
        <Hint
          ignoreSkip
          displayCondition
          learningMethod="nextClick"
          order={1}
          groupName={HINTS_GROUP_NAMES.ZOOM_IN}
          referenceRef={mainPageRef}
          shiftY={0}
          shiftX={200}
          width={"large"}
          position={{
            basePosition: "bottom",
            diagonalPosition: "right",
          }}
        >
          {HINTS_ALERTS.ZOOM_IN}
        </Hint>
      </span>
      {reportsFolder ? (
        <>
          <div className="lg:col-start-1 lg:col-span-2 flex flex-col gap-6">
            {sections.map(
              (item) =>
                item.side === "left" && (
                  <div key={item.order} style={{ order: item.order }}>
                    {item.section}
                  </div>
                ),
            )}
          </div>

          <aside className="lg:col-start-3 lg:col-span-1 lg:row-span-2 relative flex flex-col gap-6">
            {sections.map(
              (item) =>
                item.side === "right" && (
                  <div key={item.order} style={{ order: item.order }}>
                    {item.section}
                  </div>
                ),
            )}
          </aside>
        </>
      ) : (
        <SelectFolderPlaceholder />
      )}
      <Search reportsFolder={reportsFolder} onResultClick={setSelectedDate} />
      <Link
        href="/settings"
        onClick={() => setSaveReportTrigger(true)}
        className="z-20 h-12 w-12 bg-blue-950 rounded-full fixed right-10 bottom-10 flex items-center justify-center transition-colors duration-300 hover:bg-blue-800 hover:before:flex before:content-['Settings'] before:hidden before:absolute before:-translate-x-full before:text-blue-950 before:font-bold before:dark:text-gray-100"
      >
        <span className="w-8 flex items-center justify-center text-white ">
          <Cog8ToothIcon />
        </span>
      </Link>
      <SupportSection />
    </div>
  );
};

export default MainPage;
