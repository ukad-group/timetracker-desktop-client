import fs from "fs";
import path from "path";
import next from "next";
import { parse } from "url";
import { createServer } from "http";
import { app, dialog, ipcMain, Menu, MenuItem, shell, Tray } from "electron";
import { autoUpdater, UpdateInfo } from "electron-updater";
import isDev from "electron-is-dev";
import { createWindow } from "./helpers/create-window";
import { parseReportsInfo, Activity } from "./helpers/parseReportsInfo";
import { getPathFromDate } from "./helpers/datetime";
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
import {
  getCardsOfMember,
  getMember,
  getTrelloAuthUrl,
} from "./helpers/API/trelloApi";
import {
  getAzureAuthUrl,
  getAzureAuthUrlAdditional,
  getAzureTokens,
  getRefreshedPlannerToken,
  getTimetrackerCookie,
  getTimetrackerHolidays,
  getTimetrackerProjects,
  getTimetrackerVacations,
  getRefreshedUserInfoToken,
} from "./TimetrackerWebsiteApi";
import { exec } from "child_process";

initialize("A-EU-9361517871");
ipcMain.on(
  "send-analytics-data",
  (event, analyticsEvent: string, data?: Record<string, string>) => {
    trackEvent(analyticsEvent, data);
  }
);

const PORT = 51432;

let updateStatus: null | "available" | "downloaded" = null;
let updateVersion = "";

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

ipcMain.on("beta-channel", (event: any, isBeta: boolean) => {
  autoUpdater.allowPrerelease = isBeta;
});

function setUpdateStatus(status: "available" | "downloaded", version: string) {
  updateStatus = status;
  updateVersion = version;
}

autoUpdater.allowDowngrade = true;
autoUpdater.on("error", (e: Error, message?: string) => {
  mainWindow?.webContents.send(
    "background error",
    "Updater error. An error was encountered during the download of the latest version. ",
    message
  );
});

ipcMain.on("get-current-version", () => {
  mainWindow &&
    mainWindow.webContents.send("current-version", app.getVersion());
});

autoUpdater.on("update-available", (info: UpdateInfo) => {
  setUpdateStatus("available", info.version);
  autoUpdater.downloadUpdate();
  if (mainWindow) {
    mainWindow.webContents.send("update-available", true, info);
  }
});

autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
  setUpdateStatus("downloaded", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("downloaded", true, info);
  }
});

