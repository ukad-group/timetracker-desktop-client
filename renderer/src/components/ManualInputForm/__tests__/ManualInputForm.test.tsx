import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ManualInputForm from "../ManualInputForm";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

jest.mock("@/shared/Hint", () => ({
  Hint: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/helpers/utils/datetime-ui", () => ({
  ...jest.requireActual("@/helpers/utils/datetime-ui"),
  getCurrentTimeRoundedUp: jest.fn(() => "15:00"),
}));

jest.mock("../../TextareaWithSuggestions/TextAreaWithSuggestions", () => {
  const { useState } = jest.requireActual<typeof import("react")>("react");
  const { getReportWithCopiedLine } = jest.requireActual("../utils") as typeof import("../utils");

  return {
    __esModule: true,
    default: ({
      defaultValue,
      onChange,
      report,
    }: {
      defaultValue: string;
      onChange: (value: string) => void;
      report: string;
    }) => {
      const [value, setValue] = useState(defaultValue);

      return (
        <textarea
          aria-label="Manual input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "d") {
              event.preventDefault();
              const nextValue = getReportWithCopiedLine(
                "09:00 - timetracker - coding - feature",
                report || defaultValue,
              );
              setValue(nextValue);
              onChange(nextValue);
            }
          }}
        />
      );
    },
  };
});

global.ipcRenderer = {
  invoke: jest.fn().mockResolvedValue(null),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  ...globalIpcRendererMock,
};

const selectedDateReport = [
  "09:00 - timetracker - coding - feature",
  "10:00 - internal - review - pr",
  "11:00 - !",
].join("\n");

describe("GIVEN ManualInputForm copy-line", () => {
  afterAll(() => {
    global.ipcRenderer = globalIpcRendererMock;
  });

  it("copies the current registration and does not duplicate the end-of-day marker", () => {
    render(
      <ManualInputForm
        saveReportTrigger={false}
        onSave={jest.fn()}
        selectedDateReport={selectedDateReport}
        selectedDate={new Date()}
        setSelectedDateReport={jest.fn()}
        isFileExist={true}
        setIsFileExist={jest.fn()}
        isToday={true}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText("Manual input"), { key: "d", ctrlKey: true });

    const value = (screen.getByLabelText("Manual input") as HTMLTextAreaElement).value;

    expect(value).toContain("09:00 - timetracker - coding - feature");
    expect(value).toContain("11:00 - timetracker - coding - feature");
    expect(value).not.toContain("11:00 - !");
    expect(value.match(/ - !/g) ?? []).toHaveLength(0);
  });
});
