import { app, protocol, net, globalShortcut } from "electron";
import next from "next";
import { parse } from "url";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import path from "path";
import serveHandler from "serve-handler";
import isDev from "electron-is-dev";
import { initialize } from "@aptabase/electron/main";

import { windowManager } from "./managers/WindowManager";
import { registerIpcHandlers } from "./managers/IpcHandler";

initialize("A-EU-9361517871");

// Register all IPC listeners
registerIpcHandlers();

const gotTheLock = app.requestSingleInstanceLock();
let server: Server<typeof IncomingMessage, typeof ServerResponse>;

const getServerPort = () => {
  const address = server?.address() as AddressInfo;
  return address?.port ? address.port : 0;
};

const getServerAddress = () => {
  return process.env.NEXT_PUBLIC_SERVER_ADDRESS?.replace(
    process.env.NEXT_PUBLIC_PORT_REPLACE_TOKEN_NAME || "",
    getServerPort().toString(),
  ) || "";
};

app.on("ready", async () => {
  const nextApp = next({
    dev: isDev,
    dir: app.getAppPath() + "/renderer",
  });
  const requestHandler = nextApp.getRequestHandler();

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

  if (isDev) {
    await nextApp.prepare();
  }

  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (isDev) {
      const parsedUrl = parse(req.url, true);
      requestHandler(req, res, parsedUrl);
    } else {
      await serveHandler(req, res, {
        public: path.join(app.getAppPath(), "renderer/out"),
      });
    }
  }).listen(0, "127.0.0.1", () => {
    const port = getServerPort();
    process.env.NEXT_PUBLIC_PORT = `${port}`;
    console.log(`> Ready on http://127.0.0.1:${port}`);

    // Set port in WindowManager so services can use it
    windowManager.setPort(port);

    if (!gotTheLock) {
      app.quit();
    } else {
      app.on("second-instance", () => {
        if (windowManager.mainWindow) {
          if (windowManager.mainWindow.isMinimized()) windowManager.mainWindow.restore();
          windowManager.mainWindow.show();
          windowManager.mainWindow.focus();
        }
      });
      windowManager.createMain();
    }
  });

  server.on("error", (error: Error) => {
    console.error("Server error:", error);
    // Simplified error handling - WindowManager might not be ready if server fails immediately?
    // But we only show message box if mainWindow exists.
    // In original code, it generated window inside listening.
    // Here we generate window inside listening too.
  });

  // App Ready continuation
  app.whenReady().then(() => {
    if (process.env.NEXT_PUBLIC_PROTOCOL) {
      protocol.handle(process.env.NEXT_PUBLIC_PROTOCOL as string, (request: Request) => {
        const localUrl = request.url.replace(
          process.env.NEXT_PUBLIC_PROTOCOL_SERVER_ADDRESS || "",
          getServerAddress(),
        );
        return net.fetch(localUrl);
      });
    }

    if (process.platform !== "darwin") {
      try {
        windowManager.generateTray();
      } catch (err) {
        console.log(err);
      }
    }
  });
});

app.on("activate", () => {
  if (process.platform === "darwin") windowManager.mainWindow?.show();
});

app.on("window-all-closed", () => {
  // Original code had app.quit() here.
  app.quit();
});

app.on("before-quit", () => {
  windowManager.destroyTray();
});
