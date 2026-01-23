import { useState } from "react";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";

const HelpSection = () => {
  const [disabled, setDisabled] = useState(false);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);

  const restartTutorial = () => {
    for (let key in progress) {
      if (!progress.hasOwnProperty(key) || key === "skipAll") continue;
      const hintArray = progress[key];
      if (key.split("").slice(-10).join("") === "Conditions") {
        for (let i = 0; i < hintArray.length; i++) {
          hintArray[i] = false;
        }
      }
      hintArray[0] = false;
    }
    setDisabled(true);
    setProgress(progress);
  };

  return (
    <section className="h-full">
      <div className="overflow-y-auto h-full bg-white sm:rounded-lg p-2 flex flex-col gap-6 dark:bg-dark-container">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Tutorial</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <button
              disabled={disabled}
              onClick={restartTutorial}
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 gap-2 text-sm font-medium border rounded-md shadow-sm dark:border-dark-form-back bg-blue-600 text-white dark:bg-dark-button-back hover:bg-blue-700 hover:dark:bg-dark-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:dark:border-focus-border focus:dark:ring-focus-border disabled:pointer-events-none disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:dark:border-dark-border "
            >
              Restart tutorial
            </button>
          </label>
          <div className="flex items-center my-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                defaultChecked={progress["skipAll"][0]}
                onClick={() => {
                  progress["skipAll"] = [!progress["skipAll"][0]];
                  setProgress(progress);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover"></div>
              <span className="ml-3 text-sm font-medium text-gray-500 dark:text-dark-main">
                Toggle to {progress["skipAll"][0] ? "continue" : "stop"} tutorial
              </span>
            </label>
          </div>

          <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Shortcuts</span>
          <div className="px-4 text-gray-500 dark:text-dark-main">
            <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-dark-heading">Global Shortcuts</h2>
            <ul className="list-disc pl-4">
              <li>
                <strong className="mr-2">Ctrl + Q:</strong> Close the app
              </li>
              <li>
                <strong className="mr-2">Ctrl + Z:</strong> Undo changes
              </li>
              <li>
                <strong className="mr-2">Ctrl + Y | Ctrl + Shift + Z:</strong> Redo changes
              </li>
              <li>
                <strong className="mr-2">Ctrl + Shift + [+]:</strong> Zoom in
              </li>
              <li>
                <strong className="mr-2">Ctrl + [-]:</strong> Zoom out
              </li>
              <li>
                <strong className="mr-2">Tab:</strong> Move forward (Next)
              </li>
              <li>
                <strong className="mr-2">Shift + Tab:</strong> Move backward (Previous)
              </li>
            </ul>
            <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-dark-heading">Main Screen</h2>
            <ul className="list-disc pl-4">
              <li>
                <strong className="mr-2">Ctrl + Space:</strong> Add a new registration
              </li>
              <li>
                <strong className="mr-2">Ctrl + ArrowUp:</strong> Edit last registration
              </li>
              <li>
                <strong className="mr-2">Ctrl + [number]:</strong> Edit specific registration (replace [number] with the
                actual number)
              </li>
            </ul>

            <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-dark-heading">
              Main Screen - Manual Input
            </h2>
            <ul className="list-disc pl-4">
              <li>
                <strong className="mr-2">Ctrl + D:</strong> Duplicate string
              </li>
              <li>
                <strong className="mr-2">Ctrl + S:</strong> Save changes
              </li>
            </ul>

            <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-dark-heading">Track Time Form</h2>
            <ul className="list-disc pl-4">
              <li>
                <strong className="mr-2">Ctrl + Enter:</strong> Force Save
              </li>
              <li>
                <strong className="mr-2">Esc:</strong> Close the suggestions dropdown.
              </li>
              <li>
                <strong className="mr-2">ArrowUp (on time field):</strong> Increase time by 15 minutes.
              </li>
              <li>
                <strong className="mr-2">ArrowDown (on time field):</strong> Decrease time by 15 minutes.
              </li>
            </ul>

            <p className="mt-2 italic">* Replace Ctrl with Metakey on macos</p>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HelpSection;
