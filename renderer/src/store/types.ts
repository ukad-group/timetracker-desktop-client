export type GoogleEvent = {
  created: string;
  creator: { email: string; self: boolean };
  description: string;
  end: { dateTime: string; timeZone: string };
  etag: string;
  eventType: string;
  htmlLink: URL;
  iCalUID: string;
  id: string;
  kind: string;
  organizer: { email: string; self: true };
  reminders: { useDefault: boolean };
  sequence: number;
  start: { dateTime: string; timeZone: string };
  status: string;
  summary: string;
  updated: string;
  from: { date: string; time: string };
  to: { date: string; time: string };
  isAdded?: boolean;
  project?: string;
  activity?: string;
};

export type googleCalendarStoreProps = {
  googleEvents: GoogleEvent[];
  setGoogleEvents: (gEvents: GoogleEvent[]) => void;
};

export type BetaStore = {
  isBeta: boolean;
  setIsBeta: (isDownload: boolean) => void;
  betaUpdateStoreLoaded: boolean;
  setBetaUpdateStoreLoaded: () => void;
};

export type ScheduledEvents = Record<string, { project?: string; activity?: string }>;

export type ScheduledEventsStore = {
  event: ScheduledEvents;
  setEvent: (event: ScheduledEvents) => void;
};

export type MainStore = {
  reportsFolder: string | null;
  setReportsFolder: (folder: string) => void;
  mainStoreLoaded: boolean;
  setMainStoreLoaded: () => void;
};

export type Theme = { custom: "light" | "dark"; os: boolean };

export type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export type Update = { age: "old" | "new"; description: string | null };

export type UpdateStore = {
  update: Update | null;
  setUpdate: (update: Update) => void;
};

export type TutorialProgress = {
  [key: string]: boolean[];
};
export type TutorialProgressStore = {
  progress: TutorialProgress;
  setProgress: (event: TutorialProgress) => void;
};
