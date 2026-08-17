# Reports domain — business rules

Numbered product rules for on-disk time reports, parse/serialize, duration math, validation, and autocomplete history. These describe **current behavior** (including a few legacy quirks locked by tests).

Broader UI rules (Totals, Calendar, Bookings, form hooks) are out of scope here. File layout overview: [`reports.md`](reports.md).

## On-disk layout

| ID | Rule | Implementation |
| --- | --- | --- |
| **R1** | Path is `{folder}/{calendarYear}/week {WW}/timereport - {yyyymmdd}` with **no extension**. | `getPathFromDate` |
| **R2** | Folder year is the **calendar** year, even when the ISO week belongs to the next/previous ISO year (e.g. 31 Dec 2024 → `2024/week 01/...`). | `getPathFromDate` |
| **R3** | Week number is ISO (Thursday-based), zero-padded. | `getISOWeek`, `getPathFromDate` |
| **R4** | A file is a timereport only if the name matches `^timereport - \d{8}$`. | `isTimereportNameValid` (via `searchReadFiles`) |
| **R5** | A file in a week folder is ignored if the filename date’s ISO week ≠ that folder’s week. | `searchReadFiles` |

## Parse (`parseReport`)

| ID | Rule | Implementation |
| --- | --- | --- |
| **P1** | Empty / null / undefined file content → empty result. | `parseReport` |
| **P2** | Lines that do not start with `hh:mm` are **notes**, not activities (second tuple element). | `parseReport` |
| **P3** | Activity line: `hh:mm - project - activity - description` (separator is `" - "`). | `parseReport` |
| **P4** | Optional `yyyy-mm-dd` after the time is stripped and not stored. | `parseReport` |
| **P5** | Duration of row *n* is implied by row *n+1*’s start time (renderer: **milliseconds**). | `parseReport`, `calcDurationBetweenTimes` |
| **P6** | The last time-line has no `to` / `duration` until a following time line exists. | `parseReport` |
| **P7** | Empty remainder after time, or project starting with `!`, is a **break** (`isBreak: true`, not billable). | `parseReport` |
| **P8** | Project names are lowercased; description keeps case. | `parseReport` |
| **P9** | Replacement character `�` in description becomes `-`. | `parseReport` |
| **P10** | (legacy) Activity case and dash-splitting depend on “now” vs Aug 2016 cutovers. | `parseReport` |

## Serialize (`serializeReport`)

| ID | Rule | Implementation |
| --- | --- | --- |
| **S1** | Join fields with `" - "`. | `serializeReport` |
| **S2** | Activity `" "` serializes as a blank field (so extra dashes in the description survive a later parse). | `serializeReport` |
| **S3** | If the next row’s `from` ≠ current `to`, insert a break line `to - !`. | `serializeReport` |
| **S4** | Last row with a `to` writes the end-of-day marker `to - `. | `serializeReport` |
| **S5** | A mid-list empty registration gets a trailing `!`. | `serializeReport` |
| **S6** | For valid activities, `parse(serialize(x))` preserves `from`, project, activity, description, `isBreak`. | `serializeReport` + `parseReport` |

## Duration / time math

| ID | Rule | Implementation |
| --- | --- | --- |
| **D1** | Renderer `calcDurationBetweenTimes` → ms; missing `from` or `to` → `null`. | `reports.ts` |
| **D2** | Electron copy → **rounded decimal hours** (autocomplete history). | `electron-src/helpers/datetime.ts` |
| **D3** | No overnight wrap: `to` before `from` is a negative duration (fails validation). | `calcDurationBetweenTimes`, `validation` |
| **D4** | `formatDuration`: `0` → `"0h"`; sub-hour → `"Xm"`; exact hours → `"Xh"`; else `"Xh Ym"`. | `formatDuration` |
| **D5** | `formatDurationAsDecimals` truncates to 2 decimal hours + `h`. | `formatDurationAsDecimals` |
| **D6** | `addDurationToTime`: value with `m` **or** integer `> 24` is minutes; otherwise decimal hours. Clamp `00:00`–`23:59`. Integer `≤ 24` is hours (e.g. `"8"` → +8h). | `addDurationToTime` |
| **D7** | Registrations stay on one calendar day (`00:00`–`23:59`). | `addDurationToTime`, validation time bounds |

