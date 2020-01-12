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

export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): Point {
  // double trueAngle = Math.toRadians(angle);
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  // Relative coordinates to the rotation point
  const relX = x - cx;
  const relY = y - cy;

  const temp = relX * cos - relY * sin;

  return { x: temp + cx, y: (relX * sin + relY * cos) + cy };
}

export function shrink(original: Bounds, v: number, h: number): Bounds {
  return {
    x: original.x + h,
    y: original.y + v,
    width: original.width - (h + h),
    height: original.height - (v + v),
  }
}

export function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

export function convertPolarToCartesian(r: number, theta: number, bounds: Bounds): Point {
  const x = Math.floor(r * Math.cos(theta));
  const y = Math.floor(-r * Math.sin(theta));
  return {
    x: bounds.x + bounds.width / 2 + x,
    y: bounds.y + bounds.height / 2 + y,
  };
}
