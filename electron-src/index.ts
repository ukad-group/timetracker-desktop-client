import fs from "fs";
import path from "path";
import next from "next";
import { parse } from "url";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  MenuItem,
  shell,
  Tray,
  globalShortcut,
  protocol,
  net,
} from "electron";
import url from "node:url";
import { autoUpdater, UpdateInfo } from "electron-updater";
import isDev from "electron-is-dev";
import { createWindow } from "./helpers/create-window";
import { parseReportsInfo, Activity } from "./helpers/parseReportsInfo";
import { getPathFromDate, getWeeksAroundDate, getWeeksInMonth } from "./helpers/datetime";
import { createDirByPath, searchReadFiles } from "./helpers/fs";
import chokidar from "chokidar";
import { initialize, trackEvent } from "@aptabase/electron/main";
import {
  callProfileInfoGraph,
  callTodayEventsGraph,
  getAuthUrl,
  getRefreshedAccessToken,
  getTokens,
} from "./helpers/API/office365Api";
import { getTrelloCardsOfAllBoards, getTrelloMember, getTrelloAuthUrl } from "./helpers/API/trelloApi";
import {
  getAzureAuthUrl,
  // getAzureAuthUrlAdditional,
  getAzureTokens,
  getRefreshedPlannerToken,
  getTimetrackerCookie,
  getTimetrackerHolidays,
  getTimetrackerProjects,
  getTimetrackerContactPersons,
  getTimetrackerVacations,
  getRefreshedUserInfoToken,
  getTimetrackerBookings,
} from "./TimetrackerWebsiteApi";
import { exec } from "child_process";
import {
  getJiraAuthUrl,
  getJiraIssues,
  getJiraProfile,
  getJiraRefreshedAccessToken,
  getJiraResources,
  getJiraTokens,
} from "./helpers/API/jiraApi";
import { IPC_MAIN_CHANNELS } from "./helpers/constants";
import { getGoogleAuthUrl } from "./helpers/API/googleApi";
import Store from "electron-store";

initialize("A-EU-9361517871");
ipcMain.on(IPC_MAIN_CHANNELS.ANALYTICS_DATA, (_, analyticsEvent: string, data?: Record<string, string>) => {
  trackEvent(analyticsEvent, data);
});

let childWindow: any;

let updateStatus: null | "available" | "downloaded" = null;
let updateVersion = "";

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

ipcMain.on(IPC_MAIN_CHANNELS.BETA_CHANNEL, (event: any, isBeta: boolean) => {
  try {
    autoUpdater.allowPrerelease = isBeta;
    autoUpdater.checkForUpdates();
  } catch (err) {
    console.log(err);
    mainWindow?.webContents.send(IPC_MAIN_CHANNELS.BACKEND_ERROR, "Updater error. Check for update", err);
  }
});

function setUpdateStatus(status: "available" | "downloaded", version: string) {
  updateStatus = status;
  updateVersion = version;
}

function isLaterVersion(currentVersion: string, updateVersion: string) {
  const currentParts = currentVersion.split(".").map(Number);
  const updateParts = updateVersion.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, updateParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const updatePart = updateParts[i] || 0;

    if (currentPart > updatePart) {
      return true;
    }
    if (currentPart < updatePart) {
      return false;
    }
  }
  return false;
}

autoUpdater.allowDowngrade = true;
autoUpdater.on("error", (e: Error, message?: string) => {
  mainWindow?.webContents.send(
    IPC_MAIN_CHANNELS.BACKEND_ERROR,
    "Updater error. An error was encountered during the download of the latest version. ",
    message,
  );
});

ipcMain.on(IPC_MAIN_CHANNELS.GET_CURRENT_VERSION, () => {
  mainWindow && mainWindow.webContents.send(IPC_MAIN_CHANNELS.CURRENT_VERSION, app.getVersion());
});

autoUpdater.on("update-available", (info: UpdateInfo) => {
  setUpdateStatus("available", info.version);

  const lowerCurrentVersion = app.getVersion().toLowerCase();
  const lowerNewVersion = info.version.toLowerCase();
  const shouldSkipDownloading =
    isLaterVersion(lowerCurrentVersion, lowerNewVersion) &&
    (!lowerCurrentVersion.includes("beta") ||
      (lowerCurrentVersion.includes("beta") && lowerNewVersion.includes("beta")));

  if (shouldSkipDownloading) {
    return;
  }

  autoUpdater.downloadUpdate();
  if (mainWindow) {
    mainWindow.webContents.send(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE, true, info);
  }
});

autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
  setUpdateStatus("downloaded", info.version);
  if (mainWindow) {
    mainWindow.webContents.send(IPC_MAIN_CHANNELS.DOWNLOADED, true, info);
  }
});

ipcMain.on(IPC_MAIN_CHANNELS.INSTALL_VERSION, () => {
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.on(IPC_MAIN_CHANNELS.FRONTEND_ERROR, (_, errorTitle: string, errorMessage: string, data) => {
  mainWindow?.webContents.send(IPC_MAIN_CHANNELS.RENDER_ERROR, errorTitle, errorMessage, data);
});
ipcMain.on(IPC_MAIN_CHANNELS.DICTIONATY_UPDATE, (_, word: string) => {
  mainWindow?.webContents.session.addWordToSpellCheckerDictionary(word);
});

ipcMain.on(IPC_MAIN_CHANNELS.REDIRECT, (_, link: string) => {
  shell.openExternal(link);
});

//defined the store
let electronStore = new Store();

ipcMain.on(IPC_MAIN_CHANNELS.GET_CURRENT_PORT, async (_) => {
  _.returnValue = getServerPort();
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, async (_, val) => {
  var value = electronStore.get(val);
  _.returnValue = value ? value : null;
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_SET, (_, key, val) => {
  electronStore.set(key, typeof val == "string" ? val : JSON.stringify(val));
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE, (_, key) => {
  electronStore.delete(key);
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_STORE_CLEAR, (_) => {
  electronStore.clear();
});

//defined the session
let electronSession: Record<string, any> = {};

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_GET, (_, key) => {
  _.returnValue = electronSession[key] ?? null;
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_SET, (_, key, value) => {
  electronSession[key] = typeof value === "string" ? value : JSON.stringify(value);
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_DELETE, (_, key) => {
  delete electronSession[key];
});

ipcMain.on(IPC_MAIN_CHANNELS.ELECTRON_SESSION_CLEAR, (_) => {
  electronSession = {};
});

const userDataDirectory = app.getPath("userData");
let mainWindow: Electron.CrossProcessExports.BrowserWindow | null = null;
const gotTheLock = app.requestSingleInstanceLock();

let server: Server<typeof IncomingMessage, typeof ServerResponse>;

const getServerPort = () => {
  let address = server?.address() as AddressInfo;
  let serverPort = address?.port ? address.port : 0;
  return serverPort;
};

const getServerAddress = () => {
  var address =
    process.env.NEXT_PUBLIC_SERVER_ADDRESS?.replace(
      process.env.NEXT_PUBLIC_PORT_REPLACE_TOKEN_NAME || "",
      getServerPort().toString(),
    ) || "";
  return address;
};

const generateWindow = () => {
  mainWindow = createWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      spellcheck: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../renderer/out/images/logo.png"),
  });

  mainWindow.maximize();
  mainWindow.loadURL(`http://localhost:${getServerPort()}/`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.on("close", (event) => {
      event.preventDefault();
      mainWindow?.hide();
    });
  }

  // define "quit" context menu click on macos
  if (process.platform === "darwin") {
    app.on("before-quit", (e) => {
      app.exit();
    });
  }

  mainWindow.webContents.session.setSpellCheckerLanguages(["en-US"]);
};

let tray: Tray | null = null;

const generateTray = () => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Activate",
      type: "normal",
      click: () => {
        if (isDev) {
          generateWindow();
        } else {
          mainWindow?.show();
        }
      },
    },
    {
      label: "Quit",
      type: "normal",
      accelerator: "CmdOrCtrl+Q",
      click: () => {
        app.exit();
      },
    },
  ]);

  const trayIconPath = path.join(__dirname, "../renderer/out/images/logo.png");

  tray = new Tray(trayIconPath);
  tray.setToolTip("Timetracker");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (isDev) {
      generateWindow();
    } else {
      mainWindow?.show();
    }
  });
};

app.on("before-quit", () => {
  tray?.destroy();
});

