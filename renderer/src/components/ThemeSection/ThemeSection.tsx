import { useThemeStore } from "../../store/themeStore";
import { shallow } from "zustand/shallow";
import clsx from "clsx";

const ThemeSection = () => {
  const [theme, setTheme] = useThemeStore(
    (state) => [state.theme, state.setTheme],
    shallow
  );

  return (
    <section className="h-full">
      <div className="overflow-y-auto h-full bg-white sm:rounded-lg p-2 flex flex-col gap-6 dark:bg-dark-container">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">
            Theme
          </span>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="deviceTheme"
                aria-describedby="comments-description"
                defaultChecked={theme.os}
                name="deviceTheme"
                onClick={() =>
                  setTheme({ custom: theme.custom, os: !theme.os })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover"></div>
              <span className="ml-3 text-sm font-medium text-gray-500 dark:text-dark-main">
                Use device theme
              </span>
            </label>
          </div>
          <div className="flex items-center">
            <label
              className={clsx(
                "relative inline-flex items-center cursor-pointer",
                {
                  "opacity-10 cursor-auto": theme.os,
                }
              )}
            >
              <input
                type="checkbox"
                value=""
                defaultChecked={theme.custom === "dark"}
                disabled={theme.os}
                onClick={() =>
                  setTheme({
                    custom: theme.custom === "light" ? "dark" : "light",
                    os: theme.os,
                  })
                }
                className="sr-only peer"
              />
              <div
                className={clsx(
                  "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover",
                  {
                    "cursor-default after:bg-gray-200 after:border-gray-300 peer-checked:after:border-gray-300 dark:after:bg-gray-500 dark:after:border-gray-600 dark:peer-checked:after:border-gray-600 peer-checked:bg-gray-300 dark:peer-checked:bg-gray-600":
                    theme.os,
                  }
                )}
              />
              <span
                className={clsx(
                  "ml-3 text-sm font-medium text-gray-500 dark:text-dark-main",
                  { "cursor-default": theme.os }
                )}
              >
                Toggle to {theme.custom === "light" ? "dark" : "light"} theme
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThemeSection;