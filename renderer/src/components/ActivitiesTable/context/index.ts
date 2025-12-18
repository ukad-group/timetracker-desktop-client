import { createContext } from "react";
import { ActivitiesTableContextType } from "@/helpers/utils/types";

export const ActivitiesTableContext = createContext<ActivitiesTableContextType | null>(null);
