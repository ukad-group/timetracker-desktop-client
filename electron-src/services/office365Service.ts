import {
    getAuthUrl,
    getTokens,
    getRefreshedAccessToken,
    callProfileInfoGraph,
    callTodayEventsGraph,
} from "../helpers/API/office365Api";

export const getOffice365Options = (port: number) => {
    return {
        clientId: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_ID || "",
        clientSecret: process.env.NEXT_PUBLIC_OFFICE365_CLIENT_SECRET || "",
        redirectUri:
            process.env.NEXT_PUBLIC_OFFICE365_REDIRECT_URI?.replace(
                process.env.NEXT_PUBLIC_PORT_REPLACE_TOKEN_NAME || "",
                port.toString(),
            ) || "",
        scope: process.env.NEXT_PUBLIC_OFFICE365_SCOPE || "",
    };
};

export const getOffice365LoginUrl = (port: number) => {
    return getAuthUrl(getOffice365Options(port));
};

export const office365GetTokens = async (authCode: string, port: number) => {
    return await getTokens(authCode, getOffice365Options(port));
};

export const office365RefreshAccessToken = async (refreshToken: string, port: number) => {
    return await getRefreshedAccessToken(refreshToken, getOffice365Options(port));
};

export const office365GetProfileInfo = async (accessToken: string) => {
    return await callProfileInfoGraph(accessToken);
};

export const office365GetTodayEvents = async (accessToken: string) => {
    return await callTodayEventsGraph(accessToken);
};
