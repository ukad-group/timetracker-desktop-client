import { getTrelloAuthUrl } from "../helpers/API/trelloApi";
import { getTrelloMember, getTrelloCardsOfAllBoards } from "../helpers/API/trelloApi";

export const getTrelloOptions = () => {
  const key = process.env.NEXT_PUBLIC_TRELLO_KEY || "";
  const returnUrl = process.env.NEXT_PUBLIC_TRELLO_REDIRECT_URI || "";

  if (!key || !returnUrl) {
    console.error("Missing Trello env vars", {
      hasKey: Boolean(key),
      hasReturnUrl: Boolean(returnUrl),
    });
  }

  return { key, returnUrl };
};

export const getTrelloLoginUrl = () => {
  return getTrelloAuthUrl(getTrelloOptions());
};

export const trelloGetProfileInfo = async (accessToken: string) => {
  const options = getTrelloOptions();
  return await getTrelloMember({ accessToken, options });
};

export const trelloGetCardsOfAllBoards = async (memberId: string, accessToken: string) => {
  const options = getTrelloOptions();
  return await getTrelloCardsOfAllBoards({ memberId, accessToken, options });
};
