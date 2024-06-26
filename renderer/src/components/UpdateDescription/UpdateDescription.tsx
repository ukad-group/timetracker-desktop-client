import { useState, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useUpdateStore } from "@/store/updateStore";
import { useTutorialProgressStore } from "@/store/tutorialProgressStore";
import { DisclosureSection } from "@/shared/DisclosureSection";
import { Release } from "./types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { SCREENS } from "@/constants";
import { Hint } from "@/shared/Hint";
import { HINTS_GROUP_NAMES, HINTS_ALERTS } from "@/helpers/contstants";
import { changeHintConditions } from "@/helpers/utils/utils";
import useScreenSizes from "@/helpers/hooks/useScreenSizes";

const UpdateDescription = () => {
  const [release, setRelease] = useState<Release | null>();
  const [currentVersion, setCurrentVersion] = useState(global.app?.getVersion());
  const [isUpdate, setIsUpdate] = useState(false);
  const [update, setUpdate] = useUpdateStore((state) => [state.update, state.setUpdate], shallow);
  const [progress, setProgress] = useTutorialProgressStore((state) => [state.progress, state.setProgress], shallow);
  const [isOpen, setIsOpen] = useState(update?.age === "new");
  const { screenSizes } = useScreenSizes();
  const whatsNewRef = useRef(null);

  useEffect(() => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.GET_CURRENT_VERSION);

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE, (_, data, __) => {
      setIsUpdate(data);
    });

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.DOWNLOADED, (_, __, info) => {
      setRelease(info);
      setIsOpen(true);
      setUpdate({ age: "new", description: info?.releaseNotes });
    });

    global.ipcRenderer.on(IPC_MAIN_CHANNELS.CURRENT_VERSION, (_, data) => {
      setCurrentVersion(data);
    });
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.WHATS_NEW,
        newConditions: [false],
        existingConditions: [false],
      },
    ]);

    return () => {
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.UPDATE_AVAILABLE);
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.DOWNLOADED);
      global.ipcRenderer.removeAllListeners(IPC_MAIN_CHANNELS.CURRENT_VERSION);
    };
  }, []);

  useEffect(() => {
    setProgress(progress);
  }, [screenSizes]);

  const isOpenToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setUpdate({ age: "old", description: update?.description });
    } else {
      setIsOpen(true);
      setUpdate({ age: "new", description: update?.description });
    }
    changeHintConditions(progress, setProgress, [
      {
        groupName: HINTS_GROUP_NAMES.WHATS_NEW,
        newConditions: [true],
        existingConditions: [true],
      },
    ]);
  };

  // open autogenerated github message links in a new window
  const addTargetBlankToLink = (htmlString: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    const links = tempDiv.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
      links[i].target = "_blank";
    }

    return tempDiv.innerHTML;
  };

  return (
    <DisclosureSection reference={whatsNewRef} toggleFunction={isOpenToggle} isOpen={isOpen} title="What's new?">
      {screenSizes.screenWidth >= SCREENS.LG && (
        <Hint
          displayCondition
          learningMethod="buttonClick"
          order={1}
          groupName={HINTS_GROUP_NAMES.WHATS_NEW}
          referenceRef={whatsNewRef}
          shiftY={150}
          shiftX={50}
          width={"medium"}
          position={{
            basePosition: "left",
            diagonalPosition: "bottom",
          }}
        >
          {HINTS_ALERTS.WHATS_NEW}
        </Hint>
      )}
      {screenSizes.screenWidth < SCREENS.LG && (
        <Hint
          displayCondition
          learningMethod="buttonClick"
          order={1}
          groupName={HINTS_GROUP_NAMES.WHATS_NEW}
          referenceRef={whatsNewRef}
          shiftY={50}
          shiftX={0}
          width={"medium"}
          position={{
            basePosition: "top",
            diagonalPosition: "right",
          }}
        >
          {HINTS_ALERTS.WHATS_NEW}
        </Hint>
      )}
      <p className="text-xs text-gray-700 font-semibold dark:text-dark-main mb-4">
        Current version {currentVersion} {!isUpdate && "(latest)"}
      </p>

      <h2 className="font-bold text-gray-700 dark:text-dark-heading">
        In {release?.version ? release?.version : currentVersion} version
      </h2>
      {update?.description ? (
        <div
          className="desc flex flex-col gap-2 mb-3 dark:text-dark-heading"
          dangerouslySetInnerHTML={{
            __html: addTargetBlankToLink(update?.description),
          }}
        ></div>
      ) : (
        <div className="flex flex-col gap-2 mb-3 dark:text-dark-heading">
          Here you will receive notifications about the app's content updates after downloading the new version.
        </div>
      )}
    </DisclosureSection>
  );
};

export default UpdateDescription;
