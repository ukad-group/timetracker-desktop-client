import { TrelloConnection } from "../TrelloConnection";
import { GoogleConnection } from "../GoogleConnection";
import { Office365Connection } from "../Office365Connection";
import { JiraConnection } from "../JiraConnection";
import { TimetrackerWebsiteConnection } from "../TimetrackerWebsiteConnection";

const ConnectionsSection = () => (
  <section className="h-full">
    <div className="overflow-y-auto h-full bg-white sm:rounded-lg p-2 flex flex-col gap-6 dark:bg-dark-container">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Connections</span>
        <p className="text-sm text-gray-500">
          You can connect available resources to use their capabilities to complete your reports
        </p>
      </div>
      <TrelloConnection />
      <GoogleConnection />
      <Office365Connection />
      <JiraConnection />
      <TimetrackerWebsiteConnection />
    </div>
  </section>
);

export default ConnectionsSection;
