import { act, renderHook, waitFor } from "@testing-library/react";
import { useReportManagement } from "../useReportManagement";
import { useMainStore } from "@/store/mainStore";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

jest.mock("@/store/mainStore", () => ({
  useMainStore: jest.fn(),
}));

const mockedUseMainStore = useMainStore as unknown as jest.Mock;

const selectedDate = new Date(2026, 1, 7);
const reportsFolder = "/reports";
const dayReport = "09:00 - timetracker - coding - feature\n10:00 - !";

const sendMock = jest.fn();
const invokeMock = jest.fn();
const onMock = jest.fn();
const removeAllListenersMock = jest.fn();

const mockMainStore = (overrides: { reportsFolder?: string | null; mainStoreLoaded?: boolean } = {}) => {
  mockedUseMainStore.mockImplementation(
    (selector: (state: { reportsFolder: string | null; mainStoreLoaded: boolean }) => unknown) =>
      selector({
        reportsFolder,
        mainStoreLoaded: true,
        ...overrides,
      }),
  );
};

describe("GIVEN useReportManagement", () => {
  beforeEach(() => {
    sendMock.mockReset();
    invokeMock.mockReset();
    onMock.mockReset();
    removeAllListenersMock.mockReset();
    invokeMock.mockResolvedValue(dayReport);
    mockMainStore();

    global.ipcRenderer = {
      send: sendMock,
      invoke: invokeMock,
      on: onMock,
      removeAllListeners: removeAllListenersMock,
    } as typeof global.ipcRenderer;
  });

  it("starts watchers and reads the day report when the store is loaded", async () => {
    const { result } = renderHook(() => useReportManagement(selectedDate));

    expect(sendMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.START_FOLDER_WATCHER, reportsFolder);
    expect(sendMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.START_FILE_WATCHER, reportsFolder, selectedDate);
    expect(invokeMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT, reportsFolder, selectedDate);

    await waitFor(() => {
      expect(result.current.selectedDateReport).toBe(dayReport);
      expect(result.current.isFileExist).toBe(true);
    });
  });

  it("sets isFileExist to false when the day file is missing", async () => {
    invokeMock.mockResolvedValue(null);

    const { result } = renderHook(() => useReportManagement(selectedDate));

    await waitFor(() => {
      expect(result.current.selectedDateReport).toBe("");
      expect(result.current.isFileExist).toBe(false);
    });
  });

  it("updates the report when FILE_CHANGED fires", async () => {
    const { result } = renderHook(() => useReportManagement(selectedDate));

    await waitFor(() => {
      expect(result.current.selectedDateReport).toBe(dayReport);
    });

    const fileChangedHandler = onMock.mock.calls.find(([channel]) => channel === IPC_MAIN_CHANNELS.FILE_CHANGED)?.[1];

    act(() => {
      fileChangedHandler(null, "10:00 - internal - review - pr\n11:00 - !");
    });

    expect(result.current.selectedDateReport).toBe("10:00 - internal - review - pr\n11:00 - !");
  });

  it("cleans up the file watcher and FILE_CHANGED listeners on unmount", () => {
    const { unmount } = renderHook(() => useReportManagement(selectedDate));

    unmount();

    expect(removeAllListenersMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.FILE_CHANGED);
    expect(sendMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder);
    expect(sendMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, reportsFolder, selectedDate);
  });

  it("saves a serialized report and checks Dropbox", async () => {
    const { result } = renderHook(() => useReportManagement(selectedDate));

    await waitFor(() => {
      expect(result.current.selectedDateReport).toBe(dayReport);
    });

    act(() => {
      result.current.saveSerializedReport("09:00 - timetracker - coding - saved\n10:00 - !");
    });

    expect(sendMock).toHaveBeenCalledWith(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION);
    expect(invokeMock).toHaveBeenCalledWith(
      IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT,
      reportsFolder,
      selectedDate,
      "09:00 - timetracker - coding - saved\n10:00 - !",
    );
    expect(result.current.selectedDateReport).toBe("09:00 - timetracker - coding - saved\n10:00 - !");
  });

  it("clears the report when reading the day file fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    invokeMock.mockRejectedValue(new Error("read failed"));

    const { result } = renderHook(() => useReportManagement(selectedDate));

    await waitFor(() => {
      expect(result.current.selectedDateReport).toBe("");
      expect(result.current.isFileExist).toBe(false);
    });

    consoleError.mockRestore();
  });
});
