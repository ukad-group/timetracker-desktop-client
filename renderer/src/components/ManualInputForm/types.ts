import { KeyboardEvent, SetStateAction, Dispatch } from "react";

export type ManualInputFormProps = {
  saveReportTrigger: boolean;
  onSave: (selectedDateReport: SetStateAction<string>, shouldAutosave: SetStateAction<boolean>) => void;
  selectedDateReport: string | null;
  selectedDate: Date;
  setSelectedDateReport: Dispatch<SetStateAction<string | null>>;
  isFileExist: boolean;
  setIsFileExist: (value: boolean) => void;
  isToday: boolean;
};

export interface KeyboardEventProps extends KeyboardEvent<HTMLTextAreaElement> {
  code: string;
}
