import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeleteMessage from "../DeleteMessage";
import { useMainStore } from "@/store/mainStore";

jest.mock("@/store/mainStore", () => ({
  useMainStore: jest.fn(),
}));

describe("GIVEN DeleteMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without errors", () => {
    // @ts-expect-error
    useMainStore.mockReturnValue([null, jest.fn()]);
    render(
      <DeleteMessage
        setShowDeleteButton={() => {}}
        setShowDeleteMessage={() => {}}
        selectedDate={new Date()}
        setSelectedDateReport={() => {}}
      />,
    );
  });

  it("handles cancel button click", () => {
    const setShowDeleteMessageMock = jest.fn();

    // @ts-expect-error
    useMainStore.mockReturnValue([null, jest.fn()]);
    render(
      <DeleteMessage
        setShowDeleteButton={() => {}}
        setShowDeleteMessage={setShowDeleteMessageMock}
        selectedDate={new Date()}
        setSelectedDateReport={() => {}}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(setShowDeleteMessageMock).toHaveBeenCalledWith(false);
  });
});
