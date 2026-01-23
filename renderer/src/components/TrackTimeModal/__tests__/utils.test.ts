import {
  changeHours,
  changeMinutesAndHours,
  getTimetrackerYearProjects,
  addSuggestions,
  setTimeOnOpen,
  saveSheduledEvents,
  handleDashedDescription,
  handleKey,
  addNewActivity,
} from "../utils";
import { getDateTimeData } from "@/helpers/utils/datetime-ui";
import { KEY_CODES } from "@/helpers/constants";
import { globalIpcRendererMock } from "@/tests/mocks/electron";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

global.ipcRenderer = {
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: jest.fn(),
  ...globalIpcRendererMock,
};

const useFakeTime = () => jest.useFakeTimers().setSystemTime(new Date("2024-02-05T10:55:00"));

describe("GIVEN changeHours", () => {
  it("should increment hours when ArrowUp key is pressed", () => {
    expect(changeHours(KEY_CODES.ARROW_UP, 5)).toBe(6);
  });

  it("should decrement hours when ArrowDown key is pressed", () => {
    expect(changeHours(KEY_CODES.ARROW_DOWN, 5)).toBe(4);
  });

  it("should reset hours to 23 if it goes below 0", () => {
    expect(changeHours(KEY_CODES.ARROW_DOWN, 0)).toBe(23);
  });

  it("should reset hours to 0 if it goes above or equal to 24", () => {
    expect(changeHours(KEY_CODES.ARROW_UP, 23)).toBe(0);
    expect(changeHours(KEY_CODES.ARROW_UP, 24)).toBe(0);
  });
});

describe("GIVEN changeMinutesAndHours", () => {
  it("should increment minutes by 15 when ArrowUp key is pressed", () => {
    expect(changeMinutesAndHours(KEY_CODES.ARROW_UP, 30, 5)).toEqual([45, 5]);
  });

  it("should decrement minutes by 15 when ArrowDown key is pressed", () => {
    expect(changeMinutesAndHours(KEY_CODES.ARROW_DOWN, 30, 5)).toEqual([15, 5]);
  });

  it("should handle hour change when minutes go below 0", () => {
    expect(changeMinutesAndHours(KEY_CODES.ARROW_DOWN, 10, 1)).toEqual([55, 0]);
  });

  it("should handle hour change when minutes go above or equal to 60", () => {
    expect(changeMinutesAndHours(KEY_CODES.ARROW_UP, 50, 1)).toEqual([5, 2]);
    expect(changeMinutesAndHours(KEY_CODES.ARROW_UP, 60, 1)).toEqual([15, 2]);
  });
});

// describe("GIVEN getTimetrackerYearProjects", () => {
//   const setWebTrackerProjectsMock = jest.fn();

//   it("should call global.ipcRenderer.invoke with the correct arguments when userInfo is present in localStorage", async () => {
//     localStorage.setItem("timetracker-user", JSON.stringify({ cookie: "token" }));

//     await getTimetrackerYearProjects(setWebTrackerProjectsMock);

//     expect(global.ipcRenderer.invoke).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PROJECTS, "token");
//   });
// });

