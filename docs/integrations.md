# Integrations

Shared OAuth / connection pattern for Google, Jira, Trello, Office 365, and Timetracker Website. Copy an existing provider rather than inventing a new flow.

Settings UI entry: `ConnectionsSection` → one `*Connection` component per provider.

## Shared auth flow

```text
[Settings Connection UI]
        │  send OPEN_CHILD_WINDOW("jira" | "google" | …)
        ▼
[Main] WindowManager.createChild(loginUrl, connectionName)
        │  user completes OAuth in modal child window
        ▼
[Child renderer] lands on /settings?code=…&state=…  (or hash token for Trello)
        │  closeWindowIfNeeded() in helpers/utils/utils.ts
        │  • writes AUTH_CODE / token to electron-store
        │  • send CHILD_WINDOW_CLOSED(connectionName)
        │  • window.close()
        ▼
[Main] emits *_SHOULD_RERENDER (also on child `closed` cleanup)
        ▼
[Main Connection UI] listener re-runs addUser / token exchange via invoke
        │  persists users blob in electron-store
        ▼
Ready for data APIs (issues, events, cards, bookings, …)
```

### Key files in the shared path

| Step | Where |
| --- | --- |
| Open child | `IpcHandler` → `OPEN_CHILD_WINDOW` → `getConnectionUrl()` |
| Login URL | `electron-src/services/*Service.ts` (+ `helpers/API/*`) |
| Capture redirect | `closeWindowIfNeeded()` in `renderer/src/helpers/utils/utils.ts` |
| Rerender fan-out | `CHILD_WINDOW_CLOSED` + `WindowManager.getRerenderChannelForConnection` |
| Connection UI | `renderer/src/components/<Provider>Connection/` |
| Renderer helpers | `renderer/src/helpers/utils/{google,jira,trello,office365}.ts` |
| Storage key names | `LOCAL_STORAGE_VARIABLES` in `renderer/src/helpers/constants.tsx` |

### Connection name strings (must match)

Used by `OPEN_CHILD_WINDOW`, `CHILD_WINDOW_CLOSED`, and `getConnectionUrl` / rerender mapping:

| `connectionName` | Rerender channel |
| --- | --- |
| `google` | `GOOGLE_SHOULD_RERENDER` |
| `jira` | `JIRA_SHOULD_RERENDER` |
| `trello` | `TRELLO_SHOULD_RERENDER` |
| `office365` | `OFFICE365_SHOULD_RERENDER` |
| `timetracker-website` | `TIMETRACKER_SHOULD_RERENDER` |

### Redirect / state fingerprints

`closeWindowIfNeeded` detects provider by query/hash:

| Provider | Detection |
| --- | --- |
| Office 365 | `code` + `state=office365code` → `OFFICE_365_AUTH_CODE` |
| Jira | `code` + `state=jiracode` → `JIRA_AUTH_CODE` |
| Google | `code` + `state=googlecalendarcode` → `GOOGLE_AUTH_CODE` |
| Trello | hash contains `token` → `TRELLO_AUTH_TOKEN` |
| Timetracker | `code` + `state=azure-base` → `TIMETRACKER_WEBSITE_CODE` |
| Azure extra | `state=azure-additional` → early return (no close) |

Google / Office 365 redirect URI is built as `http://localhost:{dynamicPort}/settings` in the service (port from `windowManager.getPort()`). Jira/Trello use a fixed custom-scheme redirect (`time-tracker://localhost/settings` from `.env`) so Atlassian/Trello consoles do not need a dynamic port. Main maps that scheme to the local HTTP server via `protocol.handle` in `electron-src/index.ts` — keep `NEXT_PUBLIC_PROTOCOL` and redirect URIs as **literal** env values (dotenv does not expand `${VAR}`).

Offline: connection UIs typically check `isOnline()` and may `APP_LOAD_OFFLINE_PAGE` instead of opening OAuth.

## Provider map

### Google Calendar

