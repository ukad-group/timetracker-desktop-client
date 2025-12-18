import useEditingHistoryManager, { EditingHistoryReducer } from "../useEditingHistoryManager";
import { SET_VALUE, UNDO, REDO } from "@/actions/editingActions";
import { renderHook, act } from "@testing-library/react";

describe("GIVEN EditingHistoryReducer", () => {
  it("should handle SET_VALUE action", () => {
    const initialState = {
      undoStack: ["initialValue"],
      redoStack: [],
    };

    const action = {
      type: SET_VALUE,
      value: "newValue",
    };

    // @ts-ignore
    const newState = EditingHistoryReducer(initialState, action);

    expect(newState).toEqual({
      undoStack: ["initialValue", "newValue"],
      redoStack: [],
    });
  });

  it("should not add the same value to undoStack multiple times in a row", () => {
    const initialState = {
      undoStack: ["value"],
      redoStack: [],
    };

    const action = {
      type: SET_VALUE,
      value: "value",
    };

    // @ts-ignore
    const newState = EditingHistoryReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it("should handle UNDO action", () => {
    const initialState = {
      undoStack: ["value1", "value2"],
      redoStack: [],
    };

    const action = {
      type: UNDO,
    };

    // @ts-ignore
    const newState = EditingHistoryReducer(initialState, action);

    expect(newState).toEqual({
      undoStack: ["value1"],
      redoStack: ["value2"],
    });
  });

  it("should handle REDO action", () => {
    const initialState = {
      undoStack: ["value1"],
      redoStack: ["value2"],
    };

    const action = {
      type: REDO,
    };

    // @ts-ignore
    const newState = EditingHistoryReducer(initialState, action);

    expect(newState).toEqual({
      undoStack: ["value1", "value2"],
      redoStack: [],
    });
  });

  it("should return the same state for unknown action types", () => {
    const initialState = {
      undoStack: ["value"],
      redoStack: [],
    };

    const action = {
      type: "UNKNOWN_ACTION_TYPE",
    };

    // @ts-ignore
    const newState = EditingHistoryReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });
});

describe("GIVEN useEditingHistoryManager", () => {
  it("should initialize with the correct state", () => {
    const initialValue = "initialValue";
    const { result } = renderHook(() => useEditingHistoryManager(initialValue));

    expect(result.current).toEqual({
      setValue: expect.any(Function),
      undoEditing: expect.any(Function),
      redoEditing: expect.any(Function),
    });

    // Wrap in act() since undoEditing dispatches state updates
    let undoResult;
    act(() => {
      undoResult = result.current.undoEditing();
    });
    expect(undoResult).toEqual([initialValue, 0]);
  });

  it("should handle undoEditing correctly", () => {
    const { result } = renderHook(() => useEditingHistoryManager("initial"));

    act(() => {
      result.current.setValue("new");
    });

    act(() => {
      result.current.undoEditing();
    });

    // Wrap in act() since undoEditing dispatches state updates
    let undoResult;
    act(() => {
      undoResult = result.current.undoEditing();
    });
    expect(undoResult).toEqual(["initial", 0]);
  });
});