describe("GIVEN addSuggestions", () => {
  it("should correctly add new suggestions for projects and activities", () => {
    const activities = [
      {
        id: 0,
        from: "10:00",
        to: "11:00",
        duration: 1,
        project: "project1",
        description: "Description 1",
        activity: "Activity 1",
        validation: { isValid: true },
      },
      {
        id: 1,
        from: "11:00",
        to: "12:00",
        duration: 1,
        project: "project2",
        description: "Description 2",
        activity: "Activity 2",
        validation: { isValid: true },
      },
    ];

    const latestProjAndDesc: Record<string, [string]> = { project1: ["Description 2"] };
    const latestProjAndAct: Record<string, [string]> = { project1: ["Activity 2"] };

    const webTrackerProjects = [];

    const setUniqueWebTrackerProjects = jest.fn();
    const setLatestProjects = jest.fn();

    addSuggestions(
      activities,
      latestProjAndDesc,
      latestProjAndAct,
      webTrackerProjects,
      setUniqueWebTrackerProjects,
      setLatestProjects,
    );

    expect(latestProjAndDesc["project1"]).toEqual(["Description 1", "Description 2"]);
    expect(latestProjAndAct["project1"]).toEqual(["Activity 1", "Activity 2"]);
    expect(latestProjAndDesc["project2"]).toEqual(["Description 2"]);
    expect(latestProjAndAct["project2"]).toEqual(["Activity 2"]);
  });

  it("should correctly update unique web tracker projects", () => {
    const activities = [];
    const latestProjAndDesc = {};
    const latestProjAndAct = {};

    const webTrackerProjects = ["Project 1", "Project 2"];

    const setUniqueWebTrackerProjects = jest.fn();
    const setLatestProjects = jest.fn();

    latestProjAndAct["Project 1"] = ["Activity"];

    addSuggestions(
      activities,
      latestProjAndDesc,
      latestProjAndAct,
      webTrackerProjects,
      setUniqueWebTrackerProjects,
      setLatestProjects,
    );

    expect(setUniqueWebTrackerProjects).toHaveBeenCalledWith(["Project 2"]);
  });

  it("should correctly update latest projects", () => {
    const activities = [
      {
        id: 0,
        from: "10:00",
        to: "11:00",
        duration: 1,
        project: "Project 1",
        description: "Description 1",
        activity: "Activity 1",
        validation: { isValid: true },
      },
      {
        id: 1,
        from: "10:00",
        to: "11:00",
        duration: 1,
        project: "Project 2",
        description: "Description 2",
        activity: "Activity 2",
        validation: { isValid: true },
      },
    ];
    const latestProjAndDesc: Record<string, [string]> = { internal: [""] };
    const latestProjAndAct: Record<string, [string]> = { internal: [""] };

    const webTrackerProjects = [];

    const setUniqueWebTrackerProjects = jest.fn();
    const setLatestProjects = jest.fn();

    addSuggestions(
      activities,
      latestProjAndDesc,
      latestProjAndAct,
      webTrackerProjects,
      setUniqueWebTrackerProjects,
      setLatestProjects,
    );

    expect(setLatestProjects).toHaveBeenCalledWith(["internal", "Project 1", "Project 2"]);
  });
});

describe("GIVEN setTimeOnOpen", () => {
  it('should set "from" time to the end time of the last activity if activities array is not empty and the last activity has an end time', () => {
    const activities = [
      {
        id: 0,
        from: "10:00",
        to: "11:00",
        duration: 360000,
        project: "Project 1",
        description: "Description 1",
        activity: "Activity 1",
        validation: { isValid: true },
      },
      {
        id: 1,
        from: "11:00",
        to: "12:00",
        duration: 360000,
        project: "Project 2",
        description: "Description 2",
        activity: "Activity 2",
        validation: { isValid: true },
      },
    ];
    const selectedDate = new Date("2024-02-05");
    const setFrom = jest.fn();
    const setTo = jest.fn();
    useFakeTime();

    setTimeOnOpen(activities, selectedDate, setFrom, setTo);

    expect(setFrom).toHaveBeenCalledWith("12:00");
    expect(setTo).toHaveBeenCalledWith("11:00");
  });

  it('should set "from" time to the start time of the last activity if activities array is not empty and the last activity does not have an end time', () => {
    const activities = [
      {
        id: 0,
        from: "10:00",
        to: "11:00",
        duration: 360000,
        project: "Project 1",
        description: "Description 1",
        activity: "Activity 1",
        validation: { isValid: true },
      },
      {
        id: 1,
        from: "11:00",
        to: "",
        duration: 360000,
        project: "Project 2",
        description: "Description 2",
        activity: "Activity 2",
        validation: { isValid: true },
      },
    ];
    const selectedDate = new Date("2024-02-05");
    const setFrom = jest.fn();
    const setTo = jest.fn();
    useFakeTime();

    setTimeOnOpen(activities, selectedDate, setFrom, setTo);

    expect(setFrom).toHaveBeenCalledWith("11:00");
    expect(setTo).toHaveBeenCalledWith("11:00");
  });

  it('should set "from" time to the current time if activities array is empty', () => {
    const activities = null;
    const selectedDate = new Date("2024-02-05");
    const { hours, floorMinutes } = getDateTimeData(selectedDate);
    const setFrom = jest.fn();
    const setTo = jest.fn();
    useFakeTime();

    setTimeOnOpen(activities, selectedDate, setFrom, setTo);

    expect(setFrom).toHaveBeenCalledWith(`${hours}:${floorMinutes}`);
    expect(setTo).toHaveBeenCalledWith("11:00");
  });

  it('should set "to" time to the end of the day if the selected date is today', () => {
    const activities = null;
    const selectedDate = new Date("2024-02-05");
    const { ceilHours, ceilMinutes } = getDateTimeData(selectedDate);
    const setFrom = jest.fn();
    const setTo = jest.fn();

    setTimeOnOpen(activities, selectedDate, setFrom, setTo);

    expect(setTo).toHaveBeenCalledWith(`${ceilHours}:${ceilMinutes}`);
  });

  it('should set "to" time to an empty string if the selected date is not today', () => {
    const activities = null;
    const selectedDate = new Date("2024-02-04"); // Not today
    const setFrom = jest.fn();
    const setTo = jest.fn();
    useFakeTime();

    setTimeOnOpen(activities, selectedDate, setFrom, setTo);

    expect(setTo).toHaveBeenCalledWith("");
  });
});

