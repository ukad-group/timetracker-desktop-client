import { ConnectionsSection } from "@/components/ConnectionsSection";
import { HelpSection } from "@/components/HelpSection";
import { ReportsFolderSection } from "@/components/ReportsFolderSection";
import { LayoutSection } from "@/components/LayoutSection";
import { VersionSection } from "@/components/VersionSection";

export enum SidebarNavItem {
  Connections = "Connections",
  Help = "Help",
  Layout = "Layout",
  ReportsFolder = "Reports folder",
  VersionSelect = "Version",
}

export const SETTING_SECTIONS = {
  [SidebarNavItem.Connections]: <ConnectionsSection />,
  [SidebarNavItem.Help]: <HelpSection />,
  [SidebarNavItem.ReportsFolder]: <ReportsFolderSection />,
  [SidebarNavItem.Layout]: <LayoutSection />,
  [SidebarNavItem.VersionSelect]: <VersionSection />,
};

export const LOCAL_STORAGE_VARIABLES = {
  SHOW_GOOGLE_EVENTS: "showGoogleEvents",
  SHOW_OFFICE_365_EVENTS: "showOffice365Events",
  TIMETRACKER_USER: "timetracker-user",
  GOOGLE_USERS: "googleUsers",
  JIRA_USERS: "jira-users",
  OFFICE_365_USERS: "office365-users",
  TIMETRACKER_WEBSITE_CODE: "timetracker-website-code",
  GOOGLE_AUTH_CODE: "google-auth-code",
  JIRA_AUTH_CODE: "jira-auth-code",
  OFFICE_365_AUTH_CODE: "office365-auth-code",
  TRELLO_USER: "trello-user",
  TRELLO_AUTH_TOKEN: "trello-auth-token",
  IS_MANUAL_INPUT_MAIN: "is-manual-input-main-section",
  VERSION_DATA: "version-data",
  WIDGET_ORDER: "sectionsOptions",
  CLIENTS_FOR_MENTIONS: "clients-for-mentions",
  // ...Add more local storage variables as needed
};

export const KEY_CODES = {
  SPACE: "Space",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  META: "Meta",
  CONTROL: "Control",
  ENTER: "Enter",
  ESCAPE: "Escape",
  ESC: "Esc",
  TAB: "Tab",
  EQUAL_SIGN: "=",
  KEY_D: "KeyD",
  KEY_S: "KeyS",
  KEY_Y: "KeyY",
  KEY_Z: "KeyZ",
  HOME: "Home",
  END: "End",
  // ...Add more key codes as needed
};

export const HINTS_GROUP_NAMES = {
  SHORTCUTS_EDITING: "shortcutsEditing",
  COPY_BUTTON: "copyButton",
  ONLINE_CALENDAR_EVENT: "calendarEvent",
  EDITING_BUTTON: "editButton",
  VALIDATION: "validation",
  PLACEHOLDER: "placeholder",
  CALENDAR: "calendar",
  MANUAL_INPUT: "manualInput",
  TOTALS: "totals",
  TRACK_TIME_MODAL: "trackTimeModal",
  WHATS_NEW: "whatsNew",
  ZOOM_IN: "zoomIn",
};

export const HINTS_ALERTS = {
  PLACEHOLDER_BUTTON:
    "This is a daily placeholder you'll encounter each day. Click the 'New Activity' button or press ctrl/command + space to open the form for your initial entry today. Alternatively, you can duplicate your last report by clicking 'Copy Last Report.'",
  SHORTCUTS_EDITING:
    "Simplify edits using shortcuts. Press ctrl/command to reveal numbers of each registration. Then select the registration to edit by pressing its corresponding number. Alternatively, use ArrowUp to edit the last entry.",
  EDITING_BUTTON: "If you need to modify a registration, click this button to open the corresponding form",
  COPY_BUTTON:
    "It seems that you've added a time registration similar to an existing one. Next time, you can do this in just a few clicks: simply click the 'Copy' button and save the copied time registration.",
  VALIDATION: " If you make a mistake in creating a registration, it will be displayed in red in the table",
  ONLINE_CALENDAR_EVENT:
    "The table also displays the events specified in your calendar (Google Calendar and Office 365 Calendar). If you write the title of the event in the calendar in the form of project - activity - description or activity - description, it will be parsed automatically. If the title is not separated by dashes, the entire title will be written in the description. And if there is a known project in the title, it will be written in the project field.",
  CALENDAR:
    "Within the calendar, you can easily track the time you've reported for each day. It provides visibility into your vacation days, sick leave, and holidays, along with identifying reports containing errors. The current day is highlighted in yellow, while the day you've selected for viewing is marked in blue.",
  CALENDAR_TOTALS:
    "In the totals field, you can view the cumulative hours you've reported for this month. The Required field displays the necessary number of hours to be reported for the month, factoring in weekends, holidays, vacations, and sick days (If you have connected the timetracker website in the settings).",
  CALENDAR_WEEKS: "This indicates the week number along with the total hours you've reported for that week.",
  MANUAL_INPUT:
    "In the 'Manual Input', your report is displayed in plain text, as it is stored in a file. You can directly edit your report here and save the changes using the 'Save' button or by pressing Ctrl + Space. Life hack: You can increase the height of this box by dragging it from the bottom right corner.",
  TOTALS:
    "This widget facilitates the seamless transfer of your reports to the customer's tracker. You can easily copy all your actions for the day onto the project collectively or individually in the 'activity - description' format (if there is activity) or simply the 'description' format (if there is no activity). Just click on the file icon to initiate this process. If you require the time spent on each activity, click on the plus file icon, and the log will be copied in the format 'description (hh:mm).'",
  TOTALS_PERIOD: "You can get data for the day, week and month by selecting the appropriate item in the selector",
  MODAL_TIME_FIELD:
    "You can manually modify the time by 15-minute increments using the arrow keys. Alternatively, entering the desired duration will automatically adjust the 'to' field accordingly.",
  MODAL_TEXT_FIELD:
    "In the text fields, you'll find suggestions for projects, activities, and descriptions based on your usage in the past month. Upon linking the timetracker website, all company projects become available for selection. After connecting Trello and Jira, you'll be prompted to choose tasks from your boards in the description field, prioritizing those assigned to you.",
  WHATS_NEW:
    "Here you can see your application version. Links to contact us. And the list of changes that were added in this version.",
  ZOOM_IN: 'To zoom in, press "Ctrl Shift +"',
};

export const TRACK_ANALYTICS = {
  TIMETRACKER_WEB: "timetrackerWeb",
  GOOGLE_CALENDAR: "google-calendar",
  JIRA: "jira",
  OFFICE365_CALENDAR: "office365-calendar",
  TRELLO: "trello",
  REGISTRATIONS: "registrations",
  TIME_REGISTRATION: "time_registrations",
  COPY_REGISTRATION: "copy_registration",
  EDIT_REGISTRATION: "edit_registration",
  GOOGLE_CALENDAR_EVENT_REGISTRATION: "google-calendar-event_registration",
  ALL_CALENDAR_EVENT_REGISTRATION: "all_calendar-events_registration",
  CALENDARS_CONNECTIONS: "calendars_connections",
  CALENDAR_GOOGLE: "googleCalendar",
  MANUAL_SAVE: "manuall_save",
  CALENDAR_OFFICE: "office365",
};

export const OFFLINE_MESSAGE = "You're offline! Please check your internet connection.";
