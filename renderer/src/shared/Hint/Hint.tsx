import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { ButtonTransparent } from "@/shared/ButtonTransparent";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { shallow } from "zustand/shallow";
import { positioning } from "./positioning";
import { HintProps } from "./types";

function Hint({
  ignoreSkip = false,
  displayCondition = false,
  learningMethod,
  order,
  groupName,
  children,
  referenceRef,
  shiftY,
  shiftX,
  width,
  position,
}: HintProps) {
  const SVGRef = useRef(null);
  const HorizontalLineRef = useRef(null);
  const VerticalLineRef = useRef(null);
  const TriangleRef = useRef(null);
  const floatingRef = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const [groupSize, setGroupSize] = useState(0);

  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);

  useEffect(() => {
    const handleResize = () => {
      positioning(
        learnHint,
        referenceRef,
        floatingRef,
        SVGRef,
        learningMethod,
        position,
        showHint,
        shiftY,
        shiftX,
        HorizontalLineRef,
        VerticalLineRef,
        TriangleRef,
        setShowHint,
      );
    };
    window.addEventListener("resize", handleResize);

    if (order > 1 && progress[groupName] === undefined) {
      const tempArr = [null];
      for (let i = 1; i < order; i++) {
        tempArr[i] = true;
      }
      progress[groupName] = tempArr;
      setProgress(progress);
      learnHint();
    } else if (order > 1 && progress[groupName] !== undefined) {
      progress[groupName][order - 1] = true;
      setProgress(progress);
      learnHint();
    }

    const unsubscribe = useTutorialProgressStore.subscribe((newProgress) => {
      if (newProgress[groupName]?.length) {
        setGroupSize(newProgress[groupName]?.length);
      }

      if (
        (!newProgress.progress.hasOwnProperty(groupName) &&
          displayCondition &&
          newProgress.progress.hasOwnProperty(`${groupName}Conditions`) &&
          !newProgress.progress[`${groupName}Conditions`].includes(false)) ||
        (newProgress.progress.hasOwnProperty(groupName) &&
          !newProgress.progress[groupName][order - 1] &&
          newProgress.progress.hasOwnProperty(`${groupName}Conditions`) &&
          !newProgress.progress[`${groupName}Conditions`].includes(false)) ||
        (newProgress.progress.hasOwnProperty(groupName) &&
          !newProgress.progress[groupName][order - 1] &&
          !newProgress.progress.hasOwnProperty(`${groupName}Conditions`))
      ) {
        setShowHint(true);
      } else {
        setShowHint(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (progress[groupName]?.length) {
      setGroupSize(progress[groupName]?.length);
    }

    if (progress.hasOwnProperty(groupName) && progress[groupName][order - 1]) {
      setShowHint(false);
    } else if (!displayCondition) {
      setShowHint(true);
    }
  }, [progress[groupName], progress[`${groupName}Conditions`]]);

  const learnHint = () => {
    setShowHint(false);
    if (progress[groupName] === undefined) {
      progress[groupName] = [true];
    } else {
      progress[groupName][order - 1] = true;
    }
    setProgress(progress);
  };

  const handleNextClick = () => {
    if (progress[groupName][order] !== undefined) {
      progress[groupName][order] = false;
    }
    setProgress(progress);
    learnHint();
  };

  useEffect(() => {
    if (!progress.skipAll[0] || ignoreSkip) {
      positioning(
        learnHint,
        referenceRef,
        floatingRef,
        SVGRef,
        learningMethod,
        position,
        showHint,
        shiftY,
        shiftX,
        HorizontalLineRef,
        VerticalLineRef,
        TriangleRef,
        setShowHint,
      );
    }
    if (referenceRef.current && !showHint) {
      Object.assign(referenceRef.current.style, {
        "z-index": null,
      });
    }
  }, [showHint]);

  const skipAllClockHandler = () => {
    learnHint();
    progress.skipAll[0] = true;
    setProgress(progress);
    Object.assign(referenceRef.current.style, {
      "z-index": null,
    });
  };

  return (
    <>
      {showHint && (!progress["skipAll"][0] || ignoreSkip) && (
        <>
          {createPortal(
            <div className="h-screen w-full fixed justify-center top-0 z-20 items-center bg-gray-900/40 pointer-events-auto" />,
            document.body,
          )}
          {createPortal(
            <svg
              className={clsx(
                "absolute w-2/5 h-screen z-40 pointer-events-none",
                { "w-3/5 lg:w-2/5": width === "small" },
                { "w-3/5 lg:w-3/5": width === "medium" },
                { "w-4/5 lg:w-3/5": width === "large" },
              )}
              xmlns="http://www.w3.org/2000/svg"
              ref={SVGRef}
            >
              <line ref={HorizontalLineRef} stroke="white" strokeWidth="1" />

              <line ref={VerticalLineRef} stroke="white" strokeWidth="1" />

              <polygon className="z-50" ref={TriangleRef} fill="white" />
            </svg>,
            document.body,
          )}
          {createPortal(
            <div
              id="hint"
              className={clsx(
                "p-4 pt-5 flex gap-2 flex-col text-sm rounded-lg z-50 border border-gray-500 bg-white dark:bg-black absolute text-gray-900 dark:text-dark-heading",
                { "w-1/3 lg:w-1/5": width === "small" },
                { "w-2/5 lg:w-1/4": width === "medium" },
                { "w-3/5 lg:w-2/5": width === "large" },
              )}
              ref={floatingRef}
            >
              <p className={groupName}>{children}</p>
              <div className="flex gap-4 justify-end">
                <ButtonTransparent callback={skipAllClockHandler}>Skip all</ButtonTransparent>
                {order < groupSize && (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500   dark:bg-dark-button-back  dark:hover:bg-dark-button-hover"
                    onClick={handleNextClick}
                  >
                    Next
                  </button>
                )}
                {(!groupSize || order === groupSize) && (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500   dark:bg-dark-button-back  dark:hover:bg-dark-button-hover"
                    onClick={(e) => {
                      e.stopPropagation();
                      learnHint();
                    }}
                  >
                    Got it
                  </button>
                )}
              </div>
              <XMarkIcon
                className="w-6 h-6 fill-gray-600 dark:fill-gray-400/70 absolute right-1 top-1 cursor-pointer"
                onClick={learnHint}
              />
            </div>,
            document.body,
          )}
        </>
      )}
    </>
  );
}
export default Hint;