describe("GIVEN saveSheduledEvents", () => {
  it("should update scheduledEvents with project and activity if they are not already set", () => {
    const scheduledEvents = { description2: { project: "project-2", activity: "activity-2" } };
    const setScheduledEventsMock = jest.fn();
    const dashedDescription = "description";
    const project = "project-1";
    const activity = "activity-1";
    const editedActivity = {
      id: 0,
      from: "10:00",
      to: "11:00",
      duration: 360000,
      project: "project-1",
      description: "description",
      activity: "activity-1",
      validation: { isValid: true },
      calendarId: "123",
    };

    saveSheduledEvents(scheduledEvents, setScheduledEventsMock, dashedDescription, editedActivity, project, activity);

    expect(setScheduledEventsMock).toHaveBeenCalledWith({
      description2: { project: "project-2", activity: "activity-2" },
      description: { project: "project-1", activity: "activity-1" },
    });
  });

  it("should update scheduledEvents with project if it is not already set", () => {
    const scheduledEvents = { description: { activity: "activity-1" } };
    const setScheduledEventsMock = jest.fn();
    const dashedDescription = "description";
    const project = "project-1";
    const activity = "activity-2";

    saveSheduledEvents(scheduledEvents, setScheduledEventsMock, dashedDescription, "new", project, activity);

    expect(setScheduledEventsMock).toHaveBeenCalledWith({
      description: { project: "project-1", activity: "activity-2" },
    });
  });

  it("should update scheduledEvents with activity if it is different from the existing one", () => {
    const scheduledEvents = { description: { project: "project-1", activity: "activity-1" } };
    const setScheduledEventsMock = jest.fn();
    const dashedDescription = "description";
    const project = "project-1";
    const activity = "activity-2";

    saveSheduledEvents(scheduledEvents, setScheduledEventsMock, dashedDescription, "new", project, activity);

    expect(setScheduledEventsMock).toHaveBeenCalledWith({
      description: { project: "project-1", activity: "activity-2" },
    });
  });
});

describe("GIVEN handleDashedDescription", () => {
  it('should set activity to " " if description includes " - " and activity is empty', () => {
    const setActivityMock = jest.fn();
    const description = "Test - Description";
    const expectedActivity = " ";

    const result = handleDashedDescription(description, "", setActivityMock);

    expect(result).toEqual(expectedActivity);
    expect(setActivityMock).toHaveBeenCalledWith(" ");
  });

  it('should not change activity if description includes " - " but activity is not empty', () => {
    const setActivityMock = jest.fn();
    const description = "Test - Description";
    const initialActivity = "Some activity";

    const result = handleDashedDescription(description, initialActivity, setActivityMock);

    expect(result).toEqual(initialActivity);
    expect(setActivityMock).not.toHaveBeenCalled();
  });

  it('should not change activity if description does not include " - "', () => {
    const setActivityMock = jest.fn();
    const description = "Test Description";
    const initialActivity = "Some activity";

    const result = handleDashedDescription(description, initialActivity, setActivityMock);

    expect(result).toEqual(initialActivity);
    expect(setActivityMock).not.toHaveBeenCalled();
  });
});

const callbackMock = jest.fn();

