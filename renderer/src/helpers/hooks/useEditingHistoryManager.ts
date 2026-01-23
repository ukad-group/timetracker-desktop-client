import { useReducer, useCallback } from "react";
import {
  SET_VALUE,
  UNDO,
  REDO,
  setValue,
  undoEditing,
  redoEditing,
  EditingHistoryAction,
} from "@/actions/editingActions";

interface EditingHistoryState {
  undoStack: string[];
  redoStack: string[];
}

export const EditingHistoryReducer = <T>(
  state: EditingHistoryState,
  action: EditingHistoryAction,
): EditingHistoryState => {
  switch (action.type) {
    case SET_VALUE:
      if (state.undoStack[state.undoStack.length - 1] !== action.value) {
        return {
          undoStack: [...state.undoStack, action.value],
          redoStack: [],
        };
      }

      return state;

    case UNDO:
      if (state.undoStack.length > 1) {
        return {
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, state.undoStack[state.undoStack.length - 1]],
        };
      }

      return state;

    case REDO:
      if (state.redoStack.length > 0) {
        return {
          undoStack: [...state.undoStack, state.redoStack[state.redoStack.length - 1]],
          redoStack: state.redoStack.slice(0, -1),
        };
      }

      return state;

    default:
      return state;
  }
};

const useEditingHistoryManager = (initialValue: string) => {
  const editingHistoryState: EditingHistoryState = {
    undoStack: [initialValue],
    redoStack: [],
  };
  const [state, dispatch] = useReducer(EditingHistoryReducer, editingHistoryState);

  function findFirstDifferenceIndex(prevText, currentText) {
    const minLength = Math.min(prevText?.length, currentText?.length);
    for (let i = 0; i < minLength; i++) {
      if (prevText[i] !== currentText[i]) {
        return prevText > currentText ? i + prevText.length - currentText.length : i;
      }
    }

    return minLength;
  }

  const handleSetValue = useCallback((value: string) => dispatch(setValue(value)), [dispatch]);
  const handleUndoEditing = useCallback(() => {
    dispatch(undoEditing());

    if (state.undoStack.length > 2) {
      const changePlace = findFirstDifferenceIndex(
        state.undoStack[state.undoStack.length - 2],
        state.undoStack[state.undoStack.length - 1],
      );

      return [state.undoStack[state.undoStack.length - 2], changePlace];
    }
    return [state.undoStack[0], 0];
  }, [dispatch, state]);

  const handleRedoEditing = useCallback(() => {
    dispatch(redoEditing());

    const changePlace = findFirstDifferenceIndex(
      state.redoStack[state.redoStack.length - 1],
      state.undoStack[state.undoStack.length - 1],
    );

    return [state.redoStack[state.redoStack.length - 1], changePlace];
  }, [dispatch, state]);

  return {
    setValue: handleSetValue,
    undoEditing: handleUndoEditing,
    redoEditing: handleRedoEditing,
  };
};

export default useEditingHistoryManager;
