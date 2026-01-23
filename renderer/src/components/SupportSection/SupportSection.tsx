import { GlobeAltIcon } from "@heroicons/react/24/solid";
import SlackIcon from "@/shared/SlackIcon/SlackIcon";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

const SupportSection = () => {
  const SLACK_DESKTOP_LINK = "slack://channel?team=T3PV37ANP&id=C069N5LUP3M";
  const SLACK_WEB_LINK = "https://app.slack.com/client/T3PV37ANP/C069N5LUP3M";

  const handleSupportClick = (link: string) => {
    global.ipcRenderer.send(IPC_MAIN_CHANNELS.REDIRECT, link);
  };

  return (
    <div className="flex flex-col lg:justify-center lg:flex-row my-5 gap-3 col-span-full">
      <button
        className="flex gap-2 text-blue-700 font-semibold hover:text-blue-800 dark:text-blue-700/70 dark:hover:text-blue-700"
        onClick={() => handleSupportClick(SLACK_DESKTOP_LINK)}
      >
        <SlackIcon />
        Contact us in desktop Slack
      </button>
      <button
        className="flex gap-2 text-blue-700 font-semibold hover:text-blue-800 dark:text-blue-700/70 dark:hover:text-blue-700"
        onClick={() => handleSupportClick(SLACK_WEB_LINK)}
      >
        <GlobeAltIcon className="w-6 h-6 fill-gray-600" />
        Contact us in browser Slack
      </button>
    </div>
  );
};

export default SupportSection;
