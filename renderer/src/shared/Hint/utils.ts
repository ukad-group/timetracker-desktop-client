import { RefObject } from "react";
import { Position } from "./types";
import { PLACEMENTS } from "./constants";

export const positioningTop = (
  position: Position,
  floatingRef: RefObject<HTMLDivElement>,
  SVGRef: RefObject<SVGSVGElement>,
  TriangleRef: RefObject<HTMLDivElement>,
  shiftY: number,
  shiftX: number,
  y: number,
  x: number,
  hintWidth: number,
  hintHeight: number,
  HorizontalLine: HTMLElement,
  VerticalLine: HTMLElement,
) => {
  Object.assign(floatingRef.current.style, {
    top: `${y - shiftY}px`,
  });
  Object.assign(SVGRef.current.style, {
    top: `${y}px`,
    width: `${hintWidth / 2 + shiftX + 5}`,
  });

  HorizontalLine.setAttribute("y1", `${hintHeight / 2 - shiftY}`);
  HorizontalLine.setAttribute("y2", `${hintHeight / 2 - shiftY}`);

  VerticalLine.setAttribute("y1", `${hintHeight / 2 - shiftY}`);
  VerticalLine.setAttribute("y2", `${hintHeight}`);

  if (position.diagonalPosition === PLACEMENTS.RIGHT) {
    HorizontalLine.setAttribute("x1", "5");
    HorizontalLine.setAttribute("x2", `${shiftX - hintWidth / 2}`);

    VerticalLine.setAttribute("x1", "5");
    VerticalLine.setAttribute("x2", "5");

    TriangleRef.current.setAttribute(
      "points",
      `${0}, ${hintHeight - 10}
                ${5}, ${hintHeight}
                ${10},  ${hintHeight - 10} `,
    );

    Object.assign(floatingRef.current.style, {
      left: `${x + shiftX}px`,
    });
    Object.assign(SVGRef.current.style, {
      left: `${x + hintWidth / 2}px`,
    });
  }
  if (position.diagonalPosition === PLACEMENTS.LEFT) {
    HorizontalLine.setAttribute("x1", `${shiftX + hintWidth / 2}`);
    HorizontalLine.setAttribute("x2", `${hintWidth}`);

    VerticalLine.setAttribute("x1", `${shiftX + hintWidth / 2}`);
    VerticalLine.setAttribute("x2", `${shiftX + hintWidth / 2}`);

    TriangleRef.current.setAttribute(
      "points",
      `${shiftX + hintWidth / 2 - 5}, ${hintHeight - 10}
                ${shiftX + hintWidth / 2}, ${hintHeight}
                ${shiftX + hintWidth / 2 + 5},  ${hintHeight - 10} `,
    );

    Object.assign(floatingRef.current.style, {
      left: `${x - shiftX}px`,
    });
    Object.assign(SVGRef.current.style, {
      left: `${x - shiftX}px`,
    });
  }
};

export const positioningRight = (
  position: Position,
  floatingRef: RefObject<HTMLDivElement>,
  SVGRef: RefObject<SVGSVGElement>,
  TriangleRef: RefObject<HTMLDivElement>,
  shiftY: number,
  shiftX: number,
  y: number,
  x: number,
  hintWidth: number,
  hintHeight: number,
  HorizontalLine: HTMLElement,
  VerticalLine: HTMLElement,
) => {
  Object.assign(floatingRef.current.style, {
    left: `${x + shiftX}px`,
  });
  Object.assign(SVGRef.current.style, {
    top: `${y - shiftY}px`,
    left: `${x}px`,
    width: `${hintWidth / 2 + shiftX + 1}`,
  });

  HorizontalLine.setAttribute("x1", `${0}`);
  HorizontalLine.setAttribute("x2", `${hintWidth / 2 + shiftX}`);
  HorizontalLine.setAttribute("y1", `${hintHeight / 2 + shiftY}`);
  HorizontalLine.setAttribute("y2", `${hintHeight / 2 + shiftY}`);

  VerticalLine.setAttribute("x1", `${hintWidth / 2 + shiftX}`);
  VerticalLine.setAttribute("x2", `${hintWidth / 2 + shiftX}`);
  VerticalLine.setAttribute("y1", `${hintHeight / 2 + shiftY}`);

  TriangleRef.current.setAttribute(
    "points",
    `${10}, ${hintHeight / 2 + shiftY - 5}
              ${0}, ${hintHeight / 2 + shiftY}
              ${10},  ${hintHeight / 2 + shiftY + 5} `,
  );

  if (position.diagonalPosition === PLACEMENTS.TOP) {
    VerticalLine.setAttribute("y2", `${hintHeight}`);

    Object.assign(floatingRef.current.style, {
      top: `${y - shiftY}px`,
    });
  } else if (position.diagonalPosition === PLACEMENTS.BOTTOM) {
    VerticalLine.setAttribute("y2", `${hintHeight / 2 + shiftY * 2}`);

    Object.assign(SVGRef.current.style, {
      height: `${hintHeight + shiftY * 2}`,
    });
    Object.assign(floatingRef.current.style, {
      top: `${y + shiftY}px`,
    });
  }
};

