import { getGoogleAuthUrl } from "../helpers/API/googleApi";

export const getGoogleOptions = (port: number) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
        console.error("Missing Google env vars", {
            hasClientId: Boolean(clientId),
            hasClientSecret: Boolean(clientSecret),
        });
    }

    return {
        clientId,
        clientSecret,
        redirectUri: `http://localhost:${port}/settings`,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile",
    };
};

export const getGoogleLoginUrl = (port: number) => {
    return getGoogleAuthUrl(getGoogleOptions(port));
};
