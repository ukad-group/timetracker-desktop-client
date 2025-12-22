import { getAzureAuthUrl, getAzureTokens, getRefreshedUserInfoToken, getRefreshedPlannerToken } from "../TimetrackerWebsiteApi";
import { getOffice365Options } from "./office365Service";

export const getAzureLoginBaseUrl = (port: number) => {
    const options = getOffice365Options(port);
    const optionsWithAllScope = {
        ...options,
        scope:
            "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access profile email offline_access openid User.Read Calendars.Read",
    };
    return getAzureAuthUrl(optionsWithAllScope);
};

export const getTimetrackerUserInfoToken = async (authCode: string, port: number) => {
    return await getAzureTokens(authCode, getOffice365Options(port));
};

export const getTimetrackerRefreshedUserInfoToken = async (refreshToken: string, port: number) => {
    return await getRefreshedUserInfoToken(refreshToken, getOffice365Options(port));
};

const getPlannerOptions = (port: number) => {
    const options = getOffice365Options(port);
    return {
        ...options,
        scope: "api://d7d02680-bd82-47ed-95f9-e977ab5f0487/access_as_user offline_access",
    };
};

export const getTimetrackerPlannerToken = async (authCode: string, port: number) => {
    return await getAzureTokens(authCode, getPlannerOptions(port));
};

export const getTimetrackerRefreshedPlannerToken = async (refreshToken: string, port: number) => {
    return await getRefreshedPlannerToken(refreshToken, getPlannerOptions(port));
};
