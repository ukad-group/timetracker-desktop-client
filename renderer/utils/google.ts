import {
  getGoogleEvents,
  updateGoogleCredentials,
} from "../API/googleCalendarAPI";

export const loadGoogleEvents = async (
  accessToken: string,
  refreshToken: string,
  index: number
) => {
  try {
    const data = await getGoogleEvents(accessToken);

    // detect expired token
    if (data?.error && data?.error?.code === 401) {
      const updatedCredentials = await updateGoogleCredentials(refreshToken);
      const newAccessToken = updatedCredentials?.access_token;
      const usersLs = JSON.parse(localStorage.getItem("googleUsers"));

      usersLs[index].googleAccessToken = newAccessToken;
      localStorage.setItem("googleUsers", JSON.stringify(usersLs));

      return await loadGoogleEvents(newAccessToken, refreshToken, index);
    }

    if (data?.items) return data.items;

    return [];
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

export const loadGoogleEventsFromAllUsers = async () => {
  const storedUsers = JSON.parse(localStorage.getItem("googleUsers")) || [];

  if (!storedUsers.length) return [];

  const userPromises = storedUsers.map((user, i) =>
    loadGoogleEvents(user.googleAccessToken, user.googleRefreshToken, i)
  );
  const userEvents = await Promise.all(userPromises);

  const flattenedEvents = userEvents.flat();

  return flattenedEvents;
};
