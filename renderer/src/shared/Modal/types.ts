import { ReactNode, RefObject } from "react";

export type ModalProps = {
  isOpen: boolean;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  onClose: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
};
