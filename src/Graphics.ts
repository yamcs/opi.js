import { Color } from "./Color";
import { Font } from "./Font";
import { HitCanvas } from "./HitCanvas";
import { HitRegionSpecification } from "./HitRegionSpecification";
import { Bounds, Dimension, NullablePoint, Point, shrink } from "./positioning";
import * as utils from "./utils";

interface RectColorFill {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
  rx?: number;
  ry?: number;
  opacity?: number;
}

interface RectGradientFill {
  x: number;
  y: number;
  width: number;
  height: number;
  gradient: CanvasGradient;
  rx?: number;
  ry?: number;
  opacity?: number;
}

type RectFill = RectColorFill | RectGradientFill;

interface TextFill {
  x: number;
  y: number;
  baseline: "top" | "middle" | "bottom";
  align: "left" | "right" | "center";
  font: Font;
  color: Color;
  text: string;
}

interface EllipseColorFill {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: Color;
  startAngle?: number;
  endAngle?: number;
  anticlockwise?: boolean;
  opacity?: number;
}

interface EllipseGradientFill {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gradient: CanvasGradient;
  startAngle?: number;
  endAngle?: number;
  anticlockwise?: boolean;
  opacity?: number;
}

type EllipseFill = EllipseColorFill | EllipseGradientFill;

interface EllipseColorStroke {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  lineWidth: number;
  color: Color;
  startAngle?: number;
  endAngle?: number;
  anticlockwise?: boolean;
  dash?: number[];
}

interface EllipseGradientStroke {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  lineWidth: number;
  gradient: CanvasGradient;
  startAngle?: number;
  endAngle?: number;
  anticlockwise?: boolean;
  dash?: number[];
}

type EllipseStroke = EllipseColorStroke | EllipseGradientStroke;

interface RectStroke {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
  rx?: number;
  ry?: number;
  lineWidth?: number;
  dash?: number[];
  crispen?: boolean;
}

interface PathStroke {
  path: Path;
  color: Color;
  lineWidth?: number;
  dash?: number[];
  opacity?: number;
}

interface PathColorFill {
  path: Path;
  color: Color;
  opacity?: number;
}

interface PathGradientFill {
  path: Path;
  gradient: CanvasGradient;
  opacity?: number;
}

type PathFill = PathColorFill | PathGradientFill;

export class Graphics {
  readonly ctx: CanvasRenderingContext2D;

  readonly hitCanvas: HitCanvas;
  readonly hitCtx: CanvasRenderingContext2D;

  constructor(readonly canvas: HTMLCanvasElement, hitCanvas?: HitCanvas) {
    this.ctx = canvas.getContext("2d")!;
    this.hitCanvas = hitCanvas ? hitCanvas : new HitCanvas();
    this.hitCtx = this.hitCanvas.ctx;
  }

  createChild(width: number, height: number) {
    const tmpHitCanvas = this.hitCanvas.createChild(width, height);
    const childCanvas = document.createElement("canvas");
    childCanvas.width = width;
    childCanvas.height = height;
    return new Graphics(childCanvas, tmpHitCanvas);
  }

  translate(x: number, y: number) {
    this.ctx.translate(x, y);
    this.hitCtx.translate(x, y);
  }

  copy(g: Graphics, dx: number, dy: number) {
    this.ctx.drawImage(g.canvas, dx, dy);
    g.hitCanvas.transferToParent(dx, dy, g.canvas.width, g.canvas.height);
  }

  copyFitted(g: Graphics, dx: number, dy: number, dw: number, dh: number) {
    const { width: sw, height: sh } = g.canvas;
    const ratio = sw / sh;
    let fitw = dw;
    let fith = fitw / ratio;
    if (fith > dh) {
      fith = dh;
      fitw = fith * ratio;
    }
    this.copyScaled(g, dx, dy, fitw, fith);
  }

  copyScaled(g: Graphics, dx: number, dy: number, dw: number, dh: number) {
    this.ctx.drawImage(g.canvas, dx, dy, dw, dh);
    g.hitCanvas.transferToParent(dx, dy, dw, dh);
  }

  clearHitCanvas() {
    this.hitCanvas.clear();
  }