app.on("ready", async () => {
  const nextApp = next({
    dev: isDev,
    dir: app.getAppPath() + "/renderer",
  });

  app.on("browser-window-focus", () => {
    globalShortcut.register("CommandOrControl+Q", () => {
      app.exit();
    });
  });

  app.on("browser-window-blur", () => {
    globalShortcut.unregister("CommandOrControl+Q");
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  const requestHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    requestHandler(req, res, parsedUrl);
  }).listen(0, "127.0.0.1", () => {
    let address: AddressInfo | null | string = server.address();
    let port = (address as AddressInfo).port;
    process.env.NEXT_PUBLIC_PORT = `${port}`;

    console.log(`> Ready on http://localhost:${process.env.NEXT_PUBLIC_PORT}`);
  });

  const restartServer = () => {
    server.close(() => {
      server.listen(0, "127.0.0.1", () => {
        let address: AddressInfo | null | string = server.address();
        let port = (address as AddressInfo).port;
        process.env.NEXT_PUBLIC_PORT = `${port}`;

        console.log(`> Ready on http://127.0.0.1:${port}}`);
        mainWindow?.loadURL(`http://localhost:${port}/`);
      });
    });
  };

  server.on("error", function (error) {
    if (mainWindow) {
      const options: Electron.MessageBoxOptions = {
        type: "error",
        title: error.message,
        message: `Can't start server at http://localhost:${getServerPort()}. To resolve the server error, follow these steps: 
  1. Restart the application.
  2. Check if port ${getServerPort()} is available. 
  3. If the issue persists Reset Windows NAT:
      - Open Command Prompt as Administrator
      - Type "net stop winnat" and press Enter
      - Then, type "net start winnat" and press Enter
  4. If none of these steps work, contact support for further assistance`,
        buttons: ["Close", "Restart", "Quit"],
      };

      dialog.showMessageBox(mainWindow, options).then((response) => {
        if (response.response === 1) {
          restartServer();
        } else if (response.response === 2) {
          app.exit();
        }
      });
    }
  });

  server.on("listening", () => {
    if (!gotTheLock) {
      app.quit();
    } else {
      app.on("second-instance", () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      });
      generateWindow();
    }

    let currentSelectedDate = "";

    if (mainWindow) {
      app.whenReady().then(() => {
        protocol.handle(process.env.NEXT_PUBLIC_PROTOCOL as string, (request) => {
          const localUrl = request.url.replace(
            process.env.NEXT_PUBLIC_PROTOCOL_SERVER_ADDRESS || "",
            getServerAddress(),
          );
          return net.fetch(localUrl);
        });

        if (process.platform === "darwin") return;

        try {
          generateTray();
        } catch (err) {
          console.log(err);
          mainWindow?.webContents.send(
            IPC_MAIN_CHANNELS.BACKEND_ERROR,
            "Tray error. Encountered errors while integrating the application into the system tray.",
            err,
          );
        }
      });

      function createChildWindow(url: string) {
        childWindow = createWindow({
          width: 1000,
          height: 700,
          modal: true,
          show: false,
          autoHideMenuBar: true,
          parent: mainWindow as BrowserWindow | undefined,
          webPreferences: {},
        });

        childWindow.loadURL(url);
        childWindow.once("ready-to-show", () => {
          childWindow.show();
        });
        childWindow.on("closed", () => {
          childWindow = null;
        });
      }

      const getConnectionUrl = (connectionName: string) => {
        switch (connectionName) {
          case "office365":
            return getAuthUrl(getOffice365Options());

          case "jira":
            return getJiraAuthUrl(getJiraOptions());

          case "trello":
            return getTrelloAuthUrl(getTrelloOptions());

          case "google":
            return getGoogleAuthUrl(getGoogleOptions());

          case "timetracker-website":
            const options = getOffice365Options();

            const optionsWithAllScope = {
              ...options,
              scope:
                "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access profile email offline_access openid User.Read Calendars.Read",
            };

            return getAzureAuthUrl(optionsWithAllScope);

          default:
            return "";
        }
      };

      ipcMain.on(IPC_MAIN_CHANNELS.OPEN_CHILD_WINDOW, (_, connectionName) => {
        createChildWindow(getConnectionUrl(connectionName));
      });

      ipcMain.on(IPC_MAIN_CHANNELS.CHILD_WINDOW_CLOSED, (_, componentName) => {
        switch (componentName) {
          case "google":
            mainWindow?.webContents.send(IPC_MAIN_CHANNELS.GOOGLE_SHOULD_RERENDER);
            break;

          case "jira":
            mainWindow?.webContents.send(IPC_MAIN_CHANNELS.JIRA_SHOULD_RERENDER);
            break;

          case "office365":
            mainWindow?.webContents.send(IPC_MAIN_CHANNELS.OFFICE365_SHOULD_RERENDER);
            break;

          case "timetracker-website":
            mainWindow?.webContents.send(IPC_MAIN_CHANNELS.TIMETRACKER_SHOULD_RERENDER);
            break;

          case "trello":
            mainWindow?.webContents.send(IPC_MAIN_CHANNELS.TRELLO_SHOULD_RERENDER);
            break;

          default:
            break;
        }
      });

      // common scope watchers for the start/stop-folder-watcher functions
      const watchers: {
        [key: string]: chokidar.FSWatcher | undefined;
      } = {};

      ipcMain.on(IPC_MAIN_CHANNELS.START_FILE_WATCHER, (_, reportsFolder: string, selectedDate: Date) => {
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);

        try {
          if (fs.existsSync(timereportPath)) {
            mainWindow?.webContents.send("file-exist", true);

            const fileWatcher = chokidar.watch(timereportPath);
            watchers[timereportPath] = fileWatcher;

            fileWatcher.on("change", (timereportPath) => {
              currentSelectedDate = selectedDate.toDateString();

              if (currentSelectedDate === selectedDate.toDateString()) {
                readDataFromFile(timereportPath, (data: string | null) => {
                  mainWindow && mainWindow.webContents.send(IPC_MAIN_CHANNELS.FILE_CHANGED, data);
                });
              }
            });
          }
        } catch (err) {
          console.log(err);
          mainWindow?.webContents.send(
            IPC_MAIN_CHANNELS.BACKEND_ERROR,
            "Watcher error. Updates to files might not be accurately displayed within the application. ",
            err,
          );
        }
      });

      ipcMain.on(IPC_MAIN_CHANNELS.START_FOLDER_WATCHER, (_, reportsFolder: string) => {
        try {
          if (fs.existsSync(reportsFolder)) {
            const folderWatcher = chokidar.watch(reportsFolder, {
              ignoreInitial: true,
            });
            watchers[reportsFolder] = folderWatcher;

            folderWatcher
              .on("change", () => {
                mainWindow?.webContents.send(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED);
              })
              .on("add", () => {
                mainWindow?.webContents.send(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED);
              })
              .on("unlink", () => {
                mainWindow?.webContents.send(IPC_MAIN_CHANNELS.ANY_FILE_CHANGED);
              });
          }
        } catch (err) {
          console.log(err);
          mainWindow?.webContents.send(
            IPC_MAIN_CHANNELS.BACKEND_ERROR,
            "Watcher error. Updates to files might not be accurately displayed within the application. ",
            err,
          );
        }
      });

      ipcMain.on(IPC_MAIN_CHANNELS.CHECK_DROPBOX_CONNECTION, () => {
        const command = process.platform === "win32" ? "tasklist" : "ps aux";
        exec(command, (err, stdout, stderr) => {
          if (err) {
            console.log(err);
            return;
          }
          if (stderr) {
            console.log(stderr);
            return;
          }
          if (stdout) {
            const isRun = stdout.toLowerCase().includes(process.platform === "win32" ? "dropbox.exe" : "dropbox");
            mainWindow?.webContents.send("dropbox-connection", isRun);
          }
        });
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
          mainWindow?.webContents.send(
            IPC_MAIN_CHANNELS.BACKEND_ERROR,
            "Watcher error. Updates to files might not be accurately displayed within the application. ",
            err,
          );
        }
      });

      mainWindow.webContents.on("will-navigate", function (event, newUrl) {
        console.log("will-navigate", newUrl);
      });

      mainWindow.webContents.on("context-menu", (_, params) => {
        const menu = new Menu();

        for (const suggestion of params.dictionarySuggestions) {
          menu.append(
            new MenuItem({
              label: suggestion,
              click: () => mainWindow && mainWindow.webContents.replaceMisspelling(suggestion),
            }),
          );
        }

        if (params.misspelledWord && mainWindow) {
          menu.append(
            new MenuItem({
              label: "Add to dictionary",
              click: () =>
                mainWindow && mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
            }),
          );
        }

        menu.popup();
      });
    }

    mainWindow?.on("focus", () => {
      mainWindow?.webContents.send(IPC_MAIN_CHANNELS.WINDOW_FOCUSED);
    });
  });
});