export const positioningBottom = (
  position: Position,
  floatingRef: RefObject<HTMLDivElement>,
  SVGRef: RefObject<SVGSVGElement>,
  TriangleRef: RefObject<HTMLDivElement>,
  shiftY: number,
  shiftX: number,
  y: number,
  x: number,
  hintWidth: number,
  hintHeight: number,
  HorizontalLine: HTMLElement,
  VerticalLine: HTMLElement,
) => {
  Object.assign(floatingRef.current.style, {
    top: `${y + shiftY}px`,
  });
  Object.assign(SVGRef.current.style, {
    top: `${y}px`,
    width: `${hintWidth / 2 + shiftX + 5}`,
  });

  VerticalLine.setAttribute("y1", "0");
  VerticalLine.setAttribute("y2", `${shiftY + hintHeight / 2}`);

  HorizontalLine.setAttribute("y1", `${shiftY + hintHeight / 2}`);
  HorizontalLine.setAttribute("y2", `${shiftY + hintHeight / 2}`);

  if (position.diagonalPosition === PLACEMENTS.RIGHT) {
    HorizontalLine.setAttribute("x1", "5");
    HorizontalLine.setAttribute("x2", `${shiftX}`);

    VerticalLine.setAttribute("x1", "5");
    VerticalLine.setAttribute("x2", "5");

    TriangleRef.current.setAttribute(
      "points",
      `${0}, ${10}
                  ${5}, ${0}
                  ${10},  ${10} `,
    );

    Object.assign(floatingRef.current.style, {
      left: `${x + shiftX}px`,
    });
    Object.assign(SVGRef.current.style, {
      left: `${x + hintWidth / 2}px`,
    });
  } else if (position.diagonalPosition === PLACEMENTS.LEFT) {
    HorizontalLine.setAttribute("x1", `${hintWidth}`);
    HorizontalLine.setAttribute("x2", `${hintWidth / 2 + shiftX}`);

    VerticalLine.setAttribute("x1", `${hintWidth / 2 + shiftX}`);
    VerticalLine.setAttribute("x2", `${hintWidth / 2 + shiftX}`);

    TriangleRef.current.setAttribute(
      "points",
      `${hintWidth / 2 + shiftX - 5}, ${10}
                  ${hintWidth / 2 + shiftX}, ${0}
                  ${hintWidth / 2 + shiftX + 5},  ${10} `,
    );

    Object.assign(floatingRef.current.style, {
      left: `${x - shiftX}px`,
    });
    Object.assign(SVGRef.current.style, {
      left: `${x - shiftX}px`,
    });
  }
};

export const positioningLeft = (
  position: Position,
  floatingRef: RefObject<HTMLDivElement>,
  SVGRef: RefObject<SVGSVGElement>,
  TriangleRef: RefObject<HTMLDivElement>,
  shiftY: number,
  shiftX: number,
  y: number,
  x: number,
  hintWidth: number,
  hintHeight: number,
  HorizontalLine: HTMLElement,
  VerticalLine: HTMLElement,
) => {
  Object.assign(floatingRef.current.style, {
    left: `${x - shiftX}px`,
  });
  Object.assign(SVGRef.current.style, {
    top: `${y - shiftY}px`,
    left: `${x - shiftX}px`,
    width: `${hintWidth + shiftX}`,
    height: `${hintHeight + shiftY}`,
  });

  HorizontalLine.setAttribute("x1", `${hintWidth / 2}`);
  HorizontalLine.setAttribute("x2", `${hintWidth + shiftX}`);
  HorizontalLine.setAttribute("y1", `${hintHeight / 2 + shiftY}`);
  HorizontalLine.setAttribute("y2", `${hintHeight / 2 + shiftY}`);

  VerticalLine.setAttribute("x1", `${hintWidth / 2}`);
  VerticalLine.setAttribute("x2", `${hintWidth / 2}`);
  VerticalLine.setAttribute("y1", `${hintHeight / 2 + shiftY}`);

  TriangleRef.current.setAttribute(
    "points",
    `${hintWidth + shiftX - 10}, ${hintHeight / 2 + shiftY - 5}
              ${hintWidth + shiftX}, ${hintHeight / 2 + shiftY}
              ${hintWidth + shiftX - 10},  ${hintHeight / 2 + shiftY + 5} `,
  );

  if (position.diagonalPosition === PLACEMENTS.TOP) {
    VerticalLine.setAttribute("y2", `${hintHeight}`);

    Object.assign(floatingRef.current.style, {
      top: `${y - shiftY}px`,
    });
  } else if (position.diagonalPosition === PLACEMENTS.BOTTOM) {
    VerticalLine.setAttribute("y2", `${hintHeight / 2 + shiftY * 2}`);

    Object.assign(SVGRef.current.style, {
      height: `${hintHeight + shiftY * 2}`,
    });
    Object.assign(floatingRef.current.style, {
      top: `${y + shiftY}px`,
    });
  }
};
