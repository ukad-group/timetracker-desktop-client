# Development workflow

Practical local setup and pitfalls for daily work.

## First-time setup

```sh
npm install
cp renderer/.env.demo renderer/.env   # then fill OAuth values as needed
npm run dev
```

Integrations without credentials still run; connection buttons fail until `.env` is filled.

## Day-to-day

| Task | Command |
| --- | --- |
| Run app (hot reload Electron TS) | `npm run dev` |
| Typecheck both sides | `npm run type-check` |
| Lint / fix renderer | `npm run lint` / `npm run lint:fix` |
| Format renderer | `npm run format` |
| Unit tests | `npm test` |
| One-shot Electron after build | `npm run build-electron && electron .` |

After pulling TypeScript changes under `electron-src/`, wait for `tsc -w` to emit into `main/` (or run `npm run build-electron`) before expecting IPC changes in a running app.

## What you edit vs generated

| Edit | Do not edit / commit |
| --- | --- |
| `electron-src/**` | `main/**` (tsc output) |
| `renderer/src/**` | `renderer/out/**`, `renderer/.next/**` |
| `renderer/.env` (local only) | Real secrets in git |
| `package.json` scripts/deps | `dist/**` |

## Env vars

- File: `renderer/.env` (loaded by main via `dotenv`; `NEXT_PUBLIC_*` also baked into renderer builds).
- Template: `renderer/.env.demo`.
- Port is **dynamic** at runtime (`listen(0)`); do not hardcode `51432` in new code — use `GET_CURRENT_PORT` / `windowManager.getPort()` patterns already used by OAuth services.
- **Do not use `${VAR}` interpolation in `.env`.** Plain `dotenv` does not expand nested references. Write literal values (e.g. `NEXT_PUBLIC_PROTOCOL_SERVER_ADDRESS=time-tracker://localhost`). Broken expansion used to break Jira/Trello OAuth callbacks.

## Common failures

| Symptom | Likely cause |
| --- | --- |
| UI change missing | Wrong folder (`main/` instead of `electron-src/`, or stale Next cache) |
| IPC “does nothing” | Channel string typo; not registered in `IpcHandler`; Electron not restarted after main rebuild |
| OAuth redirect fails | Missing/wrong `NEXT_PUBLIC_*` in `.env`; port mismatch in redirect URI |
| Jira/Trello: auth window hangs ~1 min then closes | Custom-protocol rewrite failed (unexpanded `${…}` in `.env`, or scheme not privileged) — see `electron-src/index.ts` `toLocalHttpUrl` |
| Tests fail on `ipcRenderer` | Missing `global.ipcRenderer` mock — see `renderer/src/tests/mocks/electron.ts` |
| `contextIsolation` / Node APIs in renderer | Use IPC; preload only exposes `ipcRenderer` + `app` |

## Commits & PR hygiene

- Message prefix: `FEATURE:`, `ISSUE:`, or `NONE:` (see README).
- Pre-commit (Husky + lint-staged) runs Prettier + ESLint on `renderer/src/**/*.{ts,tsx}`.
- Do not commit `.env`, build artifacts, or lockfile noise unless the task requires dependency changes.
