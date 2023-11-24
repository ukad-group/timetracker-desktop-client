import {
  FormEvent,
  Dispatch,
  SetStateAction,
  useRef,
  ChangeEvent,
  useEffect,
} from "react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Combobox } from "@headlessui/react";
import clsx from "clsx";

type AutocompleteProps = {
  isNew?: boolean;
  onSave: (e: FormEvent | MouseEvent) => void;
  title: string;
  selectedItem: string;
  availableItems: Array<string>;
  setSelectedItem: Dispatch<SetStateAction<string>>;
  required?: boolean;
  tabIndex?: number;
  isValidationEnabled?: boolean;
  className?: string;
  showedSuggestionsNumber: number;
};

export default function AutocompleteSelector({
  isNew,
  onSave,
  title,
  className = "",
  selectedItem,
  availableItems,
  setSelectedItem,
  required = false,
  tabIndex,
  isValidationEnabled,
  showedSuggestionsNumber,
}: AutocompleteProps) {
  const inputRef = useRef(null);

  const filteredList =
    selectedItem === ""
      ? availableItems?.filter((activity, i) => {
          if (showedSuggestionsNumber) {
            return activity !== "" && i < showedSuggestionsNumber;
          }
          return activity !== "";
        })
      : availableItems?.sort().reduce((accumulator, current) => {
          let duplicate = false;
          if (current.startsWith("TT:: ")) {
            duplicate = availableItems.includes(current.slice(5));
          }
          if (
            !duplicate &&
            current.toLowerCase() === selectedItem.toLowerCase()
          ) {
            accumulator.unshift(current);
          } else if (
            !duplicate &&
            current.toLowerCase().includes((selectedItem || "").toLowerCase())
          ) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);

  const handleKey = (event) => {
    if (event.key === "Home") {
      event.preventDefault();
      inputRef.current.selectionStart = 0;
      inputRef.current.selectionEnd = 0;
    }
    if (event.key === "End") {
      event.preventDefault();
      const input = inputRef.current;
      const length = input.value.length;
      input.selectionStart = length;
      input.selectionEnd = length;
    }
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      onSave(event);
    }
  };

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.startsWith(" ")) {
      e.target.value = e.target.value.trim();
    }
    setSelectedItem(e.target.value);
  };

  useEffect(() => {
    if (selectedItem.startsWith("TT:: ")) {
      setSelectedItem((prev) => prev.slice(5));
    }
  }, [selectedItem]);

  return (
    <Combobox
      className={className}
      as="div"
      value={selectedItem}
      onChange={setSelectedItem}
    >
      <Combobox.Label className="block text-sm font-medium text-gray-700 dark:text-dark-main">
        {title}{" "}
        {isNew && (
          <span className="text-center mb-1 w-fit text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:text-green-400 dark:bg-green-400/20 ">
            New
          </span>
        )}
      </Combobox.Label>
      <div className="relative mt-1">
        <Combobox.Input
          onKeyDown={(event: FormEvent) => handleKey(event)}
          ref={inputRef}
          required={required}
          spellCheck={false}
          className={clsx(
            "w-full py-2 pl-3 pr-10 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:border-slate-600 dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
            {
              "border-red-300 text-red-900 placeholder-red-300":
                required && isValidationEnabled && !selectedItem,
            }
          )}
          onChange={onChangeHandler}
          tabIndex={tabIndex}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2 rounded-r-md focus:outline-none">
          <ChevronUpDownIcon
            className="w-5 h-5 text-gray-400"
            aria-hidden="true"
          />
        </Combobox.Button>

        {filteredList?.length > 0 ? (
          <Combobox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-40 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-dark-container dark:shadow-lg dark:shadow-slate-900">
            <div className="block text-xs text-gray-500 text-center">
              tab to choose
            </div>
            {filteredList?.map((item, i) => (
              <Combobox.Option
                key={i}
                value={item}
                className={({ active }) =>
                  clsx(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active
                      ? "bg-blue-600 text-white dark:bg-indigo-800"
                      : "text-gray-900 dark:text-dark-main"
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span
                      className={clsx(
                        "block truncate",
                        selected && "font-semibold"
                      )}
                    >
                      {item}
                    </span>

                    {selected && (
                      <span
                        className={clsx(
                          "absolute inset-y-0 right-0 flex items-center pr-4",
                          active ? "text-white" : "text-blue-600"
                        )}
                      >
                        <CheckIcon className="w-5 h-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        ) : (
          filteredList &&
          selectedItem && (
            <Combobox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-40 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-dark-container dark:shadow-lg dark:shadow-slate-900">
              <Combobox.Option
                key={1}
                value={selectedItem}
                className={({ active }) =>
                  clsx(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active
                      ? "bg-blue-600 text-white dark:bg-indigo-800"
                      : "text-gray-900 dark:text-dark-main"
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span
                      className={clsx(
                        "block truncate",
                        selected && "font-semibold"
                      )}
                    >
                      {selectedItem}
                    </span>

                    {selected && (
                      <span
                        className={clsx(
                          "absolute inset-y-0 right-0 flex items-center pr-4",
                          active ? "text-white" : "text-blue-600"
                        )}
                      >
                        <CheckIcon className="w-5 h-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            </Combobox.Options>
          )
        )}
      </div>
    </Combobox>
  );
}
