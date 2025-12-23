import { ReactNode, RefObject } from "react";

export type Position =
  | {
      basePosition: "bottom";
      diagonalPosition: "left" | "right";
    }
  | {
      basePosition: "top";
      diagonalPosition: "left" | "right";
    }
  | {
      basePosition: "left";
      diagonalPosition: "bottom" | "top";
    }
  | {
      basePosition: "right";
      diagonalPosition: "bottom" | "top";
    };

export type HintProps = {
  ignoreSkip?: boolean;
  displayCondition?: boolean;
  learningMethod: "buttonClick" | "nextClick" | "ctrlArrowNumberPress";
  order: number;
  groupName: string;
  children: ReactNode;
  referenceRef: RefObject<HTMLDivElement>;
  shiftY: number;
  shiftX: number;
  width: "small" | "medium" | "large";
  position: Position;
};
