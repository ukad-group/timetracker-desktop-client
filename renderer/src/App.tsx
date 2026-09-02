import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/routes/HomePage";
import { Loader } from "@/shared/Loader";

const SettingsPage = lazy(() => import("@/routes/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const OfflinePage = lazy(() => import("@/routes/OfflinePage").then((m) => ({ default: m.OfflinePage })));

export function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-dark-back">
          <Loader className="h-8 w-8" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/offline" element={<OfflinePage />} />
      </Routes>
    </Suspense>
  );
}
