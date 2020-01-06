export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
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