## Validation (`validation` / `checkIntersection`)

| ID | Rule | Implementation |
| --- | --- | --- |
| **V1** | Duration `≤ 0` → invalid (`"Negative or zero duration"`). | `validation` |
| **V2** | Project set but no `to` → `"The event has no end time"`. | `validation` |
| **V3** | Missing project → `"The project must be specified in the activity"`. | `validation` |
| **V4** | Hours outside 0–23 or minutes outside 0–59 → `"Impossible time"`. | `validation` |
| **V5** | Real project (not `!…`) with neither activity nor description → `"No activity or description"`. Breaks (`!` project) do **not** need activity/description. | `validation` |
| **V6** | Description starting with `!` appends `mistakes: " startsWith!"` but does **not** fail validation by itself. | `validation` |
| **V7** | (legacy) Overlap is checked only between row `i` and row `i-2`. Adjacent two-row overlap is **not** flagged. `checkIntersection` is inclusive (`from <= previousTo`). | `validation`, `checkIntersection` |

## History / autocomplete

| ID | Rule | Implementation |
| --- | --- | --- |
| **H1** | `parseReportsInfo` reads the **31 previous days**, not the selected day. Missing files are skipped. | `parseReportsInfo` |
| **H2** | Skip non-time lines, missing project, and `!…` breaks. | `parseReportsInfo` |
| **H3** | Maps always include default keys `internal` and `hr`. | `parseReportsInfo` |
| **H4** | 2-part line → empty activity/description; 3-part → description only; 4-part → both. | `parseReportsInfo` |
| **H5** | No next start time → duration `0` (Electron hours). | `parseReportsInfo` |
| **H6** | `addSuggestions` is recency-ordered by trimmed project; skips breaks / missing project / neither activity nor description; reused values move to the front. | `addSuggestions` |

## Test mapping

Business unit tests live next to the helpers (no UI / real FS / Electron process). Connection smoke and RTL component tests are **not** business-rule tests.

### Finding tests by rule ID

Each covered test is tagged with a comment immediately above it:

```typescript
// @rule P1
test("should return empty collection when null or empty string is passed", () => {
```

**In the IDE:** use project search (Ctrl+Shift+F) for `@rule P1` (or `@rule V7`, etc.).

**On the command line:**

```sh
rg "@rule P1" renderer/src electron-src
```

**Run tests for one rule** (Jest matches the test name on the next line):

```sh
npx jest --testPathPatterns=reports.test -t "empty collection"
```

The table below lists every rule, its test file, and the exact test case name(s).

