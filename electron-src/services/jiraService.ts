import {
    getJiraAuthUrl,
    getJiraTokens,
    getJiraRefreshedAccessToken,
    getJiraProfile,
    getJiraResources,
    getJiraIssues,
} from "../helpers/API/jiraApi";

export const getJiraOptions = () => {
    const clientId = process.env.NEXT_PUBLIC_JIRA_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_JIRA_CLIENT_SECRET || "";
    const redirectUri = process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI || "";
    const scope = process.env.NEXT_PUBLIC_JIRA_SCOPE || "";

    if (!clientId || !clientSecret || !redirectUri || !scope) {
        console.error("Missing Jira env vars", {
            hasClientId: Boolean(clientId),
            hasClientSecret: Boolean(clientSecret),
            hasRedirectUri: Boolean(redirectUri),
            hasScope: Boolean(scope),
        });
    }

    return { clientId, clientSecret, redirectUri, scope };
};

export const getJiraLoginUrl = () => {
    return getJiraAuthUrl(getJiraOptions());
};

export const jiraGetTokens = async (authCode: string) => {
    return await getJiraTokens(authCode, getJiraOptions());
};

export const jiraRefreshAccessToken = async (refreshToken: string) => {
    return await getJiraRefreshedAccessToken(refreshToken, getJiraOptions());
};

export const jiraGetProfile = async (accessToken: string) => {
    return await getJiraProfile(accessToken);
};

export const jiraGetResources = async (accessToken: string) => {
    return await getJiraResources(accessToken);
};

export const jiraGetIssues = async (accessToken: string, resourceId: string, assignee: string) => {
    return await getJiraIssues(accessToken, resourceId, assignee);
};
