import { BrowserWindow, Tray, Menu, app, MenuItem } from "electron";
import { createWindow } from "../helpers/create-window";
import path from "path";
import isDev from "electron-is-dev";
import { IPC_MAIN_CHANNELS } from "../helpers/constants";

class WindowManager {
    public mainWindow: BrowserWindow | null = null;
    public childWindow: BrowserWindow | null = null;
    private tray: Tray | null = null;
    private port: number = 0;

    private getRerenderChannelForConnection(connectionName: string) {
        switch (connectionName) {
            case "google":
                return IPC_MAIN_CHANNELS.GOOGLE_SHOULD_RERENDER;
            case "jira":
                return IPC_MAIN_CHANNELS.JIRA_SHOULD_RERENDER;
            case "office365":
                return IPC_MAIN_CHANNELS.OFFICE365_SHOULD_RERENDER;
            case "timetracker-website":
                return IPC_MAIN_CHANNELS.TIMETRACKER_SHOULD_RERENDER;
            case "trello":
                return IPC_MAIN_CHANNELS.TRELLO_SHOULD_RERENDER;
            default:
                return null;
        }
    }

    setPort(port: number) {
        this.port = port;
    }

    getPort() {
        return this.port;
    }

    createMain() {
        this.mainWindow = createWindow({
            width: 1000,
            height: 600,
            webPreferences: {
                spellcheck: true,
            },
            autoHideMenuBar: true,
            icon: path.join(__dirname, "../../renderer/out/images/logo.png"),
        });

        this.mainWindow.maximize();
        this.mainWindow.loadURL(`http://localhost:${this.port}/`);

        if (isDev) {
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.on("close", (event) => {
                event.preventDefault();
                this.mainWindow?.hide();
            });
        }

        if (process.platform === "darwin") {
            app.on("before-quit", () => {
                app.exit();
            });
        }

        this.mainWindow.webContents.session.setSpellCheckerLanguages(["en-US"]);

        this.mainWindow.webContents.on("will-navigate", (_event, newUrl) => {
            console.log("will-navigate", newUrl);
        });

        this.mainWindow.webContents.on("context-menu", (_, params) => {
            const menu = new Menu();

            for (const suggestion of params.dictionarySuggestions) {
                menu.append(
                    new MenuItem({
                        label: suggestion,
                        click: () => this.mainWindow && this.mainWindow.webContents.replaceMisspelling(suggestion),
                    }),
                );
            }

            if (params.misspelledWord && this.mainWindow) {
                menu.append(
                    new MenuItem({
                        label: "Add to dictionary",
                        click: () =>
                            this.mainWindow && this.mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
                    }),
                );
            }

            menu.popup();
        });

        this.mainWindow.on("focus", () => {
            this.mainWindow?.webContents.send(IPC_MAIN_CHANNELS.WINDOW_FOCUSED);
        });
    }

    createChild(url: string, connectionName?: string) {
        this.childWindow = createWindow({
            width: 1000,
            height: 700,
            modal: true,
            show: false,
            autoHideMenuBar: true,
            parent: this.mainWindow as BrowserWindow | undefined,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: false,
                preload: path.join(__dirname, "../helpers/preload.js")
            },
        });

        // Handle failed page loads (like "App not found")
        const handleFailedLoad = () => {
            console.error(`Failed to load: ${url}`);
            this.childWindow?.close();
        };

        this.childWindow.webContents.on('did-fail-load', handleFailedLoad);

        this.childWindow.loadURL(url).catch(handleFailedLoad);

        this.childWindow.once("ready-to-show", () => {
            this.childWindow?.show();
        });

        this.childWindow.webContents.on("before-input-event", (event, input) => {
            const isEscape = input.key === "Escape";
            const isCmdOrCtrlW = (input.control || input.meta) && input.key?.toLowerCase() === "w";

            if (isEscape || isCmdOrCtrlW) {
                event.preventDefault();
                this.childWindow?.close();
            }
        });

        const cleanup = () => {
            if (this.childWindow) {
                this.childWindow.webContents.off('did-fail-load', handleFailedLoad);
                this.childWindow = null;
            }

            if (connectionName) {
                const channel = this.getRerenderChannelForConnection(connectionName);
                if (channel) {
                    this.mainWindow?.webContents.send(channel);
                }
            }
        };

        this.childWindow.on("closed", cleanup);
    }

    generateTray() {
        if (this.tray) return;

        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Activate",
                type: "normal",
                click: () => {
                    if (isDev) {
                        this.createMain();
                    } else {
                        this.mainWindow?.show();
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

        const trayIconPath = path.join(__dirname, "../../renderer/out/images/logo.png");

        this.tray = new Tray(trayIconPath);
        this.tray.setToolTip("Timetracker");
        this.tray.setContextMenu(contextMenu);

        this.tray.on("click", () => {
            if (isDev) {
                this.createMain();
            } else {
                this.mainWindow?.show();
            }
        });
    }

    destroyTray() {
        this.tray?.destroy();
        this.tray = null;
    }

    send(channel: string, ...args: unknown[]) {
        this.mainWindow?.webContents.send(channel, ...args);
    }

    loadUrl(url: string) {
        this.mainWindow?.loadURL(url);
    }
}

export const windowManager = new WindowManager();