app.on("activate", () => {
  if (process.platform === "darwin") mainWindow?.show();
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_GET, (_, storageName: string) => {
  return fs.readFileSync(`${userDataDirectory}/${storageName}`, "utf8");
});

ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_SET, (_, storageName: string, value: string) => {
  fs.writeFileSync(`${userDataDirectory}/${storageName}`, value);
});

ipcMain.handle(IPC_MAIN_CHANNELS.STORAGE_DELETE, (_, storageName: string) => {
  fs.unlinkSync(`${userDataDirectory}/${storageName}`);
});

ipcMain.handle(IPC_MAIN_CHANNELS.APP_SELECT_FOLDER, async () => {
  const response = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!response.canceled) {
    return response.filePaths[0];
  }
  return null;
});

type Callback = (data: string | null) => void;
const readDataFromFile = (timereportPath: string, callback: Callback) => {
  if (!fs.existsSync(timereportPath)) return callback(null);

  try {
    const data = fs.readFileSync(timereportPath, "utf8");
    callback(data);
  } catch (err) {
    console.error(err);
    mainWindow?.webContents.send(
      IPC_MAIN_CHANNELS.BACKEND_ERROR,
      "File reading error. The file content display may be inaccurate or absent. ",
      err,
    );
    callback(null);
  }
};
const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Error deleting file:", error);
        reject(error);
      } else {
        console.log("File deleted successfully:", filePath);
        resolve();
      }
    });
  });
};

