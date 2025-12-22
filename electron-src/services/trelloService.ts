import { getTrelloAuthUrl } from "../helpers/API/trelloApi";
import { getTrelloMember, getTrelloCardsOfAllBoards } from "../helpers/API/trelloApi";

export const getTrelloOptions = () => {
    return {
        key: process.env.NEXT_PUBLIC_TRELLO_KEY || "",
        returnUrl: process.env.NEXT_PUBLIC_TRELLO_REDIRECT_URI || "",
    };
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
