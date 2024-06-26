import { KeyboardEvent, SetStateAction } from "react";

export type ManualInputFormProps = {
  saveReportTrigger: boolean;
  onSave: (selectedDateReport: SetStateAction<string>, shouldAutosave: SetStateAction<boolean>) => void;
  selectedDateReport: string;
  selectedDate: Date;
  setSelectedDateReport: (value: string) => void;
};

export interface KeyboardEventProps extends KeyboardEvent<HTMLTextAreaElement> {
  code: string;
}
