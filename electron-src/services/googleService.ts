import { getGoogleAuthUrl } from "../helpers/API/googleApi";

export const getGoogleOptions = (port: number) => {
    return {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
        redirectUri: `http://localhost:${port}/settings`,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile",
    };
};

export const getGoogleLoginUrl = (port: number) => {
    return getGoogleAuthUrl(getGoogleOptions(port));
};
