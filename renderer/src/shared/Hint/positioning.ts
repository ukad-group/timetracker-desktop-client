import { computePosition } from "@floating-ui/dom";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Position } from "./types";
import { positioningTop, positioningRight, positioningBottom, positioningLeft } from "./utils";
import { PLACEMENTS } from "./constants";
import { KEY_CODES } from "@/helpers/constants";

export const positioning = (
  learnHint: () => void,
  referenceRef: MutableRefObject<any>,
  floatingRef: MutableRefObject<any>,
  SVGRef: MutableRefObject<any>,
  learningMethod: "buttonClick" | "nextClick" | "ctrlArrowNumberPress",
  position: Position,
  showHint: boolean,
  shiftY: number,
  shiftX: number,
  HorizontalLineRef: MutableRefObject<any>,
  VerticalLineRef: MutableRefObject<any>,
  TriangleRef: MutableRefObject<any>,
  setShowHint: Dispatch<SetStateAction<boolean>>,
): void => {
  const handleKeyDown = (e) => {
    if (
      (e.ctrlKey && e.key === KEY_CODES.ARROW_UP) ||
      (e.key === KEY_CODES.META && e.key === KEY_CODES.ARROW_UP) ||
      ((e.ctrlKey || e.key === KEY_CODES.CONTROL || e.key === KEY_CODES.META) && /^[0-9]$/.test(e.key))
    ) {
      learnHint();
    }
  };
  if (referenceRef.current && floatingRef.current && SVGRef.current) {
    const hintHeight = floatingRef.current.offsetHeight;
    const hintWidth = floatingRef.current.offsetWidth;
    const HorizontalLine = HorizontalLineRef.current;
    const VerticalLine = VerticalLineRef.current;

    switch (learningMethod) {
      case "buttonClick":
        referenceRef.current.addEventListener("click", () => {
          learnHint();
        });
        break;

      case "ctrlArrowNumberPress":
        window.addEventListener("keydown", handleKeyDown);
        break;
    }

    computePosition(referenceRef.current, floatingRef.current, {
      placement: position.basePosition,
    })
      .then(({ x, y }) => {
        if (showHint) {
          Object.assign(referenceRef.current.style, {
            "z-index": "50",
            position: "relative",
          });
        } else {
          Object.assign(referenceRef.current.style, {
            "z-index": null,
          });
        }

        switch (position.basePosition) {
          case PLACEMENTS.TOP:
            positioningTop(
              position,
              floatingRef,
              SVGRef,
              TriangleRef,
              shiftY,
              shiftX,
              y,
              x,
              hintWidth,
              hintHeight,
              HorizontalLine,
              VerticalLine,
            );
            break;

          case PLACEMENTS.RIGHT:
            positioningRight(
              position,
              floatingRef,
              SVGRef,
              TriangleRef,
              shiftY,
              shiftX,
              y,
              x,
              hintWidth,
              hintHeight,
              HorizontalLine,
              VerticalLine,
            );
            break;

          case PLACEMENTS.BOTTOM:
            positioningBottom(
              position,
              floatingRef,
              SVGRef,
              TriangleRef,
              shiftY,
              shiftX,
              y,
              x,
              hintWidth,
              hintHeight,
              HorizontalLine,
              VerticalLine,
            );
            break;

          case PLACEMENTS.LEFT:
            positioningLeft(
              position,
              floatingRef,
              SVGRef,
              TriangleRef,
              shiftY,
              shiftX,
              y,
              x,
              hintWidth,
              hintHeight,
              HorizontalLine,
              VerticalLine,
            );
            break;

          default:
            setShowHint(false);
        }
      })
      .catch((error) => {
        console.error("Error in computing position:", error);
      });
  }
};
