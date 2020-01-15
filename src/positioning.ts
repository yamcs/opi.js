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
 * coordinates. This is effectively the same as shrinking by
 * half the stroke size.
 */
export function toBorderBox(x: number, y: number, width: number, height: number, lineWidth: number): Bounds {
  return shrink({ x, y, width, height }, lineWidth / 2);
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

/**
 * Returns new bounds where the width and height are shrinked.
 */
export function shrink(original: Bounds, v: number, h?: number): Bounds {
  if (h === undefined) {
    h = v;
  }
  return {
    x: original.x + h,
    y: original.y + v,
    width: original.width - (h + h),
    height: original.height - (v + v),
  }
}

export function translatePoint(point: Point, dx: number, dy: number) {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

export function translatePoints(points: Point[], dx: number, dy: number) {
  return points.map(point => translatePoint(point, dx, dy));
}

export function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

export function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(((p2.x - p1.x) * (p2.x - p1.x)) + ((p2.y - p1.y) * (p2.y - p1.y)));
}

export function findRelativePoint(p0: Point, p1: Point, distanceRatio: number): Point {
  const d = getDistance(p0, p1);
  const t = distanceRatio / d;
  return {
    x: ((1 - t) * p0.x) + (t * p1.x),
    y: ((1 - t) * p0.y) + (t * p1.y),
  };
}

export function convertPolarToCartesian(r: number, theta: number, bounds: Bounds): Point {
  const x = Math.floor(r * Math.cos(theta));
  const y = Math.floor(-r * Math.sin(theta)); // hmm
  return {
    x: bounds.x + bounds.width / 2 + x,
    y: bounds.y + bounds.height / 2 + y,
  };
}

export function convertPolarToCartesian2(rx: number, ry: number, theta: number): Point {
  const x = Math.floor(rx * Math.cos(theta));
  const y = Math.floor(ry * Math.sin(theta));
  return { x, y };
}