ipcMain.handle(IPC_MAIN_CHANNELS.APP_DELETE_FILE, async (_, reportsFolder: string, selectedDate: Date) => {
  const timereportPath = getPathFromDate(selectedDate, reportsFolder);

  try {
    await deleteFile(timereportPath);

    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle(IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT, (_, reportsFolder: string, selectedDate: Date) => {
  if (!reportsFolder || !selectedDate) return null;

  const timereportPath = getPathFromDate(selectedDate, reportsFolder);

  return new Promise((resolve) => {
    readDataFromFile(timereportPath, (data) => {
      resolve(data);
    });
  });
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
        const data = fs.readFileSync(timereportPath, "utf8");
        return data;
      } catch (err) {
        console.error(err);
        mainWindow?.webContents.send(IPC_MAIN_CHANNELS.BACKEND_ERROR, "Error when finding last report", err);

        return null;
      }
    }
  }

  return null;
});

ipcMain.handle(
  IPC_MAIN_CHANNELS.APP_WRITE_DAY_REPORT,
  (_, reportsFolder: string, selectedDate: Date, report: string) => {
    if (!reportsFolder || !selectedDate) return null;

    const timereportPath = getPathFromDate(selectedDate, reportsFolder);

    try {
      createDirByPath(timereportPath.slice(0, timereportPath.lastIndexOf("/")));
      fs.writeFileSync(timereportPath, report);
    } catch (err) {
      console.log(err);

      mainWindow?.webContents.send(
        IPC_MAIN_CHANNELS.BACKEND_ERROR,
        "Error in writing to file. The file writing process may be incorrect. ",
        err,
      );

      return;
    }
  },
);

ipcMain.handle(IPC_MAIN_CHANNELS.APP_CHECK_EXIST_REPORT, (_, reportsFolder: string, selectedDate: Date) => {
  if (!reportsFolder || !selectedDate) return false;

  const timereportPath = getPathFromDate(selectedDate, reportsFolder);

  try {
    return fs.existsSync(timereportPath) ? true : false;
  } catch (err) {
    console.log(err);
    mainWindow?.webContents.send(IPC_MAIN_CHANNELS.BACKEND_ERROR, "Error when checking existing project.", err);
  }
});

