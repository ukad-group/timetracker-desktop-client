# Architecture

Agent-oriented overview of how the Timetracker desktop client is structured. For day-to-day coding rules, see [`AGENTS.md`](../AGENTS.md). Related: [`development.md`](development.md), [`ipc.md`](ipc.md), [`reports.md`](reports.md), [`integrations.md`](integrations.md), [`conventions.md`](conventions.md).

## High-level model

```text
┌─────────────────────────────────────────────────────────────┐
│ Electron main process (electron-src → main/)                │
│  • HTTP server (Next in dev, serve-handler on renderer/out)  │
│  • WindowManager / tray / child OAuth windows               │
│  • IpcHandler (FS, store, watchers, integrations)           │
│  • UpdateManager (electron-updater)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ IPC (preload → global.ipcRenderer)
┌───────────────────────────▼─────────────────────────────────┐
│ Renderer (Next.js static export in renderer/)               │
│  • Pages: index (tracker), settings, offline                │
│  • Zustand stores + React components                        │
│  • Calls main for FS, OAuth, persistence, updates           │
└─────────────────────────────────────────────────────────────┘
```

The app is a **single-instance** Electron client. The main process binds a local HTTP server on `127.0.0.1` with an **ephemeral port** (`listen(0)`), then loads `http://localhost:{port}/` in the BrowserWindow. Production serves the static export from `renderer/out`; development runs Next’s request handler against `renderer/`.

Environment variables are loaded from `renderer/.env` in the main process (`dotenv`). Many integration values are also exposed to the renderer as `NEXT_PUBLIC_*`.

## Process responsibilities

### Main (`electron-src/`)

| Module | Responsibility |
| --- | --- |
| `index.ts` | App lifecycle, Next/static server, protocol handler, shortcut registration, Aptabase init |
| `managers/WindowManager.ts` | Main window, child OAuth windows, tray (non-macOS), focus events, IPC fan-out helpers |
| `managers/IpcHandler.ts` | All `ipcMain` listeners: reports FS, chokidar watchers, electron-store, session bag, integrations |
| `managers/UpdateManager.ts` | Beta/stable update checks, download, quit-and-install |
| `services/*` | Provider-specific login URLs and API calls (Google, Jira, Trello, Office365, Timetracker) |
| `TimetrackerWebsiteApi.ts` | Timetracker website HTTP helpers (bookings, vacations, holidays, projects, mentions) |
| `helpers/preload.ts` | Injects `ipcRenderer` (and `app`) onto `global` for the renderer |
| `helpers/constants.ts` | Canonical `IPC_MAIN_CHANNELS` map (imported by renderer via `@electron/*`) |
| `helpers/fs.ts` / `datetime.ts` / `parseReportsInfo.ts` | Report pathing, folders, historical activity parsing |

Compiled output: TypeScript → `main/` (`outDir` in `electron-src/tsconfig.json`). Package entry: `"main": "main/index.js"`.

### Renderer (`renderer/`)

| Area | Responsibility |
| --- | --- |
| `pages/` | Routes only; `_app.tsx` disables SSR (`dynamic(..., { ssr: false })`) because Electron APIs are required |
| `components/` | Feature modules (calendar, activities, connections, track-time modal, settings sections, …) |
| `shared/` | Design-system-ish primitives (Button, Modal, Hint, Autocomplete, …) |
| `store/` | Zustand stores with Electron-backed persistence |
| `helpers/` | Domain utils, hooks (`useReportManagement`, editing history, …), shared constants |
| `API/` | Renderer-facing wrappers for some calendar/integration flows |
| `actions/editingActions/` | Pure editing action helpers + tests |

Next is configured with `output: "export"` (`next.config.js`), so there are **no Next API routes** in production — all privileged work stays in Electron.

## IPC contract

Channels are named strings centralized in `IPC_MAIN_CHANNELS`. Patterns in use:

- **Fire-and-forget**: `ipcRenderer.send` / `ipcMain.on` (analytics, redirects, most write ops)
- **Sync round-trip**: `sendSync` with `event.returnValue` (legacy electron-store get)
- **Async invoke**: `ipcRenderer.invoke` / `ipcMain.handle` (storage get/set/delete used by Zustand; several OAuth/token calls)

### Domain groups (non-exhaustive)

