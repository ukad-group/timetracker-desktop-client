export type BookingsProps = {
  calendarDate: Date;
};

export type BookingFromApi = {
  name: string;
  plans: Array<{
    hours: number;
    month: number;
    year: number;
    isOvertime: boolean;
    isUndertime: boolean;
  }>;
};

export type BookedSpentStat = {
  project: string;
  booked: number;
  spent: number;
  isOvertime: boolean;
  isUndertime: boolean;
};
