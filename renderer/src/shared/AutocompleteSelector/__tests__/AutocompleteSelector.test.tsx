import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import AutocompleteSelector from "../AutocompleteSelector";

describe("GIVEN AutocompleteSelector", () => {
  const mockProps = {
    isNewCheck: false,
    onSave: jest.fn(),
    title: "Test Title",
    className: "test-class",
    selectedItem: "",
    availableItems: ["Item1", "Item2", "Item3"],
    additionalItems: ["New Item"],
    setSelectedItem: jest.fn(),
    required: false,
    tabIndex: 0,
    isValidationEnabled: true,
    showedSuggestionsNumber: 5,
    spellCheck: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders AutocompleteSelector correctly", () => {
    render(<AutocompleteSelector {...mockProps} />);

    const autocompleteSelector = screen.getByRole("combobox");
    expect(autocompleteSelector).toBeInTheDocument();
  });

  it("handles user input and suggestions", () => {
    render(<AutocompleteSelector {...mockProps} />);

    const input = screen.getByTestId("autocomplete-test-id");

    fireEvent.change(input, { target: { value: "It" } });

    const suggestionsList = screen.getByRole("listbox");
    expect(suggestionsList).toBeInTheDocument();

    const suggestionItems = screen.getAllByRole("option");
    expect(suggestionItems).toHaveLength(4);

    fireEvent.click(suggestionItems[0]);

    expect(mockProps.setSelectedItem).toHaveBeenCalledWith("It");
  });

  it("handles user key events", () => {
    render(<AutocompleteSelector {...mockProps} />);

    const input = screen.getByTestId("autocomplete-test-id");

    fireEvent.keyDown(input, { key: "Home" });
    fireEvent.keyDown(input, { key: "End" });
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
  });
});
