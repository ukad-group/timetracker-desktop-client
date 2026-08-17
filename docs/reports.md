# Time reports domain

Core product data: plain-text day reports on disk. UI parses/serializes; Electron reads/writes and watches files.

## On-disk layout

Path helper: `getPathFromDate` in `electron-src/helpers/datetime.ts`.

```text
{reportsFolder}/
  {year}/
    week {WW}/          # ISO week, zero-padded
      timereport - {yyyymmdd}
```

Example: `…/2026/week 06/timereport - 20260207`

There is **no** `.txt` extension in the path builder. Always use `getPathFromDate` / IPC — do not reinvent path strings in the renderer.

Folder is chosen by the user (`APP_SELECT_FOLDER`) and stored in Zustand `mainStore.reportsFolder`.

## Line format

```text
09:00 - ProjectName - activity - description of work
10:30 - OtherProject - meeting - sync
12:00 - !
```

| Piece | Meaning |
| --- | --- |
| `hh:mm` | Start time of the registration |
| `project` | Project name (required for real work) |
| `activity` | Optional activity label |
| `description` | Optional free text |
| `hh:mm - !` (or empty / `!…` project) | Break / day marker — not billable work |

Duration of a row is implied by the **next** row’s start time (or end marker). Non-time lines are treated as notes/comments by the renderer parser.

## Code ownership

| Concern | Where |
| --- | --- |
| Path + ISO week | `electron-src/helpers/datetime.ts` |
| FS read/write/delete/exists | IPC in `IpcHandler` (`APP_*_DAY_REPORT`, etc.) |
| Watch external edits | `START_FILE_WATCHER` / `FILE_CHANGED` |
| Parse file → activities UI model | `parseReport` in `renderer/src/helpers/utils/reports.ts` |
| Activities → file text | `serializeReport` in same file |
| Validation / intersections | `validation`, `checkIntersection` in `reports.ts` |
| History for autocomplete | `parseReportsInfo` (main) + `APP_FIND_*_PROJECTS` |

## Safe change rules

1. **Backward compatibility** — users have years of files in this layout; do not change path scheme or separators lightly.
2. **Write only via IPC** — renderer must not assume Node `fs`.
3. **Round-trip** — after changing `parseReport` / `serializeReport`, keep parse(serialize(x)) stable for valid activities; add/adjust unit tests under `helpers/utils/__tests__/`.
4. **Watchers** — if you change when files are written, ensure watcher start/stop still matches the selected date/folder lifecycle on the main page.

## Related UI entry points

- Day editing: `ManualInputForm`, `ActivitiesTable`, `TrackTimeModal`
- Totals: `Totals` (aggregates parsed activities)
- Folder setting: `ReportsFolderSection` / `FolderSelector`

## Business rules

Numbered parse/serialize/path/validation rules and their unit-test mapping: [`business-rules.md`](business-rules.md).