  fillCanvas(color: Color) {
    this.ctx.fillStyle = color.toString();
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Perform a CSS-level rescale of the Canvas.
   *
   * This resamples the bitmapped canvas area to fit the area made available
   * by CSS.
   */
  scaleCanvas(width: number, height: number) {
    this.ctx.canvas.style.width = width + "px";
    this.ctx.canvas.style.height = height + "px";
  }

  resize(width: number, height: number) {
    // Careful not to reset dimensions all the time (it does lots of stuff)
    if (this.ctx.canvas.width != width || this.ctx.canvas.height != height) {
      this.ctx.canvas.width = width;
      this.ctx.canvas.height = height;
      this.hitCanvas.ctx.canvas.width = width;
      this.hitCanvas.ctx.canvas.height = height;
    }
  }

  fillRect(fill: RectFill) {
    if ("color" in fill) {
      this.ctx.fillStyle = fill.color.toString();
    } else {
      this.ctx.fillStyle = fill.gradient;
    }

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = fill.opacity;
    }

    if (fill.rx || fill.ry) {
      utils.roundRect(
        this.ctx,
        fill.x,
        fill.y,
        fill.width,
        fill.height,
        fill.rx || 0,
        fill.ry || 0
      );
      this.ctx.fill();
    } else {
      this.ctx.fillRect(fill.x, fill.y, fill.width, fill.height);
    }

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = 1;
    }
  }

  fillText(fill: TextFill) {
    this.ctx.textBaseline = fill.baseline;
    this.ctx.textAlign = fill.align;
    this.ctx.font = fill.font.getFontString();
    this.ctx.fillStyle = fill.color.toString();
    this.ctx.fillText(fill.text, fill.x, fill.y);
  }

  fillEllipse(fill: EllipseFill) {
    this.ctx.beginPath();
    const startAngle = fill.startAngle || 0;
    const endAngle = fill.endAngle === undefined ? 2 * Math.PI : fill.endAngle;
    this.ctx.ellipse(
      fill.cx,
      fill.cy,
      fill.rx,
      fill.ry,
      0,
      startAngle,
      endAngle,
      fill.anticlockwise
    );
    if ("color" in fill) {
      this.ctx.fillStyle = fill.color.toString();
    } else {
      this.ctx.fillStyle = fill.gradient;
    }

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = fill.opacity;
    }

    this.ctx.fill();

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = 1;
    }
  }

  strokeEllipse(stroke: EllipseStroke) {
    if (stroke.dash) {
      this.ctx.setLineDash(stroke.dash);
    }
    this.ctx.lineWidth = stroke.lineWidth || 1;
    this.ctx.beginPath();
    const startAngle = stroke.startAngle || 0;
    const endAngle =
      stroke.endAngle === undefined ? 2 * Math.PI : stroke.endAngle;
    this.ctx.ellipse(
      stroke.cx,
      stroke.cy,
      stroke.rx,
      stroke.ry,
      0,
      startAngle,
      endAngle,
      stroke.anticlockwise
    );
    if ("color" in stroke) {
      this.ctx.strokeStyle = stroke.color.toString();
    } else {
      this.ctx.strokeStyle = stroke.gradient;
    }
    this.ctx.stroke();
    if (stroke.dash) {
      this.ctx.setLineDash([]);
    }
  }

  measureText(text: string, font: Font, ceil = false): Dimension {
    this.ctx.font = font.getFontString();
    const fm = this.ctx.measureText(text);
    let dim: Dimension;
    if (fm.fontBoundingBoxAscent !== undefined && fm.fontBoundingBoxDescent !== undefined) {
      dim = { width: fm.width, height: fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent };
    } else {
      dim = { width: fm.width, height: font.height };
    }
    if (ceil) {
      dim.width = Math.ceil(dim.width);
      dim.height = Math.ceil(dim.height);
    }
    return dim;
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return this.ctx.createLinearGradient(x0, y0, x1, y1);
  }

  strokeRect(stroke: RectStroke) {
    if (stroke.dash) {
      this.ctx.setLineDash(stroke.dash);
    }
    const lineWidth = stroke.lineWidth || 1;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = stroke.color.toString();
    if (stroke.crispen && lineWidth) {
      const box = shrink(stroke, lineWidth / 2, lineWidth / 2);
      if (stroke.rx || stroke.ry) {
        utils.roundRect(
          this.ctx,
          box.x,
          box.y,
          box.width,
          box.height,
          stroke.rx || 0,
          stroke.ry || 0
        );
        this.ctx.stroke();
      } else {
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);
      }
    } else {
      if (stroke.rx || stroke.ry) {
        utils.roundRect(
          this.ctx,
          stroke.x,
          stroke.y,
          stroke.width,
          stroke.height,
          stroke.rx || 0,
          stroke.ry || 0
        );
        this.ctx.stroke();
      } else {
        this.ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
      }
    }
    if (stroke.dash) {
      this.ctx.setLineDash([]);
    }
  }

  strokePath(stroke: PathStroke) {
    if (stroke.dash) {
      this.ctx.setLineDash(stroke.dash);
    }
    this.ctx.beginPath();
    for (const segment of stroke.path.segments) {
      if (segment.line) {
        this.ctx.lineTo(segment.x, segment.y);
      } else {
        this.ctx.moveTo(segment.x, segment.y);
      }
    }
    this.ctx.lineWidth = stroke.lineWidth || 1;
    this.ctx.strokeStyle = stroke.color.toString();

    if (stroke.opacity !== undefined) {
      this.ctx.globalAlpha = stroke.opacity;
    }

    this.ctx.stroke();

    if (stroke.opacity !== undefined) {
      this.ctx.globalAlpha = 1;
    }
    if (stroke.dash) {
      this.ctx.setLineDash([]);
    }
  }

  fillPath(fill: PathFill) {
    this.ctx.beginPath();
    for (const segment of fill.path.segments) {
      if (segment.line) {
        this.ctx.lineTo(segment.x, segment.y);
      } else {
        this.ctx.moveTo(segment.x, segment.y);
      }
    }
    if ("color" in fill) {
      this.ctx.fillStyle = fill.color.toString();
    } else {
      this.ctx.fillStyle = fill.gradient;
    }

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = fill.opacity;
    }

    this.ctx.fill("evenodd"); // Match with Draw2D behavior

    if (fill.opacity !== undefined) {
      this.ctx.globalAlpha = 1;
    }
  }

  addHitRegion(region: HitRegionSpecification) {
    this.hitCanvas.beginHitRegion(region);
    return new HitRegionBuilder(this.hitCanvas.ctx);
  }
}

