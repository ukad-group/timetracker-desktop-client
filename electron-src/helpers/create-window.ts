import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { join } from "path";

export function createWindow(
  options: BrowserWindowConstructorOptions
): BrowserWindow {
  const state = {};

  const browserOptions: BrowserWindowConstructorOptions = {
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(__dirname, "preload.js"),
      ...options.webPreferences,
    },
    minWidth: 360,
    minHeight: 600,
  };
  const win = new BrowserWindow(browserOptions);

  return win;
}
