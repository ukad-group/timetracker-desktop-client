import { lazy, Suspense, ReactNode } from "react";
import { Loader } from "@/shared/Loader";

export const LazyDateSelector = lazy(() => import("@/components/DateSelector/DateSelector"));
export const LazyActivitiesSection = lazy(() => import("@/components/ActivitiesSection/ActivitiesSection"));
export const LazyManualInputForm = lazy(() => import("@/components/ManualInputForm/ManualInputForm"));
export const LazyCalendar = lazy(() => import("@/components/Calendar/Calendar").then((m) => ({ default: m.Calendar })));
export const LazyTotals = lazy(() => import("@/components/Totals/Totals"));
export const LazyBookings = lazy(() => import("@/components/Bookings/Bookings"));
export const LazyUpdateDescription = lazy(() => import("@/components/UpdateDescription/UpdateDescription"));

export const SectionFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader className="h-8 w-8" />
  </div>
);

export const LazySection = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<SectionFallback />}>{children}</Suspense>
);