interface PathSegment {
  x: number;
  y: number;
  line: boolean;
}

export class Path {
  segments: PathSegment[] = [];

  constructor(x: number, y: number) {
    this.segments.push({ x, y, line: false });
  }

  static fromPoints(points: NullablePoint[]) {
    const startIndex = points.findIndex(point => point.y !== null);
    if (startIndex === -1) {
      const path = new Path(0, 0);
      path.segments.length = 0
      return path;
    }

    const path = new Path(points[startIndex].x, points[startIndex].y!);
    for (let i = startIndex + 1; i < points.length; i++) {
      const { x, y } = points[i];
      if (y === null) {
        continue;
      }
      if (i > 0 && points[i - 1].y === null) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    return path;
  }

  getBoundingBox(): Bounds {
    const tl: Point = { x: this.segments[0].x, y: this.segments[0].y };
    const br: Point = { x: this.segments[0].x, y: this.segments[0].y };
    for (let i = 0; i < this.segments.length; i++) {
      const point = this.segments[i];
      if (point.x < tl.x) {
        tl.x = point.x;
      }
      if (point.x > br.x) {
        br.x = point.x;
      }
      if (point.y < tl.y) {
        tl.y = point.y;
      }
      if (point.y > br.y) {
        br.y = point.y;
      }
    }
    return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }

  lineTo(x: number, y: number) {
    this.segments.push({ x, y, line: true });
    return this;
  }

  moveTo(x: number, y: number) {
    this.segments.push({ x, y, line: false });
    return this;
  }

  closePath() {
    const orig = this.segments[0];
    this.segments.push({ x: orig.x, y: orig.y, line: true });
    return this;
  }

  translate(x: number, y: number) {
    for (const point of this.segments) {
      point.x += x;
      point.y += y;
    }
    return this;
  }
}

export class HitRegionBuilder {
  constructor(private ctx: CanvasRenderingContext2D) { }

  addRect(x: number, y: number, width: number, height: number) {
    this.ctx.fillRect(x, y, width, height);
    return this;
  }

  addEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) {
    this.ctx.beginPath();
    this.ctx.ellipse(
      cx,
      cy,
      rx,
      ry,
      rotation,
      startAngle,
      endAngle,
      anticlockwise
    );
    this.ctx.fill();
  }

  addPath(path: Path) {
    this.ctx.beginPath();
    for (const segment of path.segments) {
      if (segment.line) {
        this.ctx.lineTo(segment.x, segment.y);
      } else {
        this.ctx.moveTo(segment.x, segment.y);
      }
    }
    this.ctx.fill();
  }
}
