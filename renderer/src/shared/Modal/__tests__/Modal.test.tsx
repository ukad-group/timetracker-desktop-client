import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Modal from "../Modal";

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("GIVEN Modal", () => {
  test("renders modal with title", async () => {
    const onCloseMock = jest.fn();
    const onSubmitMock = jest.fn();

    await act(async () => {
      render(
        <Modal isOpen={true} title="Test Modal" onClose={onCloseMock} onSubmit={onSubmitMock}>
          <div>Mocked component</div>
        </Modal>,
      );
    });

    // Wait for transitions to complete
    await waitFor(() => {
      const titleElement = screen.getByText(/Test Modal/i);
      expect(titleElement).toBeInTheDocument();
    });
  });

  test("calls onClose when close button is clicked", async () => {
    const onCloseMock = jest.fn();
    const onSubmitMock = jest.fn();

    await act(async () => {
      render(
        <Modal isOpen={true} title="Test Modal" onClose={onCloseMock} onSubmit={onSubmitMock}>
          <div>Mocked component</div>
        </Modal>,
      );
    });

    await waitFor(() => {
      const closeButton = screen.getByRole("button", { name: /Close/i });
      expect(closeButton).toBeInTheDocument();
    });

    await act(async () => {
      const closeButton = screen.getByRole("button", { name: /Close/i });
      fireEvent.click(closeButton);
    });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test("traps keyboard focus inside the modal", async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(
        <>
          <button>Outside</button>
          <Modal isOpen={true} title="Test Modal" onClose={jest.fn()} onSubmit={jest.fn()}>
            <input aria-label="Inside" data-autofocus="true" />
          </Modal>
        </>,
      );
    });

    await waitFor(() => {
      expect(document.querySelectorAll("[data-headlessui-focus-guard]")).toHaveLength(2);
    });

    const outsideButton = screen.getByRole("button", { name: "Outside" });

    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(outsideButton).not.toHaveFocus();
      expect(document.activeElement).not.toBe(document.body);
    }
  });
});
