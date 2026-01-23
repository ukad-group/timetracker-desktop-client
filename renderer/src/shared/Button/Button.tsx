import { Loader } from "../Loader";
import { ButtonProps } from "./types";
import {
  basicStyles,
  defaultStyles,
  saveHoverStyles,
  cancelHoverStyles,
  focusStyles,
  disabledStyles,
} from "./constants";

// TODO: create separate Button component which Extend HtmlButtom props,
const Button = ({ callback, text, disabled, status, type = "button", tabIndex, children }: ButtonProps) => {
  const saveBtnStatuses = {
    enabled: {
      text: "Save",
      classes: "bg-blue-600 text-white border-transparent dark:bg-dark-button-back " + saveHoverStyles,
    },
    disabled: {
      text: "Save",
      classes: "bg-grey-600 text-white border-transparent " + saveHoverStyles,
    },
    inprogress: {
      text: "Saving...",
      classes: "bg-blue-600 text-white border-transparent dark:bg-dark-button-back " + saveHoverStyles,
    },
    loading: {
      text: "Loading",
      classes: "bg-blue-600 text-white border-transparent dark:bg-dark-button-back " + saveHoverStyles,
    },
    done: {
      text: "Saved",
      classes: "bg-green-600 text-white border-transparent " + saveHoverStyles,
    },
    cancel: {
      text: "Cancel",
      classes: "bg-white text-gray-700 border-gray-300 dark:bg-gray-200 " + cancelHoverStyles,
    },
  };

  const styles =
    basicStyles +
    (saveBtnStatuses[status] ? saveBtnStatuses[status].classes : defaultStyles + saveHoverStyles) +
    focusStyles +
    disabledStyles;

  return (
    <button onClick={callback} type={type} className={styles} disabled={disabled} tabIndex={tabIndex}>
      {children}
      {status && status === "inprogress" && <Loader />}
      {status && status === "loading" && <Loader />}
      {saveBtnStatuses[status] ? saveBtnStatuses[status].text : text}
    </button>
  );
};

export default Button;
