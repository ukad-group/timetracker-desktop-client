# IPC cheat sheet

All channel names live in `electron-src/helpers/constants.ts` (`IPC_MAIN_CHANNELS`). Import them in the renderer as `@electron/helpers/constants`.

## Which Electron API?

| Need | Renderer | Main |
| --- | --- | --- |
| Fire-and-forget / main → push later | `ipcRenderer.send` | `ipcMain.on` (+ optional `webContents.send`) |
| Sync get (legacy store) | `ipcRenderer.sendSync` | `ipcMain.on` + `event.returnValue` |
| Async request/response | `ipcRenderer.invoke` | `ipcMain.handle` |
| Listen for main events | `ipcRenderer.on` / `removeAllListeners` | `windowManager.send(...)` |

Zustand persistence uses **`invoke` + `STORAGE_*`**. Many connection tokens still use **`sendSync` + `ELECTRON_STORE_*`**. Prefer matching the pattern of neighboring code for that feature.

## Add a new channel (checklist)

1. Add a key to `IPC_MAIN_CHANNELS` in `electron-src/helpers/constants.ts`.
2. Register handler in `electron-src/managers/IpcHandler.ts` (or call into `services/`).
3. Call from renderer via `global.ipcRenderer` + the constant (never a raw string).
4. If UI must react to main-initiated events, `on` in a `useEffect` and clean up listeners.
5. Cover IPC-touching UI with a mocked `global.ipcRenderer` in tests.

## Channel map (by domain)

### Reports / filesystem

| Constant | Direction | Notes |
| --- | --- | --- |
| `APP_SELECT_FOLDER` | invoke | Native directory dialog |
| `APP_READ_DAY_REPORT` | invoke | `(folder, date) → string \| null` |
| `APP_WRITE_DAY_REPORT` | invoke | `(folder, date, report)` |
| `APP_DELETE_FILE` | invoke | Delete day file |
| `APP_CHECK_EXIST_REPORT` | invoke | Exists? |
| `APP_FIND_LAST_REPORT` | invoke | Prior content for copy-forward |
| `APP_FIND_LATEST_PROJECTS` / `QUARTER` / `MONTH` | invoke | Suggestion data from history |
| `START_FILE_WATCHER` / `START_FOLDER_WATCHER` | send | Chokidar |
| `STOP_PATH_WATCHER` | send | |
| `FILE_CHANGED` / `ANY_FILE_CHANGED` | main → renderer | Reload UI |
| `CHECK_DROPBOX_CONNECTION` | send | |

### Persistence

| Constant | API | Notes |
| --- | --- | --- |
| `STORAGE_GET` / `SET` / `DELETE` | handle | Zustand `getStorage()` |
| `ELECTRON_STORE_GET` / `SET` / `DELETE` / `CLEAR` | on (+ sync get) | Connection blobs, flags |
| `ELECTRON_SESSION_*` | on | In-memory session bag |

### Integrations (pattern)

Login usually: `OPEN_CHILD_WINDOW` with `"jira" | "google" | "trello" | "office365" | "timetracker-website"`, then provider `*_GET_TOKENS` / profile / data via `invoke`. After child closes: `CHILD_WINDOW_CLOSED` and `*_SHOULD_RERENDER`.

Provider prefixes: `jira:`, `trello:`, `office365:`, `timetracker:`, `azure:`, `google:` (rerender). Exact keys are in `constants.ts`.

### App shell / updates / errors

| Constant | Notes |
| --- | --- |
| `REDIRECT` | `shell.openExternal` |
| `GET_CURRENT_PORT` | Local server port |
| `BETA_CHANNEL` / `GET_CURRENT_VERSION` / `INSTALL_VERSION` | Updates |
| `UPDATE_AVAILABLE` / `DOWNLOADED` / `CURRENT_VERSION` | main → UI |
| `FRONTEND_ERROR` / `BACKEND_ERROR` / `RENDER_ERROR` | Error surfacing |
| `ANALYTICS_DATA` | Aptabase |
| `APP_LOAD_OFFLINE_PAGE` | Navigate offline |
| `WINDOW_FOCUSED` | main → UI |

Source of truth for names is always `constants.ts` + registrations in `IpcHandler.ts` — update this doc when you add a **new domain**, not for every key rename.
