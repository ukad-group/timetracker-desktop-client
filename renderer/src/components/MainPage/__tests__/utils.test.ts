import { parseReport, serializeReport } from "@/helpers/utils/reports";
import { toReportActivities } from "../utils";

describe("GIVEN MainPage/toReportActivities", () => {
  it("keeps the last work activity when it has no end time so save can persist it", () => {
    const input = "08:00 - hr - test\n13:00 - hr - test2\n";
    const parsed = parseReport(input)[0];
    const saved = serializeReport(toReportActivities(parsed));

    expect(saved).toBe(input);
  });

  it("drops a trailing end-of-day marker that has no end time", () => {
    const input = "08:00 - hr - test\n13:00 - \n";
    const activities = toReportActivities(parseReport(input)[0]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({ from: "08:00", to: "13:00", project: "hr" });
  });

  it("drops a trailing break that has no end time", () => {
    const activities = toReportActivities(parseReport("08:00 - hr - test\n13:00 - !\n")[0]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({ from: "08:00", to: "13:00", project: "hr" });
  });
});
