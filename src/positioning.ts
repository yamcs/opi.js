export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Sets the specified attributes assuming they use border-box
 * coordinates.
 */
export function toBorderBox(x: number, y: number, width: number, height: number, lineWidth: number): Bounds {
  x = x + (lineWidth / 2.0);
  y = y + (lineWidth / 2.0);
  width = width - lineWidth;
  height = height - lineWidth;

  return { x, y, width, height };
}

export function outline(x: number, y: number, width: number, height: number, strokeWidth: number): Bounds {
  const inset = Math.max(1, strokeWidth) / 2.0;
  const inset1 = Math.floor(inset);
  const inset2 = Math.ceil(inset);
  return {
    x: x + inset1,
    y: y + inset1,
    width: width - inset1 - inset2,
    height: height - inset1 - inset2,
  };
}
