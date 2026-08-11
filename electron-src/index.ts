import { app, protocol, net, globalShortcut } from "electron";
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

const VITE_DEV_PORT = 3000;

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

// Skip single-instance lock in dev: nodemon restarts race the lock and the new process
// exits cleanly, so Electron never comes back up.
const gotTheLock = isDev ? true : app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else if (!isDev) {
  app.on("second-instance", () => {
    if (windowManager.mainWindow) {
      if (windowManager.mainWindow.isMinimized()) windowManager.mainWindow.restore();
      windowManager.mainWindow.show();
      windowManager.mainWindow.focus();
    }
  });
}

let server: Server<typeof IncomingMessage, typeof ServerResponse>;
let serverPort = 0;

const getServerPort = () => serverPort;

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

const startApp = (port: number) => {
  if (!gotTheLock) return;

  serverPort = port;
  process.env.NEXT_PUBLIC_PORT = `${port}`;
  console.log(`> Ready on http://127.0.0.1:${port}`);

  windowManager.setPort(port);
  windowManager.createMain();
};

app.on("ready", async () => {
  if (!gotTheLock) return;

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
    startApp(VITE_DEV_PORT);
  } else {
    server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      await serveHandler(req, res, {
        public: path.join(app.getAppPath(), "renderer/dist"),
        rewrites: [{ source: "**", destination: "/index.html" }],
      });
    }).listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      startApp(address.port);
    });

    server.on("error", (error: Error) => {
      console.error("Server error:", error);
    });
  }

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
  app.quit();
});

app.on("before-quit", () => {
  windowManager.destroyTray();
});
