import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/routes/HomePage";
import { SettingsPage } from "@/routes/SettingsPage";
import { OfflinePage } from "@/routes/OfflinePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/offline" element={<OfflinePage />} />
    </Routes>
  );
}