describe("GIVEN handleKey", () => {
  it("should not call callback if arrow key other than up or down is pressed", () => {
    const event = {
      key: "ArrowLeft",
      target: { value: "12:00", selectionStart: 0, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).not.toHaveBeenCalled();
  });

  it("should not call callback if value length is less than 5", () => {
    const event = {
      key: "ArrowUp",
      target: { value: "10:", selectionStart: 0, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).not.toHaveBeenCalled();
  });

  it("should increase hours by 1 when focus on hours position and arrow up key is pressed ", () => {
    const event = {
      key: "ArrowUp",
      target: { value: "12:00", selectionStart: 0, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).toHaveBeenCalledWith("13:00");
  });

  it("should increase minutes by 15 when focus on minutes position and arrow up key is pressed ", () => {
    const event = {
      key: "ArrowUp",
      target: { value: "12:00", selectionStart: 4, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).toHaveBeenCalledWith("12:15");
  });

  it("should decrease hours by 1 when focus on hours position and arrow down key is pressed ", () => {
    const event = {
      key: "ArrowDown",
      target: { value: "12:00", selectionStart: 0, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).toHaveBeenCalledWith("11:00");
  });

  it("should decrease minutes by 15 when focus on minutes position and arrow down key is pressed ", () => {
    const event = {
      key: "ArrowDown",
      target: { value: "12:00", selectionStart: 4, selectionEnd: 0 },
      preventDefault: jest.fn(),
    };
    handleKey(event as unknown as React.KeyboardEvent<HTMLInputElement>, callbackMock);

    expect(callbackMock).toHaveBeenCalledWith("11:45");
  });
});

describe("GIVEN addNewActivity", () => {
  const setProgressMock = jest.fn();
  const setFromMock = jest.fn();
  const setToMock = jest.fn();
  const setFormattedDurationMock = jest.fn();
  const setProjectMock = jest.fn();
  const setActivityMock = jest.fn();
  const setDescriptionMock = jest.fn();
  const resetModalMock = jest.fn();

  const activities = [
    {
      id: 0,
      from: "10:00",
      to: "11:00",
      duration: 360000,
      project: "project1",
      description: "Description 1",
      activity: "Activity 1",
      validation: { isValid: true },
    },
    {
      id: 1,
      from: "11:00",
      to: "12:00",
      duration: 360000,
      project: "project2",
      description: "Description 2",
      activity: "Activity 2",
      validation: { isValid: true },
    },
  ];

  const progress = {
    trackTimeModal: [false, false],
    trackTimeModalConditions: [false, false, false, false, false, false, false, false, false, false],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset modal and change hint conditions if editedActivity is new", () => {
    addNewActivity(
      progress,
      setProgressMock,
      "new",
      activities,
      setFromMock,
      setToMock,
      setFormattedDurationMock,
      setProjectMock,
      setActivityMock,
      setDescriptionMock,
      resetModalMock,
    );

    expect(resetModalMock).toHaveBeenCalled();
    expect(setProgressMock).toHaveBeenCalledWith({
      trackTimeModal: [false, false],
      trackTimeModalConditions: [false, false, false, false, false, false, false, false, false, true],
    });
  });

  it("should set values based on editedActivity when it is not new", () => {
    const editedActivity = {
      id: 0,
      from: "12:00",
      to: "13:00",
      duration: 3600000,
      project: "project2",
      activity: "activity2",
      description: "description2",
      validation: { isValid: true },
    };

    addNewActivity(
      progress,
      setProgressMock,
      editedActivity,
      activities,
      setFromMock,
      setToMock,
      setFormattedDurationMock,
      setProjectMock,
      setActivityMock,
      setDescriptionMock,
      resetModalMock,
    );

    expect(setFromMock).toHaveBeenCalledWith("12:00");
    expect(setToMock).toHaveBeenCalledWith("13:00");
    expect(setFormattedDurationMock).toHaveBeenCalledWith("1h");
    expect(setProjectMock).toHaveBeenCalledWith("project2");
    expect(setActivityMock).toHaveBeenCalledWith("activity2");
    expect(setDescriptionMock).toHaveBeenCalledWith("description2");
  });

  it('should set "from" value based on last registration "to" time if editedActivity has calendarId', () => {
    const editedActivity = {
      id: 0,
      from: "12:00",
      to: "13:00",
      duration: 1,
      project: "project2",
      activity: "activity2",
      description: "description2",
      calendarId: "123",
      validation: { isValid: true },
    };

    addNewActivity(
      progress,
      setProgressMock,
      editedActivity,
      activities,
      setFromMock,
      setToMock,
      setFormattedDurationMock,
      setProjectMock,
      setActivityMock,
      setDescriptionMock,
      resetModalMock,
    );

    expect(setFromMock).toHaveBeenCalledWith("12:00");
  });
});