ipcMain.handle(IPC_MAIN_CHANNELS.APP_FIND_LATEST_PROJECTS, (_, reportsFolder: string, selectedDate: Date) => {
  if (!reportsFolder || !selectedDate) return [];

  try {
    const parsedProjects = parseReportsInfo(reportsFolder, selectedDate);
    const sortedProjAndAct: Record<string, string[]> = Object.keys(parsedProjects)
      .sort()
      .reduce((accumulator: Record<string, string[]>, key) => {
        const activitySet = new Set<string>();

        if (mainWindow) {
          mainWindow.webContents.session.addWordToSpellCheckerDictionary(key);
        }

        parsedProjects[key].forEach((activity: Activity) => {
          if (activity.activity) {
            activitySet.add(activity.activity);
          }
        });

        accumulator[key] = Array.from(activitySet);

        return accumulator;
      }, {});

    const descriptionsSet: Record<string, string[]> = Object.keys(parsedProjects).reduce(
      (accumulator: Record<string, string[]>, key) => {
        const descriptionsSet = new Set<string>();

        parsedProjects[key]?.forEach((activity: Activity) => {
          if (activity.description) {
            descriptionsSet.add(activity.description);
          }
        });

        accumulator[key] = Array.from(descriptionsSet);

        return accumulator;
      },
      {},
    );

    return { sortedProjAndAct, descriptionsSet };
  } catch (err) {
    console.log(err);

    mainWindow?.webContents.send(
      IPC_MAIN_CHANNELS.BACKEND_ERROR,
      "Error reading past reports. Autocomplete suggestions will not appear in the form display. ",
      err,
    );

    const sortedProjAndAct: Record<string, string[]> = {
      internal: [],
      hr: [],
    };
    const descriptionsSet: Record<string, string[]> = {
      internal: [],
      hr: [],
    };

    return { sortedProjAndAct, descriptionsSet };
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
  mainWindow?.loadURL(`http://localhost:${getServerPort()}/offline`);
});

//#region GOOGLE FUNCTIONS

const getGoogleOptions = () => {
  return {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
    redirectUri: `http://localhost:${getServerPort()}/settings`,
    scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile",
  };
};

//#endregion

//#region TRELLO FUNCTIONS

const getTrelloOptions = () => {
  return {
    key: process.env.NEXT_PUBLIC_TRELLO_KEY || "",
    returnUrl: process.env.NEXT_PUBLIC_TRELLO_REDIRECT_URI || "",
  };
};

ipcMain.on(IPC_MAIN_CHANNELS.TRELLO_LOGIN, async () => {
  const options = getTrelloOptions();
  const trelloAuthUrl = getTrelloAuthUrl(options);

  mainWindow?.loadURL(trelloAuthUrl);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TRELLO_GET_PROFILE_INFO, async (_, accessToken: string) => {
  const options = getTrelloOptions();

  return await getTrelloMember({ accessToken, options });
});

ipcMain.handle(IPC_MAIN_CHANNELS.TRELLO_GET_CARDS_OF_ALL_BOARDS, async (_, memberId: string, accessToken: string) => {
  const options = getTrelloOptions();

  return await getTrelloCardsOfAllBoards({ memberId, accessToken, options });
});

//#endregion

//#region JIRA FUNCTIONS

const getJiraOptions = () => {
  return {
    clientId: process.env.NEXT_PUBLIC_JIRA_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_JIRA_CLIENT_SECRET || "",
    redirectUri: process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI || "",
    scope: process.env.NEXT_PUBLIC_JIRA_SCOPE || "",
  };
};

ipcMain.on(IPC_MAIN_CHANNELS.JIRA_LOGIN, async () => {
  const options = getJiraOptions();
  const jiraAuthUrl = getJiraAuthUrl(options);

  mainWindow?.loadURL(jiraAuthUrl);
});

ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_TOKENS, async (_, authCode: string) => {
  const options = getJiraOptions();

  return await getJiraTokens(authCode, options);
});

ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_REFRESH_ACCESS_TOKEN, async (_, refreshToken: string) => {
  const options = getJiraOptions();

  return await getJiraRefreshedAccessToken(refreshToken, options);
});

ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_PROFILE, async (_, accessToken: string) => {
  return await getJiraProfile(accessToken);
});

ipcMain.handle(IPC_MAIN_CHANNELS.JIRA_GET_RESOURCES, async (_, accessToken: string) => {
  return await getJiraResources(accessToken);
});

ipcMain.handle(
  IPC_MAIN_CHANNELS.JIRA_GET_ISSUES,
  async (_, accessToken: string, resourceId: string, assignee: string) => {
    return await getJiraIssues(accessToken, resourceId, assignee);
  },
);

