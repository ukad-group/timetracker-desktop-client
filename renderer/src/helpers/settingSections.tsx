import { lazy, Suspense } from "react";
import { SidebarNavItem } from "@/helpers/constants";
import { Loader } from "@/shared/Loader";

const SettingsSections = {
  [SidebarNavItem.Connections]: lazy(() => import("@/components/ConnectionsSection/ConnectionsSection")),
  [SidebarNavItem.Help]: lazy(() => import("@/components/HelpSection/HelpSection")),
  [SidebarNavItem.ReportsFolder]: lazy(() => import("@/components/ReportsFolderSection/ReportsFolderSection")),
  [SidebarNavItem.Layout]: lazy(() => import("@/components/LayoutSection/LayoutSection")),
  [SidebarNavItem.VersionSelect]: lazy(() => import("@/components/VersionSection/VersionSection")),
};

export const getSettingSection = (item: SidebarNavItem) => {
  const Section = SettingsSections[item];

  if (!Section) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader className="h-8 w-8" />
        </div>
      }
    >
      <Section />
    </Suspense>
  );
};
