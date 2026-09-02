import { autoUpdater, UpdateInfo } from "electron-updater";
import { windowManager } from "./WindowManager";
import { IPC_MAIN_CHANNELS } from "../helpers/constants";
import { app } from "electron";
import semver from "semver";

class UpdateManager {
    private updateStatus: null | "available" | "downloaded" = null;
    private updateVersion = "";

    constructor() {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.allowDowngrade = false;

        this.initListeners();
    }

    private setUpdateStatus(status: "available" | "downloaded", version: string) {
        this.updateStatus = status;
        this.updateVersion = version;
    }

    private initListeners() {
        autoUpdater.on("error", (e: Error, message?: string) => {
            windowManager.send(
                IPC_MAIN_CHANNELS.BACKEND_ERROR,
                "Updater error. An error was encountered during the download of the latest version. ",
                message || null,
            );
        });

        autoUpdater.on("update-available", (info: UpdateInfo) => {
            this.setUpdateStatus("available", info.version);

            const currentVersion = app.getVersion();
            const newVersion = info.version;

            const isUpdate = semver.compare(newVersion, currentVersion) === 1;

            if (!isUpdate) {
                return;
            }

            autoUpdater.downloadUpdate();
            windowManager.send(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE, true, info);
        });

        autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
            this.setUpdateStatus("downloaded", info.version);
            windowManager.send(IPC_MAIN_CHANNELS.DOWNLOADED, true, info);
        });
    }

    public checkForUpdates(isBeta: boolean) {
        // Temporary: macOS auto-update needs a paid Apple Developer identity
        // (code signing / notarization). Skip checks so the error modal stays quiet.
        if (process.platform === "darwin") {
            return;
        }

        try {
            autoUpdater.allowPrerelease = isBeta;
            autoUpdater.checkForUpdates();
        } catch (err) {
            console.log(err);
            windowManager.send(IPC_MAIN_CHANNELS.BACKEND_ERROR, "Updater error. Check for update", err);
        }
    }

    public quitAndInstall() {
        if (process.platform === "darwin") {
            return;
        }

        autoUpdater.quitAndInstall(true, true);
    }
}

export const updateManager = new UpdateManager();
