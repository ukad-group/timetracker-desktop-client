import { ipcMain, shell, app } from "electron";
import { IPC_MAIN_CHANNELS } from "../helpers/constants";
import { trackEvent } from "@aptabase/electron/main";
import { windowManager } from "./WindowManager";
import { updateManager } from "./UpdateManager";
import Store from "electron-store";
import fs from "fs";
import { exec } from "child_process";
import chokidar, { type FSWatcher } from "chokidar";
import { getPathFromDate, getWeeksAroundDate, getWeeksInMonth } from "../helpers/datetime";
import { createDirByPath, searchReadFiles } from "../helpers/fs";
import { parseReportsInfo, Activity } from "../helpers/parseReportsInfo";

import * as googleService from "../services/googleService";
import * as jiraService from "../services/jiraService";
import * as office365Service from "../services/office365Service";
import * as timetrackerService from "../services/timetrackerService";
import * as trelloService from "../services/trelloService";
import {
    getTimetrackerHolidays,
    getTimetrackerVacations,
    getTimetrackerCookie,
    getTimetrackerProjects,
    getTimetrackerContactPersons,
    getTimetrackerBookings,
} from "../TimetrackerWebsiteApi";

const electronStore = new Store() as Store & {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    delete: (key: string) => void;
    clear: () => void;
};

let electronSession: Record<string, unknown> = {};

const watchers: { [key: string]: FSWatcher | undefined } = {};
const userDataDirectory = app.getPath("userData");

const getConnectionUrl = (connectionName: string) => {
    const port = windowManager.getPort();
    switch (connectionName) {
        case "office365":
            return office365Service.getOffice365LoginUrl(port);
        case "jira":
            return jiraService.getJiraLoginUrl();
        case "trello":
            return trelloService.getTrelloLoginUrl();
        case "google":
            return googleService.getGoogleLoginUrl(port);
        case "timetracker-website":
            return timetrackerService.getAzureLoginBaseUrl(port);
        default:
            return "";
    }
};

type Callback = (data: string | null) => void;
const readDataFromFile = (timereportPath: string, callback: Callback) => {
    if (!fs.existsSync(timereportPath)) return callback(null);

    try {
        const data = fs.readFileSync(timereportPath, "utf8");
        callback(data);
    } catch (err) {
        console.error(err);
        windowManager.send(
            IPC_MAIN_CHANNELS.BACKEND_ERROR,
            "File reading error. The file content display may be inaccurate or absent. ",
            err,
        );
        callback(null);
    }
};

