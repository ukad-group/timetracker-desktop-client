import {
    getAuthUrl,
    getTokens,
    getRefreshedAccessToken,
    callProfileInfoGraph,
    callTodayEventsGraph,
} from "../helpers/API/office365Api";

export const getOffice365Options = (port: number) => {
    const clientId = process.env.NEXT_PUBLIC_OFFICE365_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_OFFICE365_CLIENT_SECRET || "";
    const scope = process.env.NEXT_PUBLIC_OFFICE365_SCOPE || "";
    // const redirectUri =
    //     process.env.NEXT_PUBLIC_OFFICE365_REDIRECT_URI?.replace(
    //         process.env.NEXT_PUBLIC_PORT_REPLACE_TOKEN_NAME || "",
    //         port.toString(),
    //     ) || "";
    const redirectUri = `http://localhost:${port}/settings`;

    if (!clientId || !clientSecret || !redirectUri || !scope) {
        console.error("Missing Office365 env vars", {
            hasClientId: Boolean(clientId),
            hasClientSecret: Boolean(clientSecret),
            hasRedirectUri: Boolean(redirectUri),
            hasScope: Boolean(scope),
        });
    }

    return { clientId, clientSecret, redirectUri, scope };
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