| | |
| --- | --- |
| Service / API | `services/googleService.ts`, `helpers/API/googleApi.ts` |
| UI | `components/GoogleConnection/` |
| Helpers / store | `helpers/utils/google.ts`, `store/googleCalendarStore.ts`, `store/googleEventsStore.ts`, `API/googleCalendarAPI.ts` |
| Auth storage | `GOOGLE_AUTH_CODE`, `GOOGLE_USERS` |
| UI flags | `SHOW_GOOGLE_EVENTS` |
| Env | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` |
| IPC | Mostly OAuth via child window; calendar data often via renderer/`API` + tokens — follow existing Google helpers |
| Notes | Redirect URI is port-dynamic (`/settings`). Scope: calendar.readonly + userinfo.profile (hardcoded in service). |

### Jira

| | |
| --- | --- |
| Service / API | `services/jiraService.ts`, `helpers/API/jiraApi.ts` |
| UI | `components/JiraConnection/` |
| Helpers | `helpers/utils/jira.ts` |
| Auth storage | `JIRA_AUTH_CODE`, `JIRA_USERS` |
| Env | `NEXT_PUBLIC_JIRA_CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`, `SCOPE` |
| IPC | `JIRA_LOGIN`, `JIRA_GET_TOKENS`, `JIRA_REFRESH_ACCESS_TOKEN`, `JIRA_GET_PROFILE`, `JIRA_GET_RESOURCES`, `JIRA_GET_ISSUES` |
| Notes | Good **reference copy** for OAuth code → tokens → profile → multi-user list. |

### Trello

| | |
| --- | --- |
| Service / API | `services/trelloService.ts`, `helpers/API/trelloApi.ts` |
| UI | `components/TrelloConnection/` |
| Helpers | `helpers/utils/trello.ts` |
| Auth storage | `TRELLO_AUTH_TOKEN`, `TRELLO_USER` |
| Env | `NEXT_PUBLIC_TRELLO_KEY`, `NEXT_PUBLIC_TRELLO_REDIRECT_URI` |
| IPC | `TRELLO_LOGIN`, `TRELLO_GET_PROFILE_INFO`, `TRELLO_GET_CARDS_OF_ALL_BOARDS` |
| Notes | Token returned in **URL hash**, not `?code=` — different from Atlassian/Google/Azure. |

### Office 365

| | |
| --- | --- |
| Service / API | `services/office365Service.ts`, `helpers/API/office365Api.ts` |
| UI | `components/Office365Connection/` (+ `Users.tsx`) |
| Helpers | `helpers/utils/office365.ts` |
| Auth storage | `OFFICE_365_AUTH_CODE`, `OFFICE_365_USERS` |
| UI flags | `SHOW_OFFICE_365_EVENTS` |
| Env | `NEXT_PUBLIC_OFFICE365_CLIENT_ID`, `CLIENT_SECRET`, `SCOPE` (`REDIRECT_URI` in `.env.demo` may be unused — service builds `localhost:{port}/settings`) |
| IPC | `OFFICE365_LOGIN`, `OFFICE365_GET_TOKENS`, `OFFICE365_REFRESH_ACCESS_TOKEN`, `OFFICE365_GET_PROFILE_INFO`, `OFFICE365_GET_TODAY_EVENTS` |
| Notes | Strong **reference copy** for Graph token refresh + events. |

### Timetracker Website (Azure)

| | |
| --- | --- |
| Service / API | `services/timetrackerService.ts`, `TimetrackerWebsiteApi.ts` |
| UI | `components/TimetrackerWebsiteConnection/` |
| Consumers | `Bookings`, `Calendar`, mentions/projects in track-time / textarea helpers |
| Auth storage | `TIMETRACKER_WEBSITE_CODE`, `TIMETRACKER_USER`, `CLIENTS_FOR_MENTIONS` |
| Env | Reuses Office 365 client id/secret/options; scopes overridden in `timetrackerService` |
| IPC | `AZURE_LOGIN_BASE` / `AZURE_LOGIN_ADDITIONAL`, `TIMETRACKER_GET_*` / `REFRESH_*` (tokens, holidays, vacations, projects, mentions, bookings), `TIMETRACKER_LOGIN` |
| Notes | Dual-token style (user-info + planner). Login connection name is `timetracker-website`. |

## Checklist: change an existing integration

1. Identify layer: UI only → `*Connection` / helpers; API shape → `helpers/API` + `services`; IPC surface → `constants.ts` + `IpcHandler`.
2. Keep `connectionName` and `state=` values in sync with `closeWindowIfNeeded` and `WindowManager` mappings.
3. Persist accounts with `ELECTRON_STORE_*` + `LOCAL_STORAGE_VARIABLES` (same keys the Connection component already uses).
4. Respect dynamic port for redirect-based providers (Google, Office 365, Azure).
5. Add/adjust tests with mocked `global.ipcRenderer` (see `JiraConnection` / `Office365Connection` tests).
6. Update `.env.demo` if new env keys are required.

## Checklist: add a new provider

1. Env keys in `renderer/.env.demo` (+ real `.env` locally).
2. `helpers/API/<provider>Api.ts` + `services/<provider>Service.ts`.
3. `getConnectionUrl` switch + rerender channel in `WindowManager` / `IpcHandler` `CHILD_WINDOW_CLOSED`.
4. New `IPC_MAIN_CHANNELS` + handlers.
5. Branch in `closeWindowIfNeeded` (unique `state=` or token detection).
6. `LOCAL_STORAGE_VARIABLES` for auth code + users blob.
7. `components/<Provider>Connection/` + register in `ConnectionsSection`.
8. Renderer helper module under `helpers/utils/`.
9. Tests + short row in this doc’s provider map.

Prefer cloning **Jira** (code + users list) or **Office 365** (refresh + Graph-style data) as the template.