ipcMain.on("install", () => {
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.on(
  "front error",
  (event, errorTitle: string, errorMessage: string, data) => {
    mainWindow?.webContents.send(
      "render error",
      errorTitle,
      errorMessage,
      data
    );
  }
);
ipcMain.on("dictionaty-update", (event, word: string) => {
  mainWindow?.webContents.session.addWordToSpellCheckerDictionary(word);
});

ipcMain.on("slack-redirect", (event, isDesktop: boolean) => {
  shell.openExternal(
    isDesktop
      ? "slack://channel?team=T3PV37ANP&id=C05JN9P19G8"
      : "https://ukad.slack.com/archives/C05JN9P19G8"
  );
});

const userDataDirectory = app.getPath("userData");
let mainWindow: Electron.CrossProcessExports.BrowserWindow | null = null;
const gotTheLock = app.requestSingleInstanceLock();

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

  mainWindow.loadURL(`http://localhost:${PORT}/`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.on("close", (event) => {
      event.preventDefault();
      mainWindow?.hide();
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
        autoUpdater.checkForUpdates();
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
    autoUpdater.checkForUpdates();
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

  const requestHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    requestHandler(req, res, parsedUrl);
  }).listen(PORT, "127.0.0.1", () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  const restartServer = () => {
    server.close(() => {
      server.listen(PORT, "127.0.0.1", () => {
        console.log(`> Ready on http://127.0.0.1:${PORT}`);
        mainWindow?.loadURL(`http://localhost:${PORT}/`);
      });
    });
  };

  server.on("error", function (error) {
    if (mainWindow) {
      const options: Electron.MessageBoxOptions = {
        type: "error",
        title: error.message,
        message: `Can't start server at http://localhost:${PORT}. To resolve the server error, follow these steps: 
  1. Restart the application.
  2. Check if port 51432 is available. 
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
      autoUpdater.checkForUpdates();
      try {
        generateTray();
      } catch (err) {
        console.log(err);
        mainWindow?.webContents.send(
          "background error",
          "Tray error. Encountered errors while integrating the application into the system tray.",
          err
        );
      }
    });

    // common scope watchers for the start/stop-folder-watcher functions
    const watchers: {
      [key: string]: chokidar.FSWatcher | undefined;
    } = {};

    ipcMain.on(
      "start-file-watcher",
      (event, reportsFolder: string, selectedDate: Date) => {
        const timereportPath = getPathFromDate(selectedDate, reportsFolder);

        try {
          if (fs.existsSync(timereportPath)) {
            mainWindow?.webContents.send("file exist", true);

            const fileWatcher = chokidar.watch(timereportPath);
            watchers[timereportPath] = fileWatcher;

            fileWatcher.on("change", (timereportPath) => {
              currentSelectedDate = selectedDate.toDateString();

              if (currentSelectedDate === selectedDate.toDateString()) {
                readDataFromFile(timereportPath, (data: string | null) => {
                  mainWindow &&
                    mainWindow.webContents.send("file-changed", data);
                });
              }
            });
          }
        } catch (err) {
          console.log(err);
          mainWindow?.webContents.send(
            "background error",
            "Watcher error. Updates to files might not be accurately displayed within the application. ",
            err
          );
        }
      }
    );

    ipcMain.on("start-folder-watcher", (event, reportsFolder: string) => {
      try {
        if (fs.existsSync(reportsFolder)) {
          const folderWatcher = chokidar.watch(reportsFolder, {
            ignoreInitial: true,
          });
          watchers[reportsFolder] = folderWatcher;

          folderWatcher
            .on("change", () => {
              mainWindow?.webContents.send("any-file-changed");
            })
            .on("add", () => {
              mainWindow?.webContents.send("any-file-changed");
            })
            .on("unlink", () => {
              mainWindow?.webContents.send("any-file-changed");
            });
        }
      } catch (err) {
        console.log(err);
        mainWindow?.webContents.send(
          "background error",
          "Watcher error. Updates to files might not be accurately displayed within the application. ",
          err
        );
      }
    });

    ipcMain.on("check-dropbox-connection", () => {
      exec("tasklist", (err, stdout, stderr) => {
        if (err) {
          console.log(err);
          return;
        }
        if (stderr) {
          console.log(stderr);
          return;
        }
        if (stdout) {
          const isRun = stdout.toLowerCase().includes("dropbox.exe");
          mainWindow?.webContents.send("dropbox-connection", isRun);
        }
      });
    });

    ipcMain.on(
      "stop-path-watcher",
      (event, reportsFolder: string, selectedDate: Date) => {
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
            "background error",
            "Watcher error. Updates to files might not be accurately displayed within the application. ",
            err
          );
        }
      }
    );

    mainWindow.webContents.on("context-menu", (event, params) => {
      const menu = new Menu();

      for (const suggestion of params.dictionarySuggestions) {
        menu.append(
          new MenuItem({
            label: suggestion,
            click: () =>
              mainWindow &&
              mainWindow.webContents.replaceMisspelling(suggestion),
          })
        );
      }

      if (params.misspelledWord && mainWindow) {
        menu.append(
          new MenuItem({
            label: "Add to dictionary",
            click: () =>
              mainWindow &&
              mainWindow.webContents.session.addWordToSpellCheckerDictionary(
                params.misspelledWord
              ),
          })
        );
      }

      menu.popup();
    });
  }

  mainWindow?.on("focus", () => {
    mainWindow?.webContents.send("window-focused");
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle("storage:get", (event, storageName: string) => {
  return fs.readFileSync(`${userDataDirectory}/${storageName}`, "utf8");
});

ipcMain.handle("storage:set", (event, storageName: string, value: string) => {
  fs.writeFileSync(`${userDataDirectory}/${storageName}`, value);
});

ipcMain.handle("storage:delete", (event, storageName: string) => {
  fs.unlinkSync(`${userDataDirectory}/${storageName}`);
});

ipcMain.handle("app:select-folder", async () => {
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
      "background error",
      "File reading error. The file content display may be inaccurate or absent. ",
      err
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

ipcMain.handle("app:update-status", async () => {
  return [updateStatus, updateVersion];
});

ipcMain.handle(
  "app:delete-file",
  async (event, reportsFolder: string, stringDate: string) => {
    const date = new Date(stringDate);
    const timereportPath = getPathFromDate(date, reportsFolder);

    try {
      await deleteFile(timereportPath);

      return true;
    } catch (error) {
      return false;
    }
  }
);

ipcMain.handle(
  "app:read-day-report",
  (event, reportsFolder: string, stringDate: string) => {
    if (!reportsFolder || !stringDate.length) return null;

    const date = new Date(stringDate);
    const timereportPath = getPathFromDate(date, reportsFolder);

    return new Promise((resolve) => {
      readDataFromFile(timereportPath, (data) => {
        resolve(data);
      });
    });
  }
);

ipcMain.handle(
  "app:find-last-report",
  (event, reportsFolder: string, stringDate: string) => {
    if (!reportsFolder || !stringDate.length) return null;

    const LAST_PERIOD_DAYS = 31;

    for (let i = 0; i < LAST_PERIOD_DAYS; i++) {
      const date = new Date(stringDate);
      const prevDay = new Date(date.setDate(date.getDate() - ++i));
      const timereportPath = getPathFromDate(prevDay, reportsFolder);

      if (fs.existsSync(timereportPath)) {
        try {
          const data = fs.readFileSync(timereportPath, "utf8");
          return data;
        } catch (err) {
          console.error(err);
          mainWindow?.webContents.send(
            "background error",
            "Error when finding last report",
            err
          );

          return null;
        }
      }
    }

    return null;
  }
);

ipcMain.handle(
  "app:write-day-report",
  (event, reportsFolder: string, stringDate: string, report: string) => {
    if (!reportsFolder || !stringDate.length) return null;

    const date = new Date(stringDate);
    const timereportPath = getPathFromDate(date, reportsFolder);

    try {
      createDirByPath(timereportPath.slice(0, timereportPath.lastIndexOf("/")));
      fs.writeFileSync(timereportPath, report);
    } catch (err) {
      console.log(err);

      mainWindow?.webContents.send(
        "background error",
        "Error in writing to file. The file writing process may be incorrect. ",
        err
      );

      return;
    }
  }
);

ipcMain.handle(
  "app:check-exist-report",
  (event, reportsFolder: string, stringDate: string) => {
    if (!reportsFolder || !stringDate.length) return false;

    const date = new Date(stringDate);
    const timereportPath = getPathFromDate(date, reportsFolder);

    try {
      return fs.existsSync(timereportPath) ? true : false;
    } catch (err) {
      console.log(err);
      mainWindow?.webContents.send(
        "background error",
        "Error when checking existing project.",
        err
      );
    }
  }
);

ipcMain.handle(
  "app:find-latest-projects",
  (event, reportsFolder: string, stringDate: string) => {
    if (!reportsFolder || !stringDate.length) return [];

    const date = new Date(stringDate);

    try {
      const parsedProjects = parseReportsInfo(reportsFolder, date);
      const sortedProjAndAct: Record<string, string[]> = Object.keys(
        parsedProjects
      )
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

      const descriptionsSet: Record<string, string[]> = Object.keys(
        parsedProjects
      ).reduce((accumulator: Record<string, string[]>, key) => {
        const descriptionsSet = new Set<string>();

        parsedProjects[key]?.forEach((activity: Activity) => {
          if (activity.description) {
            descriptionsSet.add(activity.description);
          }
        });

        accumulator[key] = Array.from(descriptionsSet);

        return accumulator;
      }, {});

      return { sortedProjAndAct, descriptionsSet };
    } catch (err) {
      console.log(err);

      mainWindow?.webContents.send(
        "background error",
        "Error reading past reports. Autocomplete suggestions will not appear in the form display. ",
        err
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
  }
);

ipcMain.handle(
  "app:find-quarter-projects",
  (event, reportsFolder: string, stringDate: string) => {
    if (!reportsFolder || !stringDate.length) return [];

    const date = new Date(stringDate);
    const year = date.getFullYear().toString();
    const prevMonth = date.getMonth().toString().padStart(2, "0");
    const currentMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const nextMonth = (date.getMonth() + 2).toString().padStart(2, "0");
    const queries = [year + currentMonth, year + prevMonth, year + nextMonth];

    return searchReadFiles(reportsFolder, queries, year);
  }
);

ipcMain.on("app:load-offline-page", async () => {
  mainWindow?.loadURL(`http://localhost:${PORT}/offline`);
});

// TRELLO FUNCTIONS

const getTrelloOptions = () => {
  return {
    key: process.env.NEXT_PUBLIC_TRELLO_KEY || "",
    returnUrl: process.env.NEXT_PUBLIC_TRELLO_REDIRECT_URI || "",
  };
};

ipcMain.on("trello:login", async () => {
  const options = getTrelloOptions();
  const trelloAuthUrl = getTrelloAuthUrl(options);

  mainWindow?.loadURL(trelloAuthUrl);
});

ipcMain.handle(
  "trello:get-profile-info",
  async (event, accessToken: string) => {
    const options = getTrelloOptions();

    return await getMember(accessToken, options);
  }
);

ipcMain.handle("trello:get-cards", async (event, accessToken: string) => {
  const options = getTrelloOptions();

  return await getCardsOfMember(accessToken, options);
});

// MICROSOFT OFFICE365 FUNCTIONS

const getOffice365Options = () => {
  return {
    clientId: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_SECRET || "",
    redirectUri: process.env.NEXT_PUBLIC_OFFICE365_REDIRECT_URI || "",
    scope: process.env.NEXT_PUBLIC_OFFICE365_SCOPE || "",
  };
};

ipcMain.on("office365:login", async () => {
  const options = getOffice365Options();
  const office365AuthUrl = getAuthUrl(options);

  mainWindow?.loadURL(office365AuthUrl);
});

ipcMain.handle("office365:get-tokens", async (event, authCode: string) => {
  const options = getOffice365Options();

  return await getTokens(authCode, options);
});

ipcMain.handle(
  "office365:refresh-access-token",
  async (event, refreshToken: string) => {
    const options = getOffice365Options();

    return await getRefreshedAccessToken(refreshToken, options);
  }
);

ipcMain.handle(
  "office365:get-profile-info",
  async (event, accessToken: string) => {
    return await callProfileInfoGraph(accessToken);
  }
);

ipcMain.handle(
  "office365:get-today-events",
  async (event, accessToken: string) => {
    return await callTodayEventsGraph(accessToken);
  }
);

// TIMETRACKER WEBSITE

ipcMain.on("azure:login-base", async () => {
  const options = getOffice365Options();

  const optionsWithAllScope = {
    ...options,
    scope:
      "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access profile email offline_access openid User.Read Calendars.Read",
  };

  mainWindow?.loadURL(getAzureAuthUrl(optionsWithAllScope));
});

ipcMain.handle(
  "timetracker:get-user-info-token",
  async (event, authCode: string) => {
    const options = getOffice365Options();

    return await getAzureTokens(authCode, options);
  }
);

ipcMain.handle(
  "timetracker:refresh-user-info-token",
  async (event, refreshToken: string) => {
    const options = getOffice365Options();

    return await getRefreshedUserInfoToken(refreshToken, options);
  }
);

ipcMain.on("azure:login-additional", async () => {
  const options = getOffice365Options();

  const optionsWithPlannerScope = {
    ...options,
    scope:
      "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
  };

  mainWindow?.loadURL(getAzureAuthUrlAdditional(optionsWithPlannerScope));
});

ipcMain.handle(
  "timetracker:get-planner-token",
  async (event, authCode: string) => {
    const options = getOffice365Options();

    const optionsWithPlannerScope = {
      ...options,
      scope:
        "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
    };
    return await getAzureTokens(authCode, optionsWithPlannerScope);
  }
);

ipcMain.handle(
  "timetracker:refresh-planner-token",
  async (event, refreshToken: string) => {
    const options = getOffice365Options();

    const optionsWithPlannerScope = {
      ...options,
      scope:
        "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
    };
    return await getRefreshedPlannerToken(
      refreshToken,
      optionsWithPlannerScope
    );
  }
);

ipcMain.handle(
  "timetracker:get-holidays",
  async (event, token: string, calendarDate: Date) => {
    return await getTimetrackerHolidays(token, calendarDate);
  }
);

ipcMain.handle(
  "timetracker:get-vacations",
  async (event, token: string, email: string, calendarDate: Date) => {
    return await getTimetrackerVacations(token, email, calendarDate);
  }
);

ipcMain.handle("timetracker:login", async (event, idToken: string) => {
  return await getTimetrackerCookie(idToken);
});

ipcMain.handle("timetracker:get-projects", async (event, cookie: string) => {
  return await getTimetrackerProjects(cookie);
});