| Prefix / theme | Examples | Purpose |
| --- | --- | --- |
| `app:*` | `read-day-report`, `write-day-report`, `select-folder`, `find-*-projects` | Report files and folder picker |
| Watchers | `start-file-watcher`, `file-changed`, `any-file-changed` | Chokidar sync when reports change on disk |
| Storage | `storage:*`, `electron-store-*`, `electron-session-*` | Persist settings/tokens; in-memory session |
| Integrations | `jira:*`, `google:*`, `trello:*`, `office365:*`, `timetracker:*`, `azure:*` | OAuth + data fetch |
| UI sync | `*-should-rerender`, `child-window-closed`, `window-focused` | Rehydrate connection UI after OAuth child window |
| Updates | `update-available`, `downloaded`, `beta-channel`, `install-version` | Auto-update UX |
| Errors / analytics | `front-error`, `background-error`, `send-analytics-data` | Aptabase + error surfacing |

When adding a channel: update `constants.ts`, implement in `IpcHandler` (or a service it calls), then call from renderer — never invent ad-hoc channel strings.

## Data & persistence

### Time reports (source of truth on disk)

- User picks a reports folder (stored in Zustand `mainStore.reportsFolder`).
- One file per day: `yyyymmdd.txt`.
- Activity lines: `hh:mm - project - activity - description`.
- Day end / close marker: `hh:mm - !`.
- Main process reads/writes via IPC; folder/file watchers push `file-changed` / `any-file-changed` so the UI stays in sync with external editors (e.g. Dropbox).

### App settings & tokens

Two persistence styles coexist:

1. **Zustand + `STORAGE_*` IPC** — `getStorage()` in `renderer/src/store/utils.ts` backs `persist()` middleware (e.g. `mainStore`, theme, tutorial, update prefs).
2. **electron-store via `ELECTRON_STORE_*`** — many connection blobs and feature flags keyed by `LOCAL_STORAGE_VARIABLES` in `renderer/src/helpers/constants.tsx` (Google/Jira/Office365/Trello users, widget order, auth codes, …).

Treat both as “Electron-owned storage”; do not assume `localStorage` alone is enough inside Electron.

## UI composition

- **Main page** (`pages/index.tsx` → `MainPage`): date selector, activities (table or manual input), totals, calendar/bookings widgets, track-time modal; widget order is user-configurable.
- **Settings** (`pages/settings.tsx` → `SettingsPageContent`): sidebar sections from `SidebarNavItem` / `getSettingSection` (connections, help, layout, reports folder, version).
- **Offline** (`pages/offline.tsx`): loaded when main signals `app:load-offline-page`.

Styling is primarily Tailwind (`renderer/tailwind.config.js`) plus a few component CSS files. Theme light/dark is managed in `themeStore`.

## Integrations

OAuth typically opens a **child BrowserWindow** (`OPEN_CHILD_WINDOW`) to the provider URL built in `services/*`, then persists tokens/codes and emits a `*-should-rerender` channel so connection components refresh.

| Integration | Main service / API | Settings UI |
| --- | --- | --- |
| Google Calendar | `services/googleService`, `helpers/API/googleApi` | `GoogleConnection` |
| Jira | `services/jiraService`, `helpers/API/jiraApi` | `JiraConnection` |
| Trello | `services/trelloService`, `helpers/API/trelloApi` | `TrelloConnection` |
| Office 365 | `services/office365Service`, `helpers/API/office365Api` | `Office365Connection` |
| Timetracker website | `services/timetrackerService`, `TimetrackerWebsiteApi` | `TimetrackerWebsiteConnection` |

Credentials and redirect URIs come from `renderer/.env` (template: `.env.demo`).

## Build & release pipeline

```text
electron-src/*.ts  --tsc-->  main/*.js
renderer/          --next build (export)-->  renderer/out/**
electron-builder packages main + renderer/out (+ renderer/.env) → dist/
```

- Dev: `build-electron:watch` + `electron:watch` (nodemon on `main/`).
- CI: `.github/workflows/pullrequest.yml`, `release.yml` (tag-driven versioning / multi-OS artifacts).
- Analytics: Aptabase (`@aptabase/electron`) initialized in main.

## Testing topology

- Jest roots under `renderer/`; path aliases `@/` and `@electron/` mirrored in `jest.config.js`.
- Component tests live in colocated `__tests__/` folders.
- Electron globals are mocked (`global.ipcRenderer`) where UI code calls IPC.

## Extension guidelines

1. Prefer extending existing managers/services over growing `index.ts`.
2. Keep report path scheme and parsers/writers compatible with existing `timereport - yyyymmdd` files in the wild (see [`reports.md`](reports.md)).
3. Mirror folder conventions (`Component.tsx` + `types.ts` + `index.ts`) for new UI.
4. Document new IPC channels in `IPC_MAIN_CHANNELS` and keep names stable — they are a public contract between processes.
