import { Color } from "../../Color";
import { Display } from "../../Display";
import { Graphics } from "../../Graphics";
import {
  convertCartesianToPolar,
  halfPixelPoints,
  Point,
  PolarPoint,
  scalePoints,
  translatePoint,
} from "../../positioning";
import {
  BooleanProperty,
  FloatProperty,
  IntProperty,
  PointsProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_ALPHA = "alpha";
const PROP_ARROWS = "arrows";
const PROP_ARROW_LENGTH = "arrow_length";
const PROP_FILL_ARROW = "fill_arrow";
const PROP_FILL_LEVEL = "fill_level";
const PROP_HORIZONTAL_FILL = "horizontal_fill";
const PROP_LINE_WIDTH = "line_width";
const PROP_POINTS = "points";

export class Polyline extends Widget {
  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new IntProperty(PROP_ALPHA, 255));
    this.properties.add(new IntProperty(PROP_LINE_WIDTH));
    this.properties.add(new FloatProperty(PROP_FILL_LEVEL));
    this.properties.add(new BooleanProperty(PROP_HORIZONTAL_FILL));
    this.properties.add(new PointsProperty(PROP_POINTS, []));
    this.properties.add(new IntProperty(PROP_ARROW_LENGTH));
    this.properties.add(new BooleanProperty(PROP_FILL_ARROW));
    this.properties.add(new IntProperty(PROP_ARROWS));
  }

  draw(g: Graphics) {
    const ctx = g.ctx;
    ctx.globalAlpha = this.alpha / 255;
    if (this.transparent) {
      ctx.globalAlpha = 0;
    }
    this.drawShape(ctx, this.backgroundColor);
    if (this.fillLevel) {
      this.drawFill(ctx);
    }

    ctx.globalAlpha = 1;
  }

  private drawFill(ctx: CanvasRenderingContext2D) {
    let fillY = this.y;
    let fillWidth = this.width;
    let fillHeight = this.height;
    if (this.horizontalFill) {
      fillWidth *= this.fillLevel / 100;
    } else {
      fillHeight *= this.fillLevel / 100;
      fillY += fillHeight;
    }

    // Create a clip for the fill level
    ctx.save();
    let x = this.x - this.lineWidth / 2;
    let y = fillY - this.lineWidth / 2;
    let width = fillWidth + this.lineWidth;
    let height = fillHeight + this.lineWidth;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    // With clip active, draw the actual fill
    this.drawShape(ctx, this.foregroundColor);

    // Reset clip
    ctx.restore();
  }

  private drawShape(ctx: CanvasRenderingContext2D, color: Color) {
    ctx.strokeStyle = color.toString();
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      if (i === 0) {
        ctx.moveTo(this.points[i].x, this.points[i].y);
      } else {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
    }
    ctx.stroke();

    if (this.points.length >= 2) {
      const firstPoint = this.points[0];
      const lastPoint = this.points[this.points.length - 1];
      if (this.arrows === 2 || this.arrows === 3) {
        // To or Both
        const arrowPoints = this.calculateArrowPoints(
          this.points[this.points.length - 2],
          lastPoint
        );
        arrowPoints[2] = lastPoint;

        if (this.fillArrow) {
          ctx.fillStyle = color.toString();
          ctx.beginPath();
          for (let i = 0; i < arrowPoints.length; i++) {
            if (i === 0) {
              ctx.moveTo(arrowPoints[i].x, arrowPoints[i].y);
            } else {
              ctx.lineTo(arrowPoints[i].x, arrowPoints[i].y);
            }
          }
          ctx.fill();
        } else {
          ctx.strokeStyle = color.toString();
          ctx.lineWidth = this.lineWidth;
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(arrowPoints[0].x, arrowPoints[0].y);
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(arrowPoints[1].x, arrowPoints[1].y);
          ctx.stroke();
        }
      }
      if (this.arrows === 1 || this.arrows === 3) {
        // From or Both
        const arrowPoints = this.calculateArrowPoints(
          this.points[1],
          firstPoint
        );
        arrowPoints[2] = firstPoint;
        if (this.fillArrow) {
          ctx.fillStyle = color.toString();
          ctx.beginPath();
          for (let i = 0; i < arrowPoints.length; i++) {
            if (i === 0) {
              ctx.moveTo(arrowPoints[i].x, arrowPoints[i].y);
            } else {
              ctx.lineTo(arrowPoints[i].x, arrowPoints[i].y);
            }
          }
          ctx.fill();
        } else {
          ctx.strokeStyle = color.toString();
          ctx.lineWidth = this.lineWidth;
          ctx.beginPath();
          ctx.moveTo(firstPoint.x, firstPoint.y);
          ctx.lineTo(arrowPoints[0].x, arrowPoints[0].y);
          ctx.moveTo(firstPoint.x, firstPoint.y);
          ctx.lineTo(arrowPoints[1].x, arrowPoints[1].y);
          ctx.stroke();
        }
      }
    }
  }

  private calculateArrowPoints(startPoint: Point, endPoint: Point): Point[] {
    const ppE = convertCartesianToPolar(endPoint, startPoint);
    const angle = Math.PI / 10;

    const ppR = new PolarPoint(this.arrowLength, ppE.theta - angle);
    const ppL = new PolarPoint(this.arrowLength, ppE.theta + angle);

    // Intersection point between arrow and line.
    const ppI = new PolarPoint(
      Math.floor(this.arrowLength * Math.cos(angle)),
      ppE.theta
    );

    const pR = translatePoint(ppR.toPoint(), endPoint.x, endPoint.y);
    const pL = translatePoint(ppL.toPoint(), endPoint.x, endPoint.y);
    const pI = translatePoint(ppI.toPoint(), endPoint.x, endPoint.y);
    return [pR, pL, pI];
  }

  get alpha(): number {
    return this.properties.getValue(PROP_ALPHA);
  }
  get lineWidth(): number {
    return this.scale * this.properties.getValue(PROP_LINE_WIDTH);
  }
  get fillLevel(): number {
    return this.properties.getValue(PROP_FILL_LEVEL);
  }
  get horizontalFill(): boolean {
    return this.properties.getValue(PROP_HORIZONTAL_FILL);
  }
  get points(): Point[] {
    const scaled = scalePoints(this.properties.getValue(PROP_POINTS), this.scale);
    return halfPixelPoints(scaled);
  }
  get arrows(): number {
    return this.properties.getValue(PROP_ARROWS);
  }
  get fillArrow(): boolean {
    return this.properties.getValue(PROP_FILL_ARROW);
  }
  get arrowLength(): number {
    return this.properties.getValue(PROP_ARROW_LENGTH);
  }
}
