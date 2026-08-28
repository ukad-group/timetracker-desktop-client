import { useState, useRef, ChangeEvent, useEffect } from "react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOptions, Label } from "@headlessui/react";
import clsx from "clsx";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { useEditingHistoryManager } from "@/helpers/hooks";
import { AutocompleteProps } from "./types";
import SuggestionsList from "./SuggestionsList";
import { filterList } from "./utils";
import { KEY_CODES } from "@/helpers/constants";

const AutocompleteSelector = ({
  isNewCheck = false,
  onSave,
  title,
  className = "",
  selectedItem,
  availableItems,
  additionalItems,
  setSelectedItem,
  required = false,
  tabIndex,
  isValidationEnabled,
  showedSuggestionsNumber,
  spellCheck = false,
}: AutocompleteProps) => {
  const [isNew, setIsNew] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const allItems = useMemo(() => {
    return additionalItems ? availableItems?.concat(additionalItems) : availableItems;
  }, [availableItems, additionalItems]);
  const editingHistoryManager = useEditingHistoryManager(selectedItem);

  const filteredList = useMemo(
    () => filterList({ selectedItem, availableItems, additionalItems, showedSuggestionsNumber }),
    [selectedItem, availableItems, additionalItems],
  );

  const fullSuggestionsList = useMemo(() => {
    return (selectedItem || "").trim() === "" ? filteredList : [selectedItem, ...filteredList];
  }, [selectedItem, filteredList]);

  const handleKey = (e) => {
    if (!e.ctrlKey && !e.shiftKey && !e.metaKey && e.key === KEY_CODES.HOME) {
      e.preventDefault();
      inputRef.current.selectionStart = 0;
      inputRef.current.selectionEnd = 0;
    }

    if (!e.ctrlKey && !e.shiftKey && !e.metaKey && e.key === KEY_CODES.END) {
      e.preventDefault();
      const input = inputRef.current;
      const length = input.value.length;
      input.selectionStart = length;
      input.selectionEnd = length;
    }

    if (e.ctrlKey && e.key === KEY_CODES.ENTER) {
      e.preventDefault();
      onSave(e);
    }

    if ((e.ctrlKey || e.metaKey) && e.code === KEY_CODES.KEY_Z) {
      e.preventDefault();
      const [currentValue, changePlace] = editingHistoryManager.undoEditing();

      if (currentValue !== undefined) {
        setSelectedItem(currentValue as string);
        setCursorPosition(typeof changePlace === "number" ? changePlace : 0);
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.code === KEY_CODES.KEY_Y) {
      e.preventDefault();
      const [currentValue, changePlace] = editingHistoryManager.redoEditing();

      if (currentValue !== undefined) {
        setSelectedItem(currentValue as string);
        setCursorPosition(typeof changePlace === "number" ? changePlace : 0);
      }
    }
  };

  const handleOnChange = (value: string) => {
    let newValue = value;

    if (value && (value.startsWith("TT:: ") || value.startsWith("JI:: "))) {
      newValue = newValue.slice(5);
    }

    // TODO: uncomment if needed first item auto selection
    // In Headless UI v2, when clicking an option, onChange might receive the input value
    // instead of the option value. If the value matches the start of an option, select that option.
    // if (allItems && newValue && newValue !== selectedItem) {
    //   const matchingOption = allItems.find((item) => item.toLowerCase().startsWith(newValue.toLowerCase()));
    //   if (matchingOption && matchingOption !== newValue) {
    //     newValue = matchingOption;
    //   }
    // }

    setSelectedItem(newValue);
    editingHistoryManager.setValue(newValue);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleOnChange(e.target.value);
  };

  const handleOnBlur = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.trim();
    handleOnChange(e.target.value);

    if (isNewCheck && allItems) {
      setIsNew(selectedItem && !allItems.includes(selectedItem));
    }
  };

  useEffect(() => {
    if (isNewCheck && allItems?.includes(selectedItem)) {
      setIsNew(false);
    }

    if (cursorPosition) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
    setCursorPosition(0);
  }, [selectedItem, allItems]);

  return (
    <Combobox className={className} as="div" value={selectedItem} onChange={handleOnChange}>
      <Label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-dark-main ">
        {title}
        {title === "Activity" && (
          <div title="You can write whatever you want in the activity, or write nothing. Sometimes the project manager will provide information on when and how to fill this field.">
            <QuestionMarkCircleIcon className="cursor-help w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        {isNew && (
          <span className="text-center w-fit text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:text-green-400 dark:bg-green-400/20 ">
            New
          </span>
        )}
      </Label>
      <div className="relative mt-1">
        <ComboboxInput
          onKeyDown={(event) => handleKey(event)}
          ref={inputRef}
          value={selectedItem}
          required={required}
          spellCheck={spellCheck}
          data-testid="autocomplete-test-id"
          className={clsx(
            "w-full py-2 pl-3 pr-10 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:border-slate-600 dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
            {
              "border-red-300 text-red-900 placeholder-red-300": required && isValidationEnabled && !selectedItem,
            },
          )}
          onChange={handleInputChange}
          tabIndex={tabIndex}
          onBlur={handleOnBlur}
        />
        <ComboboxButton
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-2 rounded-r-md focus:outline-none"
        >
          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        {fullSuggestionsList?.length > 0 && (
          <ComboboxOptions className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-40 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-dark-container dark:shadow-lg dark:shadow-slate-900">
            <div className="block text-xs text-gray-500 text-center">tab to choose</div>
            <SuggestionsList list={fullSuggestionsList} />
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
};

export default AutocompleteSelector;
