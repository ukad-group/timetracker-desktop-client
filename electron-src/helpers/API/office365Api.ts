export type Options = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
};

export type AzureTokenSuccess = {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  id_token?: string;
  refresh_token?: string;
};

export type AzureTokenError = {
  error: string;
  error_description: string;
  error_codes?: number[];
  timestamp?: string;
  trace_id?: string;
  correlation_id?: string;
  error_uri?: string;
};

export type AzureTokenResponse = AzureTokenSuccess | AzureTokenError;

export const getAuthUrl = (options: Options) => {
  const { clientId, scope, redirectUri } = options;
  const authUrl = new URL(
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
  );

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    prompt: "select_account",
    response_type: "code",
    state: "office365code",
  });

  authUrl.search = params.toString();

  return authUrl.toString();
};

export const getTokens = async (authCode: string, options: Options) => {
  if (!authCode) return;

  const { clientId, clientSecret, redirectUri, scope } = options;
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `code=${authCode}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=authorization_code&scope=${scope}`,
    }
  );

  // if (!response.ok) throw new Error();

  return response.json();
};

export const getRefreshedAccessToken = async (
  refreshToken: string,
  options: Options
) => {
  const { clientId, clientSecret, scope } = options;
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&scope=${scope}`,
    }
  );

  // if (!response.ok) throw new Error();

  return response.json();
};

export const endpoints = {
  me: "https://graph.microsoft.com/v1.0/me",
  events: "https://graph.microsoft.com/v1.0/me/events",
};

export async function callProfileInfoGraph(accessToken: string) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(endpoints.me, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

export async function callTodayEventsGraph(accessToken: string) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  const currentDate = new Date();
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59);

  const filter = `?$filter=start/dateTime ge '${startOfDay.toISOString()}' and start/dateTime le '${endOfDay.toISOString()}'`;

  return fetch(`${endpoints.events}?${filter}`, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}
