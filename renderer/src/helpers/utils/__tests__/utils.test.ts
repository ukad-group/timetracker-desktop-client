import {
  replaceHyphensWithSpaces,
  concatSortArrays,
  parseEventTitle,
  changeHintConditions,
  extractTokenFromString,
  trackConnections,
} from "../utils";
import { HintConitions, ReportActivity } from "../types";
import { TutorialProgress } from "@/store/types";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";
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
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  ...global.localStorage,
};
global.localStorage = localStorageMock;
describe("GIVEN utils/replaceHyphensWithSpaces", () => {
  it("should replace hyphens with spaces in a given string", () => {
    const inputString = "hello - world - test";
    const expectedResult = "hello world test";

    const result = replaceHyphensWithSpaces(inputString);

    expect(result).toEqual(expectedResult);
  });

  it("should handle multiple consecutive hyphens", () => {
    const inputString = "a - b - c - d";
    const expectedResult = "a b c d";

    const result = replaceHyphensWithSpaces(inputString);

    expect(result).toEqual(expectedResult);
  });

  it("should handle leading and trailing hyphens", () => {
    const inputString = "- starts and ends with hyphen -";
    const expectedResult = "- starts and ends with hyphen -";

    const result = replaceHyphensWithSpaces(inputString);

    expect(result).toEqual(expectedResult);
  });

  it("should handle no hyphens in the input", () => {
    const inputString = "no hyphens in this string";
    const expectedResult = "no hyphens in this string";

    const result = replaceHyphensWithSpaces(inputString);

    expect(result).toEqual(expectedResult);
  });
});

describe("GIVEN utils/concatSortArrays", () => {
  it('should concatenate and sort arrays based on the "from" property', () => {
    const firstArr: ReportActivity[] = [
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
    ];

    const secondArr: ReportActivity[] = [
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
    ];

    const result = concatSortArrays(firstArr, secondArr);

    const expectedResult: ReportActivity[] = [
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
      { from: "12:30", id: 1, to: "13:30", duration: 12, project: "Hello", validation: { isValid: true } },
    ];

    expect(result).toEqual(expectedResult);
  });
});

describe("GIVEN utils/parseEventTitle", () => {
  const latestProjAndAct = {
    project1: ["activity1", "activity2"],
    project2: ["activity3", "activity4"],
    project3: ["activity3", "activity4"],
  };

  it("should handle empty event title", () => {
    const event = { summary: "" };
    // @ts-ignore
    const result = parseEventTitle(event, latestProjAndAct);
    expect(result).toEqual({ description: "", summary: "" });
  });

  it("should parse event with one word title", () => {
    const event = { summary: "Project1" };
    // @ts-ignore
    const result = parseEventTitle(event, latestProjAndAct);
    expect(result).toEqual({ project: "project1", description: "Project1", summary: "Project1" });
  });

  it("should parse event with two-word title", () => {
    const event = { summary: "Project1 - Activity1" };
    // @ts-ignore
    const result = parseEventTitle(event, latestProjAndAct);
    expect(result).toEqual({ summary: "Project1 - Activity1", activity: "Project1", description: "Activity1" });
  });

  it("should parse event with three-word title", () => {
    const event = { summary: "Project1 Activity1 Description" };
    // @ts-ignore
    const result = parseEventTitle(event, latestProjAndAct);
    expect(result).toEqual({
      project: "project1",
      activity: "activity1",
      description: "Project1 Activity1 Description",
      summary: "Project1 Activity1 Description",
    });
  });
});

describe("GIVEN utils/changeHintConditions", () => {
  const initialProgress: TutorialProgress = {
    // @ts-ignore
    group1Conditions: ["condition1", "condition2"],
    // @ts-ignore
    group2Conditions: ["condition3", "condition4"],
  };

  const setProgressMock = jest.fn();

  it("should add new conditions for a group if it does not exist in progress", () => {
    const hints: Array<HintConitions> = [
      {
        groupName: "group3",
        // @ts-ignore
        newConditions: ["newCondition1", "newCondition2"],
        existingConditions: [],
      },
    ];

    changeHintConditions(initialProgress, setProgressMock, hints);

    const expectedProgress: TutorialProgress = {
      ...initialProgress,
      // @ts-ignore
      group3Conditions: ["newCondition1", "newCondition2"],
    };

    expect(setProgressMock).toHaveBeenCalledWith(expectedProgress);
  });

  it("should update existing conditions for a group", () => {
    const hints: Array<HintConitions> = [
      {
        groupName: "group1",
        // @ts-ignore
        newConditions: ["condition1", "updatedCondition2"],
        // @ts-ignore
        existingConditions: ["same", "updatedCondition2"],
      },
    ];

    changeHintConditions(initialProgress, setProgressMock, hints);

    const expectedProgress: TutorialProgress = {
      ...initialProgress,
      // @ts-ignore
      group1Conditions: ["condition1", "updatedCondition2"],
    };

    expect(setProgressMock).toHaveBeenCalledWith(expectedProgress);
  });

  it("should handle empty hints array", () => {
    const hints: Array<HintConitions> = [];

    changeHintConditions(initialProgress, setProgressMock, hints);

    expect(setProgressMock).toHaveBeenCalledWith(initialProgress);
  });
});

describe("GIVEN utils/extractTokenFromString", () => {
  it("should extract token from string with valid format", () => {
    const inputString = "example.com#token=abcdef123456";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("abcdef123456");
  });

  it("should handle different characters in the token", () => {
    const inputString = "example.com#token=abc123!@#";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("abc123!@");
  });

  it("should handle additional parameters after token", () => {
    const inputString = "example.com#token=abcdef123456&otherParam=value";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("");
  });

  it("should handle missing token parameter", () => {
    const inputString = "example.com#otherParam=value";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("");
  });

  it("should handle missing hash symbol", () => {
    const inputString = "example.comtoken=abcdef123456";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("");
  });

  it("should handle missing equal sign after token", () => {
    const inputString = "example.com#tokenabcdef123456";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("");
  });

  it("should handle empty input string", () => {
    const inputString = "";
    const result = extractTokenFromString(inputString);
    expect(result).toEqual("");
  });
});

describe("trackConnections", () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("it sends analytics data and sets localStorage if connection not tracked today", () => {
    const mockConnectedName = "testApp";
    const mockDate = new Date("2024-02-05");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    trackConnections(mockConnectedName);

    expect(global.ipcRenderer.send).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.ANALYTICS_DATA, "connections", {
      connected: mockConnectedName,
    });
    expect(localStorage.getItem(`${mockConnectedName}Connection`)).toBe("2024-02-05");
  });

  it("it does not send analytics data if connection already tracked today", () => {
    const mockConnectedName = "testApp";
    const mockDate = new Date("2024-02-05");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    localStorage.setItem(`${mockConnectedName}Connection`, "2024-02-05");

    trackConnections(mockConnectedName);

    expect(global.ipcRenderer.send).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`${mockConnectedName}Connection`)).toBe("2024-02-05");
  });

  it("it sends analytics data and updates localStorage if connection tracked with non-today date", () => {
    const mockConnectedName = "testApp";
    const mockDate = new Date("2024-02-05");

    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    localStorage.setItem(`${mockConnectedName}Connection`, "2024-02-04");

    trackConnections(mockConnectedName);

    expect(global.ipcRenderer.send).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.ANALYTICS_DATA, "connections", {
      connected: mockConnectedName,
    });
    expect(localStorage.getItem(`${mockConnectedName}Connection`)).toBe("2024-02-05");
  });
});
