# Coding conventions

Patterns to copy so agents match existing code.

## Folder layout (UI)

Feature component:

```text
renderer/src/components/FooBar/
  FooBar.tsx
  types.ts          # props / local types
  index.ts          # export { default as FooBar } from "./FooBar"
  utils.ts          # optional
  constants.ts      # optional
  __tests__/FooBar.test.tsx
```

Shared primitives live under `renderer/src/shared/` with the same shape.

- Pages stay thin: `pages/*.tsx` compose components.
- Settings sections: add component, then wire into `SidebarNavItem` / `getSettingSection` in `renderer/src/helpers/constants.tsx`.

## Imports

```ts
import { Button } from "@/shared/Button";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
```

- `@/*` → `renderer/src/*`
- `@electron/*` → `electron-src/*` (shared constants/types only; do not import main-only Node modules into renderer bundles)

## State

- **Zustand** for app UI state that should persist (`store/*.ts` + `store/types.ts`). Persistence: `persist(..., { storage: createJSONStorage(() => getStorage()) })`.
- **electron-store** (`ELECTRON_STORE_*` + `LOCAL_STORAGE_VARIABLES`) for connection accounts, auth codes, widget order, and similar blobs.
- Prefer extending an existing store over adding a new global store for a one-off flag.

## Styling

- Tailwind utility classes first.
- Component-specific CSS only when needed (e.g. FullCalendar); place next to the component.
- Global styles: `renderer/src/styles/global.css`.
- Reuse `shared/` controls (`Button`, `Modal`, `TextField`, …) before inventing new primitives.

## Main process

- New native/IO behavior → `IpcHandler` + optional `services/` module.
- Keep `index.ts` limited to lifecycle/server/window bootstrap.
- Never hand-edit `main/`.

## Tests

- Colocate `__tests__/` or use `*.test.ts(x)`.
- Reuse `renderer/src/tests/mocks/electron.ts` for `global.ipcRenderer`.
- Mock `electron` module when imports pull it in; set `global.ipcRenderer` before render.
- Prefer Testing Library queries (`getByRole`, `getByText`) like existing connection tests.

## Integrations

Full flow, provider map, and add/change checklists: [`integrations.md`](integrations.md).

When touching a connection: keep `connectionName` / redirect `state=` / storage keys aligned; copy Jira or Office365 rather than a new OAuth shape.