| Rule | File | Test case(s) |
| --- | --- | --- |
| **R1** | `electron-src/helpers/__tests__/datetime.test.ts` | `builds the reports path with a zero-padded ISO week` |
| **R2** | `datetime.test.ts` | `uses the calendar year even when the ISO week belongs to the next year` |
| **R3** | `datetime.test.ts` | `returns the ISO week for a mid-week date`; `returns week 1 for a date in the week containing 1 January`; `returns week 1 for 31 December when that day belongs to the next ISO year`; `returns week 53 for 1 January when that day belongs to the previous ISO year`; `builds the reports path with a zero-padded ISO week` |
| **R4** | `electron-src/helpers/__tests__/fs.test.ts` | `reads valid timereport files for the requested year and week`; `skips filenames with a .txt extension`; `skips filenames that are not timereport - yyyymmdd` |
| **R5** | `fs.test.ts` | `skips files whose ISO week does not match the query week` |
| **P1** | `renderer/src/helpers/utils/__tests__/reports.test.ts` | `should return empty collection when null or empty string is passed` |
| **P2** | `reports.test.ts` | `should skip lines which are not started from time pattern hh:mm`; `should collect non-time lines as notes on the second tuple element` |
| **P3** | `reports.test.ts` | `should extract [project name], [activity name] and [description] from registration`; `should support spaces in [project name], [activity name] and [description]`; `should extract [project name] when [activity] and [description] are not set`; `should extract [project name] and [description] when [activity] is not set` |
| **P4** | `reports.test.ts` | `should extract [project name], [activity name] and [description] from registration`; `should parse time` |
| **P5** | `reports.test.ts` | `should parse time`; `should set duration in ms from the next start time and leave the last row open-ended` |
| **P6** | `reports.test.ts` | `should set duration in ms from the next start time and leave the last row open-ended` |
| **P7** | `reports.test.ts` | `should set isBreak to true when line stars from !`; `should set isBreak to true when remainder after time is empty` |
| **P8** | `reports.test.ts` | `should lowercase project name`; `should keep activity name case sensitive after 26 Aug 2016`; `should keep description case sensitive` |
| **P9** | `reports.test.ts` | `it should undefined symbols in description not show in description` |
| **P10** | `reports.test.ts` | `parser should recognize 3rd dash surrounded by spaces as separator after 23 Aug 2016`; `parser should recognize 3rd dash as separator before 23 Aug 2016`; `should lowercase activity name before 26 Aug 2016` |
| **S1** | `reports.test.ts` | `should return serialized report` |
| **S2** | `reports.test.ts` | `should serialize activity of a single space as a blank field` |
| **S3** | `reports.test.ts` | `should insert a break line when next from differs from current to` |
| **S4** | `reports.test.ts` | `should return serialized report`; `should return 12:30 - ! when [to] = "12:30"` |
| **S5** | `reports.test.ts` | `should append ! to a mid-list empty registration` |
| **S6** | `reports.test.ts` | `should return same as report` (×3); `preserves from, project, activity, description and isBreak` |
| **D1** | `reports.test.ts` | `should return null when [from] or/and [to] properties are undefined`; `should return result of [to] - [from] in milliseconds`; `should return result [to] - [from] in milliseconds when hour = 0` |
| **D2** | `datetime.test.ts` | `returns duration in decimal hours`; `rounds duration to two decimal hours` |
| **D3** | `reports.test.ts` | `should return a negative duration when to is before from (no overnight wrap)` |
| **D4** | `reports.test.ts` | `should return 0h when [ms] = 0`; `should return 0m when [ms] < 1m`; `should return minutes when [ms] < 1h`; `should return exact hours without minutes`; `should return time in format '12h 50m' when [ms] > 1h` |
| **D5** | `reports.test.ts` | `formats 90 minutes as 1.5h`; `returns an empty string when ms is undefined` |
| **D6** | `reports.test.ts` | `adds a decimal hour duration`; `adds a duration in minutes when the value includes m`; `treats an integer greater than 24 as minutes`; `treats an integer less than or equal to 24 as hours` |
| **D7** | `reports.test.ts` | `clamps the result to 23:59`; `clamps a negative result to 00:00` |
| **V1** | `reports.test.ts` | `should fail validation when [duration] = 0`; `should fail validation when [duration] < 0` |
| **V2** | `reports.test.ts` | `should fail validation when is [project] and no [to] property` |
| **V3** | `reports.test.ts` | `should fail validation when there no [project] and is [to] property` |
| **V4** | `reports.test.ts` | `should fail validation when time is impossible` |
| **V5** | `reports.test.ts` | `should fail validation when project is set but activity and description are missing`; `does not require activity or description for a break project` |
| **V6** | `reports.test.ts` | `should add mistake when [description] starts with "!"` |
| **V7** | `reports.test.ts` | `does not flag an intersection when there are only two overlapping rows`; `flags an intersection between the current row and the row two steps back`; `should return true when times are equal (inclusive overlap)` |
| **H1** | `electron-src/helpers/__tests__/parseReportsInfo.test.ts` | `skips missing files and still reads the 31 previous days`; `does not include activities from the selected day's report even if the file exists` |
| **H2** | `parseReportsInfo.test.ts` | `parses 2-part, 3-part and 4-part lines and skips breaks` |
| **H3** | `parseReportsInfo.test.ts` | `keeps the default internal and hr keys when no reports exist` |
| **H4** | `parseReportsInfo.test.ts` | `parses 2-part, 3-part and 4-part lines and skips breaks` |
| **H5** | `parseReportsInfo.test.ts` | `uses 0 duration when the next line has no start time` |
| **H6** | `reports.test.ts` | `does nothing when latest description map is empty`; `skips breaks and activities without a project`; `adds a new project when maps already have other keys`; `unshifts a new description and activity in front of existing ones`; `moves an existing description and activity to the front` |
