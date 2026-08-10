import { app, protocol, net, globalShortcut } from "electron";
import next from "next";
import { parse } from "url";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import path from "path";
import serveHandler from "serve-handler";
import isDev from "electron-is-dev";
import { initialize } from "@aptabase/electron/main";
import dotenv from "dotenv";

import { windowManager } from "./managers/WindowManager";
import { registerIpcHandlers } from "./managers/IpcHandler";

initialize("A-EU-9361517871");

// Load environment variables from .env file
dotenv.config({ path: path.join(app.getAppPath(), "renderer", ".env") });

// Jira/Trello OAuth redirects to this custom scheme. Must be registered before app ready
// so the callback page can load and run renderer JS (closeWindowIfNeeded).
const customProtocol = process.env.NEXT_PUBLIC_PROTOCOL;
if (customProtocol) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: customProtocol,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        bypassCSP: true,
      },
    },
  ]);
}

// Register all IPC listeners
registerIpcHandlers();

const gotTheLock = app.requestSingleInstanceLock();
let server: Server<typeof IncomingMessage, typeof ServerResponse>;

const getServerPort = () => {
  const address = server?.address() as AddressInfo;
  return address?.port ? address.port : 0;
};

/** Map OAuth custom-protocol callbacks to the local HTTP server. Avoids dotenv ${} expansion. */
const toLocalHttpUrl = (requestUrl: string) => {
  if (!customProtocol) return requestUrl;

  const protocolOrigin = `${customProtocol}://localhost`;
  const httpOrigin = `http://localhost:${getServerPort()}`;

  if (!requestUrl.startsWith(protocolOrigin)) {
    console.error("Unexpected custom-protocol URL:", requestUrl);
    return requestUrl;
  }

  return requestUrl.replace(protocolOrigin, httpOrigin);
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

  if (customProtocol) {
    protocol.handle(customProtocol, (request: Request) => {
      const localUrl = toLocalHttpUrl(request.url);
      console.log("Custom protocol redirect:", request.url, "->", localUrl);
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