export const registerIpcHandlers = () => {
    ipcMain.on(IPC_MAIN_CHANNELS.ANALYTICS_DATA, (_, analyticsEvent: string, data?: Record<string, string>) => {
        trackEvent(analyticsEvent, data);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.BETA_CHANNEL, (_, isBeta: boolean) => {
        updateManager.checkForUpdates(isBeta);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.GET_CURRENT_VERSION, () => {
        if (windowManager.mainWindow) {
            windowManager.mainWindow.webContents.send(IPC_MAIN_CHANNELS.CURRENT_VERSION, app.getVersion());
        }
    });

    ipcMain.on(IPC_MAIN_CHANNELS.INSTALL_VERSION, () => {
        updateManager.quitAndInstall();
    });

    ipcMain.on(IPC_MAIN_CHANNELS.FRONTEND_ERROR, (_, errorTitle: string, errorMessage: string, data) => {
        windowManager.send(IPC_MAIN_CHANNELS.RENDER_ERROR, errorTitle, errorMessage, data);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.DICTIONARY_UPDATE, (_, word: string) => {
        windowManager.mainWindow?.webContents.session.addWordToSpellCheckerDictionary(word);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.REDIRECT, (_, link: string) => {
        shell.openExternal(link);
    });

    // Store Handlers
    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, async (_, val) => {
        const value = electronStore.get(val);
        _.returnValue = value ? value : null;
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_SET, (_, key, val) => {
        electronStore.set(key, typeof val == "string" ? val : JSON.stringify(val));
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, (_, key) => {
        electronStore.delete(key);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_CLEAR, () => {
        electronStore.clear();
    });

    // Session Handlers
    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_GET, (_, key) => {
        _.returnValue = electronSession[key] ?? null;
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_SET, (_, key, value) => {
        electronSession[key] = typeof value === "string" ? value : JSON.stringify(value);
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_DELETE, (_, key) => {
        delete electronSession[key];
    });

    ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_CLEAR, () => {
        electronSession = {};
    });

    // Port
    ipcMain.on(IPC_MAIN_CHANNELS.GET_CURRENT_PORT, async (_) => {
        _.returnValue = windowManager.getPort();
    });

    // Windows
    ipcMain.on(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, (_, connectionName) => {
        windowManager.createChild(getConnectionUrl(connectionName));
    });

    ipcMain.on(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, (_, componentName) => {
        switch (componentName) {
            case "google":
                windowManager.send(IPC_MAIN_CHANNELS.GOOGLE_SHOULD_RERENDER);
                break;
            case "jira":
                windowManager.send(IPC_MAIN_CHANNELS.JIRA_SHOULD_RERENDER);
                break;
            case "office365":
                windowManager.send(IPC_MAIN_CHANNELS.OFFICE365_SHOULD_RERENDER);
                break;
            case "timetracker-website":
                windowManager.send(IPC_MAIN_CHANNELS.TIMETRACKER_SHOULD_RERENDER);
                break;
            case "trello":
                windowManager.send(IPC_MAIN_CHANNELS.TRELLO_SHOULD_RERENDER);
                break;
            default:
                break;
        }
    });

    // Watchers
    ipcMain.on(IPC_MAIN_CHANNELS.START_FILE_WATCHER, (_, reportsFolder: string, selectedDate: Date) => {
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);
        try {
            if (fs.existsSync(timereportPath)) {
                windowManager.send("file-exist", true);

                const fileWatcher = chokidar.watch(timereportPath);
                watchers[timereportPath] = fileWatcher;

                fileWatcher.on("change", (timereportPath) => {
                    // Logic simplifed: re-reading file (dependency on variable scope in original was loose)
                    // Assuming selectedDate matches context
                    readDataFromFile(timereportPath, (data: string | null) => {
                        windowManager.send(IPC_MAIN_CHANNELS.FILE_CHANGED, data);
                    });
                });
            }
        } catch (err) {
            console.log(err);
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Watcher error. Updates to files might not be accurately displayed within the application. ",
                err,
            );
        }
    });

    ipcMain.on(IPC_MAIN_CHANNELS.START_FOLDER_WATCHER, (_, reportsFolder: string) => {
        try {
            if (fs.existsSync(reportsFolder)) {
                const folderWatcher = chokidar.watch(reportsFolder, { ignoreInitial: true });
                watchers[reportsFolder] = folderWatcher;

                const notify = () => windowManager.send(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED);
                folderWatcher.on("change", notify).on("add", notify).on("unlink", notify);
            }
        } catch (err) {
            console.log(err);
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Watcher error. Updates to files might not be accurately displayed within the application. ",
                err,
            );
        }
    });

    ipcMain.on(IPC_MAIN_CHANNELS.STOP_PATH_WATCHER, (_, reportsFolder: string, selectedDate: Date) => {
        try {
            if (selectedDate) {
                const timereportPath = getPathFromDate(selectedDate, reportsFolder);
                if (watchers[timereportPath]) {
                    watchers[timereportPath]?.close();
                    delete watchers[timereportPath];
                }
            } else if (watchers[reportsFolder]) {
                watchers[reportsFolder]?.close();
                delete watchers[reportsFolder];
            }
        } catch (err) {
            console.log(err);
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Watcher error. Updates to files might not be accurately displayed within the application. ",
                err,
            );
        }
    });

    // Dropbox
    ipcMain.on(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION, () => {
        const command = process.platform === "win32" ? "tasklist" : "ps aux";
        exec(command, (err, stdout, stderr) => {
            if (err || stderr) {
                console.log(err || stderr);
                return;
            }
            if (stdout) {
                const isRun = stdout.toLowerCase().includes(process.platform === "win32" ? "dropbox.exe" : "dropbox");
                windowManager.send("dropbox-connection", isRun);
            }
        });
    });

    // Storage FS
    ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_GET, (_, storageName: string) => {
        try {
            return fs.readFileSync(`${userDataDirectory}/${storageName}`, "utf8");
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
            throw error;
        }
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_SET, (_, storageName: string, value: string) => {
        fs.writeFileSync(`${userDataDirectory}/${storageName}`, value);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_DELETE, (_, storageName: string) => {
        try {
            fs.unlinkSync(`${userDataDirectory}/${storageName}`);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
    });

    // App Files
    ipcMain.handle(IPC_MAIN_CHANNELS.APP_SELECT_FOLDER, async () => {
        const { dialog } = await import("electron"); // Dynamic import to avoid issues if needed, or import at top
        const response = await dialog.showOpenDialog({ properties: ["openDirectory"] });
        if (!response.canceled) return response.filePaths[0];
        return null;
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_DELETE_FILE, async (_, reportsFolder: string, selectedDate: Date) => {
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);
        try {
            await new Promise<void>((resolve, reject) => {
                fs.unlink(timereportPath, (err) => err ? reject(err) : resolve());
            });
            return true;
        } catch { return false; }
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT, (_, reportsFolder: string, selectedDate: Date) => {
        if (!reportsFolder || !selectedDate) return null;
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);
        return new Promise((resolve) => readDataFromFile(timereportPath, resolve));
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_FIND_LAST_REPORT, (_, reportsFolder: string, selectedDate: Date) => {
        if (!reportsFolder || !selectedDate) return null;
        const LAST_PERIOD_DAYS = 31;
        for (let i = 0; i < LAST_PERIOD_DAYS; i++) {
            const date = new Date(selectedDate);
            const prevDay = new Date(date.setDate(date.getDate() - ++i));
            const timereportPath = getPathFromDate(prevDay, reportsFolder);
            if (fs.existsSync(timereportPath)) {
                try {
                    return fs.readFileSync(timereportPath, "utf8");
                } catch (err) {
                    windowManager.send(IPC_MAIN_CHANNELS.BACKEND_ERROR, "Error when finding last report", err);
                    return null;
                }
            }
        }
        return null;
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT, (_, reportsFolder: string, selectedDate: Date, report: string) => {
        if (!reportsFolder || !selectedDate) return null;
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);
        try {
            createDirByPath(timereportPath.slice(0, timereportPath.lastIndexOf("/")));
            fs.writeFileSync(timereportPath, report);
        } catch (err) {
            console.log(err);
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Error in writing to file. The file writing process may be incorrect. ",
                err,
            );
        }
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_CHECK_EXIST_REPORT, (_, reportsFolder: string, selectedDate: Date) => {
        if (!reportsFolder || !selectedDate) return false;
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);
        return fs.existsSync(timereportPath);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_FIND_LATEST_PROJECTS, (_, reportsFolder: string, selectedDate: Date) => {
        if (!reportsFolder || !selectedDate) return [];
        try {
            const parsedProjects = parseReportsInfo(reportsFolder, selectedDate);
            const sortedProjAndAct: Record<string, string[]> = Object.keys(parsedProjects).sort().reduce((acc: Record<string, string[]>, key: string) => {
                const activitySet = new Set<string>();
                windowManager.mainWindow?.webContents.session.addWordToSpellCheckerDictionary(key);
                parsedProjects[key].forEach((activity: Activity) => activity.activity && activitySet.add(activity.activity));
                acc[key] = Array.from(activitySet);
                return acc;
            }, {});

            const descriptionsSet: Record<string, string[]> = Object.keys(parsedProjects).reduce((acc: Record<string, string[]>, key: string) => {
                const descSet = new Set<string>();
                parsedProjects[key]?.forEach((activity: Activity) => activity.description && descSet.add(activity.description));
                acc[key] = Array.from(descSet);
                return acc;
            }, {});
            return { sortedProjAndAct, descriptionsSet };
        } catch (err) {
            console.log(err);
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Error reading past reports. Autocomplete suggestions will not appear in the form display. ",
                err,
            );
            return { sortedProjAndAct: { internal: [], hr: [] }, descriptionsSet: { internal: [], hr: [] } };
        }
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_FIND_QUARTER_PROJECTS, (_, reportsFolder: string, calendarDate: Date) => {
        if (!reportsFolder || !calendarDate) return [];
        return searchReadFiles(reportsFolder, getWeeksAroundDate(calendarDate));
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.APP_FIND_MONTH_PROJECTS, (_, reportsFolder: string, selectedDate: Date) => {
        if (!reportsFolder || !selectedDate) return [];
        return searchReadFiles(reportsFolder, getWeeksInMonth(selectedDate));
    });

    ipcMain.on(IPC_MAIN_CHANNELS.APP_LOAD_OFFLINE_PAGE, async () => {
        windowManager.loadUrl(`http://localhost:${windowManager.getPort()}/offline`);
    });

    // Integrations
    ipcMain.on(IPC_MAIN_CHANNELS.OFFICE365_LOGIN, () => {
        windowManager.loadUrl(office365Service.getOffice365LoginUrl(windowManager.getPort()));
    });
    ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_TOKENS, (_, code) => office365Service.office365GetTokens(code, windowManager.getPort()));
    ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_REFRESH_ACCESS_TOKEN, (_, token) => office365Service.office365RefreshAccessToken(token, windowManager.getPort()));
    ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_PROFILE_INFO, (_, token) => office365Service.office365GetProfileInfo(token));
    ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_TODAY_EVENTS, (_, token) => office365Service.office365GetTodayEvents(token));

    ipcMain.on(IPC_MAIN_CHANNELS.TRELLO_LOGIN, () => {
        windowManager.loadUrl(trelloService.getTrelloLoginUrl());
    });
    ipcMain.handle(IPC_MAIN_CHANNELS.TRELLO_GET_PROFILE_INFO, (_, token) => trelloService.trelloGetProfileInfo(token));
    ipcMain.handle(IPC_MAIN_CHANNELS.TRELLO_GET_CARDS_OF_ALL_BOARDS, (_, id, token) => trelloService.trelloGetCardsOfAllBoards(id, token));

    ipcMain.on(IPC_MAIN_CHANNELS.JIRA_LOGIN, () => {
        windowManager.loadUrl(jiraService.getJiraLoginUrl());
    });
    ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_TOKENS, (_, code) => jiraService.jiraGetTokens(code));
    ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_REFRESH_ACCESS_TOKEN, (_, token) => jiraService.jiraRefreshAccessToken(token));
    ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_PROFILE, (_, token) => jiraService.jiraGetProfile(token));
    ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_RESOURCES, (_, token) => jiraService.jiraGetResources(token));
    ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_ISSUES, (_, token, resId, assignee) => jiraService.jiraGetIssues(token, resId, assignee));

    ipcMain.on(IPC_MAIN_CHANNELS.AZURE_LOGIN_BASE, () => {
        windowManager.loadUrl(timetrackerService.getAzureLoginBaseUrl(windowManager.getPort()));
    });
    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_USER_INFO_TOKEN, (_, code) => timetrackerService.getTimetrackerUserInfoToken(code, windowManager.getPort()));
    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN, (_, token) => timetrackerService.getTimetrackerRefreshedUserInfoToken(token, windowManager.getPort()));
    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PLANNER_TOKEN, (_, code) => timetrackerService.getTimetrackerPlannerToken(code, windowManager.getPort()));
    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_PLANNER_TOKEN, (_, token) => timetrackerService.getTimetrackerRefreshedPlannerToken(token, windowManager.getPort()));

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_HOLIDAYS, async (_, token: string, calendarDate: Date) => {
        return await getTimetrackerHolidays(token, calendarDate);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_VACATIONS, async (_, token: string, email: string, calendarDate: Date) => {
        return await getTimetrackerVacations(token, email, calendarDate);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, async (_, idToken: string) => {
        return await getTimetrackerCookie(idToken);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PROJECTS, async (_, cookie: string) => {
        return await getTimetrackerProjects(cookie);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_MENTIONS, async (_, cookie: string) => {
        return await getTimetrackerContactPersons(cookie);
    });

    ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_BOOKINGS, async (_, cookie: string, name: string, calendarDate: Date) => {
        return await getTimetrackerBookings(cookie, name, calendarDate);
    });

    // Remaining Timetracker website imports were in TimetrackerWebsiteApi directly, accessed by index.ts.
    // They are not in services yet? I need to import them from the original API file or move them to service.
    // I left getTimetrackerHolidays etc in the original API file. I should probably import them in IpcHandler for now.
    // Let's import them from the original file for simplicty to avoid moving EVERYTHING.
}

// Need to import missing functions from TimetrackerWebsiteApi in the imports section.
