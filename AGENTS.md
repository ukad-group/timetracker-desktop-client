# Agent Guide — Timetracker Desktop Client

Cross-platform Electron desktop app for time-tracking reports. Use this file as the default orientation for coding agents. Deeper design notes live in [`docs/architecture.md`](docs/architecture.md).

## Stack

| Layer | Tech |
| --- | --- |
| Desktop shell | Electron (`electron-src/` → compiles to `main/`) |
| UI | Vite + React 19 + react-router, Tailwind CSS |
| State | Zustand (persisted via Electron storage IPC) |
| Language | TypeScript (strict mode off; `noImplicitAny: false`) |
| Tests | Jest + Testing Library (`renderer/` roots) |
| Packaging | electron-builder → `dist/` |

Node `>=18`, npm `>=9`. See `.nvmrc` for the pinned major.

## Repo map (where to edit)

| Path | Role | Notes |
| --- | --- | --- |
| `electron-src/` | Main process source | Edit here. Output is `main/` — **do not hand-edit `main/`** |
| `electron-src/managers/` | `WindowManager`, `IpcHandler`, `UpdateManager` | IPC registration and windows |
| `electron-src/services/` | OAuth / API services (Google, Jira, Trello, Office365, Timetracker) | Called from IPC handlers |
| `electron-src/helpers/` | FS, datetime, report parsing, preload, `IPC_MAIN_CHANNELS` | Shared constants used by renderer via `@electron/*` |
| `renderer/src/routes/` | Routes: `/`, `/settings`, `/offline` (via `App.tsx` + react-router) |
| `renderer/src/components/` | Feature UI | Folder = component; usually `Component.tsx`, `types.ts`, `index.ts` |
| `renderer/src/shared/` | Reusable UI primitives | Same folder convention |
| `renderer/src/store/` | Zustand stores | Persist through `getStorage()` → IPC |
| `renderer/src/helpers/` | Hooks, utils, interfaces | Report/datetime/integration helpers |
| `renderer/src/API/` | Renderer-side API helpers | |
| `renderer/.env` | Secrets / OAuth clients | Copy from `.env.demo`; never commit real secrets |
| `docs/` | Agent-oriented documentation | See [Further reading](#further-reading) |

## Commands

```sh
npm run dev              # Vite renderer + watch Electron TS + Electron
npm run build            # vite build renderer + tsc electron-src
npm run type-check       # both tsconfigs
npm run lint / lint:fix # ESLint on renderer/src
npm run format           # Prettier on renderer/src
npm test / coverage      # Jest
npm run dist             # clean + build + electron-builder (current OS)
```

## Hard rules for agents

1. **Main vs renderer boundary**
   - File system, OAuth token exchange, tray, updates, and native dialogs belong in `electron-src`.
   - UI and local presentation logic belong in `renderer`.
   - Cross the boundary only via IPC channels listed in `electron-src/helpers/constants.ts` (`IPC_MAIN_CHANNELS`).

2. **IPC**
   - Add new channels to `IPC_MAIN_CHANNELS` first, then wire `IpcHandler` and the renderer caller.
   - Preload exposes `global.ipcRenderer` (`contextIsolation: false`, `nodeIntegration: false`).
   - Prefer existing `send` / `sendSync` / `invoke` patterns already used for that feature area.

3. **Imports**
   - Renderer: `@/*` → `renderer/src/*`, `@electron/*` → `electron-src/*`.
   - Prefer importing channel constants from `@electron/helpers/constants`, not string literals.

4. **Do not commit or rewrite**
   - `main/`, `renderer/dist/`, `dist/`, `node_modules/`, real `.env` values.
   - Avoid drive-by refactors outside the requested task.

5. **Component convention**
   - Colocate `types.ts`, optional `utils.ts` / `constants.ts`, and barrel `index.ts`.
   - Shared UI goes under `renderer/src/shared/`; feature screens under `components/`.

6. **Reports domain**
   - Path: `{folder}/{year}/week {WW}/timereport - {yyyymmdd}` via `getPathFromDate`.
   - Line format: `hh:mm - project - activity - description`; end marker `hh:mm - !`.
   - Details: [`docs/reports.md`](docs/reports.md).

7. **Commits** (when asked to commit)
   - Pattern: `FEATURE | ISSUE | NONE: short message`
   - Lint-staged formats/lints `renderer/src/**/*.{ts,tsx}` on commit.

8. **Tests**
   - Place under `__tests__/` next to the unit, or `*.test.ts(x)`.
   - Mock `global.ipcRenderer` in Electron-touching UI tests (see existing connection tests).

## Typical change recipes

| Goal | Touch |
| --- | --- |
| New settings UI section | `renderer/src/components/…`, register in settings sidebar constants |
| New IPC + native behavior | `constants.ts` → `IpcHandler.ts` → optional `services/` → renderer caller |
| New Zustand field | `store/types.ts` + relevant store; persistence already goes through IPC storage |
| New integration | See [`docs/integrations.md`](docs/integrations.md); copy Jira or Office365 |
| Styling | Tailwind utility classes; global CSS in `renderer/src/styles/` |

## Further reading

| Doc | Use when |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Need the process model / data flow |
| [`docs/development.md`](docs/development.md) | Setup, commands, local pitfalls |
| [`docs/ipc.md`](docs/ipc.md) | Adding or calling IPC channels |
| [`docs/reports.md`](docs/reports.md) | Changing report files, parse/serialize |
| [`docs/business-rules.md`](docs/business-rules.md) | Numbered reports-domain rules + test mapping |
| [`docs/integrations.md`](docs/integrations.md) | OAuth connections (Google, Jira, Trello, …) |
| [`docs/conventions.md`](docs/conventions.md) | Matching UI/store/test patterns |
| [`README.md`](README.md) | Human install / build / release |