//#endregion

//#region MICROSOFT OFFICE365 FUNCTIONS

const getOffice365Options = () => {
  return {
    clientId: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_SECRET || "",
    redirectUri:
      process.env.NEXT_PUBLIC_OFFICE365_REDIRECT_URI?.replace(
        process.env.NEXT_PUBLIC_PORT_REPLACE_TOKEN_NAME || "",
        getServerPort().toString(),
      ) || "",
    scope: process.env.NEXT_PUBLIC_OFFICE365_SCOPE || "",
  };
};

ipcMain.on(IPC_MAIN_CHANNELS.OFFICE365_LOGIN, async () => {
  const options = getOffice365Options();
  const office365AuthUrl = getAuthUrl(options);

  mainWindow?.loadURL(office365AuthUrl);
});

ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_TOKENS, async (_, authCode: string) => {
  const options = getOffice365Options();

  return await getTokens(authCode, options);
});

ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_REFRESH_ACCESS_TOKEN, async (_, refreshToken: string) => {
  const options = getOffice365Options();

  return await getRefreshedAccessToken(refreshToken, options);
});

ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_PROFILE_INFO, async (_, accessToken: string) => {
  return await callProfileInfoGraph(accessToken);
});

ipcMain.handle(IPC_MAIN_CHANNELS.OFFICE365_GET_TODAY_EVENTS, async (_, accessToken: string) => {
  return await callTodayEventsGraph(accessToken);
});

//#endregion

//#region TIMETRACKER WEBSITE

ipcMain.on(IPC_MAIN_CHANNELS.AZURE_LOGIN_BASE, async () => {
  const options = getOffice365Options();

  const optionsWithAllScope = {
    ...options,
    scope:
      "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access profile email offline_access openid User.Read Calendars.Read",
  };

  mainWindow?.loadURL(getAzureAuthUrl(optionsWithAllScope));
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_USER_INFO_TOKEN, async (_, authCode: string) => {
  const options = getOffice365Options();

  return await getAzureTokens(authCode, options);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_USER_INFO_TOKEN, async (_, refreshToken: string) => {
  const options = getOffice365Options();

  return await getRefreshedUserInfoToken(refreshToken, options);
});

// TODO: remove this handler if requests to the timetracker website don't generate errors in the beta version

// ipcMain.on(IPC_MAIN_CHANNELS.AZURE_LOGIN_ADDITIONAL, async () => {
//   const options = getOffice365Options();

//   const optionsWithPlannerScope = {
//     ...options,
//     scope: "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
//   };

// mainWindow?.loadURL(getAzureAuthUrlAdditional(optionsWithPlannerScope));
// });

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PLANNER_TOKEN, async (_, authCode: string) => {
  const options = getOffice365Options();

  const optionsWithPlannerScope = {
    ...options,
    scope: "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
  };
  return await getAzureTokens(authCode, optionsWithPlannerScope);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_REFRESH_PLANNER_TOKEN, async (_, refreshToken: string) => {
  const options = getOffice365Options();

  const optionsWithPlannerScope = {
    ...options,
    scope: "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
  };
  return await getRefreshedPlannerToken(refreshToken, optionsWithPlannerScope);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_HOLIDAYS, async (_, token: string, calendarDate: Date) => {
  return await getTimetrackerHolidays(token, calendarDate);
});

ipcMain.handle(
  IPC_MAIN_CHANNELS.TIMETRACKER_GET_VACATIONS,
  async (_, token: string, email: string, calendarDate: Date) => {
    return await getTimetrackerVacations(token, email, calendarDate);
  },
);

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_LOGIN, async (_, idToken: string) => {
  return await getTimetrackerCookie(idToken);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_PROJECTS, async (_, cookie: string) => {
  return await getTimetrackerProjects(cookie);
});

ipcMain.handle(IPC_MAIN_CHANNELS.TIMETRACKER_GET_MENTIONS, async (_, cookie: string) => {
  return await getTimetrackerContactPersons(cookie);
});

ipcMain.handle(
  IPC_MAIN_CHANNELS.TIMETRACKER_GET_BOOKINGS,
  async (_, cookie: string, name: string, calendarDate: Date) => {
    return await getTimetrackerBookings(cookie, name, calendarDate);
  },
);

//#endregion
