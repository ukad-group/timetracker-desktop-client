import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { LOCAL_STORAGE_VARIABLES, TRACK_ANALYTICS } from "../constants";
import { replaceHyphensWithSpaces } from "./utils";
import { trackConnections } from "./utils";

type Card = {
  id: string;
  name: string;
  shortUrl: string;
  idMembers: string[];
};

export const getAllTrelloCardsFromApi = async () => {
  const user =
    JSON.parse(
      global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.TRELLO_USER),
    ) || null;

  if (!user) return [[], []];

  trackConnections(TRACK_ANALYTICS.TRELLO);

  try {
    const { assignedCards, notAssignedCards } = await global.ipcRenderer.invoke(
      IPC_MAIN_CHANNELS.TRELLO_GET_CARDS_OF_ALL_BOARDS,
      user.userId,
      user.accessToken,
    );

    const assignedTrelloCards = assignedCards
      .map((card: Card) => replaceHyphensWithSpaces(`TT:: ${card.name} ${card.shortUrl}`))
      .sort((a: string, b: string) => a.localeCompare(b));
    const notAssignedTrelloCards = notAssignedCards
      .map((card: Card) => replaceHyphensWithSpaces(`TT:: ${card.name} ${card.shortUrl}`))
      .sort((a: string, b: string) => a.localeCompare(b));

    return [assignedTrelloCards, notAssignedTrelloCards];
  } catch (error) {
    console.log("Try to re-login to Trello or check your internet connection", error);
    return [[], []];
  }
};
