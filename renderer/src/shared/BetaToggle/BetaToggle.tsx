import { shallow } from "zustand/shallow";
import { useBetaStore } from "@/store/betaUpdatesStore";

const BetaToggle = () => {
  const [isBeta, setIsBeta] = useBetaStore((state) => [state.isBeta, state.setIsBeta], shallow);

  return (
    <div className="relative flex flex-col gap-4">
      <p className="text-sm text-gray-500 dark:text-dark-main">Select the version you want to download</p>
      <div className="ml-4 flex gap-4 items-center">
        <span className={`text-sm ${!isBeta && "font-medium"} text-gray-500 dark:text-dark-main`}>Stable</span>
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            value=""
            defaultChecked={isBeta}
            onClick={() => setIsBeta(!isBeta)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover"></div>
        </label>
        <span className={`text-sm ${isBeta && "font-medium"} text-gray-500 dark:text-dark-main`}>Beta</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-dark-main">
        To install, you need to restart the application (or reopen it from the tray)
      </p>
    </div>
  );
};

export default BetaToggle;
