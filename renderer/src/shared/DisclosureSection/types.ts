import { ReactNode } from "react";
import { RefObject } from "react";

export type DisclosureSectionProps = {
  reference?: RefObject<HTMLDivElement>;
  toggleFunction: () => void;
  isOpen: boolean;
  title: string;
  children: ReactNode;
};
