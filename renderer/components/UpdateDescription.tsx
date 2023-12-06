import { useState, useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useUpdateStore } from "../store/updateStore";
import { useBetaStore } from "../store/betaUpdatesStore";
import DisclosureSection from "./ui/DisclosureSection";
import { GlobeAltIcon } from "@heroicons/react/24/solid";
import SlackIcon from "./ui/SlackIcon";

type File = {
  url: string;
  sha512: string;
  size: number;
};

type Release = {
  files: File[];
  path: string;
  releaseDate: string;
  releaseName: string;
  releaseNotes: string;
  sha512: string;
  tag: string;
  version: string;
};

export default function UpdateDescription() {
  const [release, setRelease] = useState<Release | null>();
  const [currentVersion, setCurrentVersion] = useState(
    global.app?.getVersion()
  );
  const [isUpdate, setIsUpdate] = useState(false);
  const [update, setUpdate] = useUpdateStore(
    (state) => [state.update, state.setUpdate],
    shallow
  );
  const [isBeta, setIsBeta] = useBetaStore(
    (state) => [state.isBeta, state.setIsBeta],
    shallow
  );
  const [isOpen, setIsOpen] = useState(update?.age === "new");

  useEffect(() => {
    global.ipcRenderer.send("beta-channel", isBeta);
    global.ipcRenderer.send("get-current-version");

    global.ipcRenderer.on("update-available", (event, data, info) => {
      setIsUpdate(data);
    });

    global.ipcRenderer.on("downloaded", (event, data, info) => {
      setRelease(info);
      setIsOpen(true);
      setUpdate({ age: "new", description: info?.releaseNotes });
    });

    global.ipcRenderer.on("current-version", (event, data) => {
      setCurrentVersion(data);
    });

    return () => {
      global.ipcRenderer.removeAllListeners("update-available");
      global.ipcRenderer.removeAllListeners("downloaded");
      global.ipcRenderer.removeAllListeners("current-version");
    };
  }, [isBeta]);

  const isOpenToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setUpdate({ age: "old", description: update?.description });
    } else {
      setIsOpen(true);
      setUpdate({ age: "new", description: update?.description });
    }
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

  const supportClickHandler = (isDesktop: boolean) => {
    global.ipcRenderer.send("slack-redirect", isDesktop);
  };

  return (
    <DisclosureSection
      toggleFunction={isOpenToggle}
      isOpen={isOpen}
      title="What's new?"
    >
      <p className="text-xs text-gray-700 font-semibold dark:text-dark-main">
        Current version {currentVersion} {!isUpdate && "(latest)"}
      </p>

      <div className="flex flex-col my-5 gap-3 ">
        <p className=" text-gray-700 font-semibold dark:text-dark-main">
          You can leave your feedback or questions in our slack channel
        </p>
        <button
          className="flex gap-2 text-blue-700 font-semibold hover:text-blue-800 dark:text-blue-700/70 dark:hover:text-blue-700"
          onClick={() => supportClickHandler(true)}
        >
          <SlackIcon />
          Open in desktop Slack
        </button>
        <button
          className="flex gap-2 text-blue-700 font-semibold hover:text-blue-800 dark:text-blue-700/70 dark:hover:text-blue-700"
          onClick={() => supportClickHandler(false)}
        >
          <GlobeAltIcon className="w-6 h-6 fill-gray-600" />
          Open Slack in the browser
        </button>
      </div>
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
          Here you will receive notifications about the app's content updates
          after downloading the new version.
        </div>
      )}
    </DisclosureSection>
  );
}
