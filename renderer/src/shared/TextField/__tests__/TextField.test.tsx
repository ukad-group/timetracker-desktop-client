import { render, screen, fireEvent } from "@testing-library/react";
import TextField from "../TextField";
import "@testing-library/jest-dom";

describe("GIVEN TextField", () => {
  const defaultProps = {
    id: "testId",
    label: "Test Label",
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
    onKeyDown: jest.fn(),
    onDragStart: jest.fn(),
    className: "test-class",
    value: "testValue",
    required: false,
    tabIndex: 0,
  };

  it("renders without errors", () => {
    render(<TextField {...defaultProps} />);
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByTestId("text-field-test-id")).toBeInTheDocument();
  });

  it("handles user input events", () => {
    render(<TextField {...defaultProps} />);
    const inputElement = screen.getByRole("textbox");

    fireEvent.change(inputElement, { target: { value: "new value" } });

    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.any(Object) }));
    expect(defaultProps.onChange.mock.calls[0][0].target.value).toBe("testValue");
  });

  it("handles drag events", () => {
    render(<TextField {...defaultProps} />);
    const inputElement = screen.getByTestId("text-field-test-id");

    fireEvent.dragStart(inputElement);
    expect(defaultProps.onDragStart).toHaveBeenCalledTimes(1);
  });
});
