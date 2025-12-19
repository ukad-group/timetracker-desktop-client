import "@testing-library/jest-dom";
import { render, fireEvent, cleanup, screen } from "@testing-library/react";
import DateSelector from "../DateSelector";

describe("GIVEN DateSelector", () => {
  afterEach(() => {
    cleanup();
  });

  const mockProps = {
    isDropboxConnected: true,
    selectedDate: new Date(),
    setSelectedDate: jest.fn(),
    selectedDateReport: "",
  };

  it("renders correctly if date is today", () => {
    const { getByText, getByTestId, queryByRole } = render(<DateSelector {...mockProps} />);
    const copyReportBtn = queryByRole("button", { name: "Copy as today" });
    const goToCurrentDayBtn = queryByRole("button", { name: "Go to current day" });

    expect(getByText(/Today/i)).toBeInTheDocument();
    expect(copyReportBtn).toBeNull();
    expect(goToCurrentDayBtn).toBeNull();
    expect(getByTestId("prev-button-test-id")).toBeInTheDocument();
    expect(getByTestId("next-button-test-id")).toBeInTheDocument();
  });

  it("renders correctly if date is not today and there is not a report", () => {
    const { getByTestId, queryByRole, queryByText } = render(
      <DateSelector {...mockProps} selectedDate={new Date("1988-01-20")} />,
    );
    const copyReportBtn = queryByRole("button", { name: "Copy as today" });
    const goToCurrentDayBtn = queryByRole("button", { name: "Go to current day" });

    expect(queryByText("Today")).not.toBeInTheDocument();
    expect(copyReportBtn).toBeNull();
    expect(goToCurrentDayBtn).toBeInTheDocument();
    expect(getByTestId("prev-button-test-id")).toBeInTheDocument();
    expect(getByTestId("next-button-test-id")).toBeInTheDocument();
  });

  it("renders correctly if date is not today and there is a report", () => {
    const { getByTestId, queryByRole, queryByText } = render(
      <DateSelector
        {...mockProps}
        selectedDate={new Date("1988-01-20")}
        selectedDateReport={"Content of the report"}
      />,
    );
    const copyReportBtn = queryByRole("button", { name: "Copy as today" });
    const goToCurrentDayBtn = queryByRole("button", { name: "Go to current day" });

    expect(queryByText("Today")).not.toBeInTheDocument();
    expect(copyReportBtn).toBeInTheDocument();
    expect(goToCurrentDayBtn).toBeInTheDocument();
    expect(getByTestId("prev-button-test-id")).toBeInTheDocument();
    expect(getByTestId("next-button-test-id")).toBeInTheDocument();
  });

  it("shows Dropbox icon when Dropbox is not connected", () => {
    const { getByTestId } = render(<DateSelector {...mockProps} isDropboxConnected={false} />);
    const dropboxIcon = getByTestId("dropbox-icon-test-id");
    expect(dropboxIcon).toBeInTheDocument();
  });

  it("does not show Dropbox icon when Dropbox is connected", async () => {
    const { queryByTestId } = render(<DateSelector {...mockProps} />);
    expect(queryByTestId("dropbox-icon-test-id")).not.toBeInTheDocument();
  });

  it("renders buttons that changing day, handlers are called", async () => {
    render(<DateSelector {...mockProps} />);
    const prevButton = screen.getByTestId("prev-button-test-id");
    const nextButton = screen.getByTestId("next-button-test-id");

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(prevButton);
    fireEvent.click(nextButton);

    expect(mockProps.setSelectedDate).toHaveBeenCalledTimes(2);
  });
});
