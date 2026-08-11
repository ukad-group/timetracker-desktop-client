import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { SignalSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useThemeStore } from "@/store/themeStore";

export function OfflinePage() {
  const [theme] = useThemeStore((state) => [state.theme, state.setTheme], shallow);
  const [isOSDarkTheme, setIsOSDarkTheme] = useState(true);
  function handleThemeChange(e) {
    if (e.matches) {
      setIsOSDarkTheme(true);
    } else {
      setIsOSDarkTheme(false);
    }
  }

  useEffect(() => {
    window.matchMedia("(prefers-color-scheme: dark)").addListener(handleThemeChange);

    document.body.className = (theme.os && isOSDarkTheme) || theme.custom === "dark" ? "dark" : "light";
  }, [theme, isOSDarkTheme]);

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-dark-back flex flex-col justify-center items-center">
      <SignalSlashIcon className="w-40 h-40 text-gray-400" />
      <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-dark-heading">No internet connection</h2>
      <Link
        to="/settings"
        className="px-4 py-2 inline-flex items-center gap-2 text-gray-500 dark:text-dark-main font-medium rounded-md border shadow-sm dark:border-dark-form-border hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to settings page
      </Link>
    </div>
  );
}
