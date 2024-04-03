import { Color } from "../../../Color";
import { Graphics, Path } from "../../../Graphics";
import { NullablePoint, Point } from "../../../positioning";
import { HistoricalDataProvider } from "../../../pv/HistoricalDataProvider";
import { PV, PVListener } from "../../../pv/PV";
import { TraceBuffer } from "./TraceBuffer";
import { XYGraph } from "./XYGraph";

export class Trace {
  private traceData?: TraceBuffer;
  private historicalDataProvider?: HistoricalDataProvider;

  private xPVInstance?: PV;
  private yPVInstance?: PV;

  private xPVListener: PVListener = () => {
    const pv = this.xPVInstance;
    if (!pv) {
      return;
    }
    if (Array.isArray(pv.value)) {
      this.traceData?.updateXArray(pv.value);
    } else {
      const numberValue = pv.toNumber();
      if (numberValue !== undefined && numberValue !== null) {
        this.traceData?.updateX(numberValue);
      }
    }
  };

  private yPVListener: PVListener = () => {
    const pv = this.yPVInstance;
    if (!pv) {
      return;
    }
    if (Array.isArray(pv.value)) {
      this.traceData?.updateYArray(pv.value);
    } else {
      const xAxis = this.widget.getAxis(this.xAxisIndex);
      const numberValue = pv.toNumber();
      if (numberValue !== undefined && numberValue !== null) {
        if (xAxis.isDateEnabled()) {
          const t = (pv.time || new Date()).getTime();
          this.traceData?.updateY(numberValue, t);
        } else {
          this.traceData?.updateY(numberValue);
        }
      }
    }
  };

  constructor(private widget: XYGraph, private i: number) { }

  init() {
    const { bufferSize, plotMode, updateMode, concatenateData, widget } = this;
    const chronological = !this.xPV;
    const { pvEngine } = widget.display;

    this.historicalDataProvider = undefined;
    if (chronological && this.yPV) {
      this.historicalDataProvider = pvEngine.createHistoricalDataProvider(this.yPV, widget) || undefined;
    }

    this.traceData = new TraceBuffer(
      bufferSize,
      plotMode,
      updateMode,
      concatenateData,
      chronological,
      this.historicalDataProvider,
    );
    if (this.xPV) {
      this.xPVInstance = pvEngine.createPV(this.xPV);
      this.xPVInstance.addListener(this.xPVListener);
    }
    if (this.yPV) {
      this.yPVInstance = pvEngine.createPV(this.yPV);
      this.yPVInstance.addListener(this.yPVListener);
    }

    widget.addPropertyListener(`trace_${this.i}_x_pv`, () => {
      const pv = pvEngine.createPV(this.xPV);
      if (pv !== this.xPVInstance) {
        this.xPVInstance?.removeListener(this.xPVListener);
        this.xPVInstance = pv;
        this.xPVInstance.addListener(this.xPVListener);
      }
    });

    widget.addPropertyListener(`trace_${this.i}_y_pv`, () => {
      const pv = pvEngine.createPV(this.yPV);
      if (pv !== this.yPVInstance) {
        this.yPVInstance?.removeListener(this.yPVListener);
        this.yPVInstance = pv;
        this.yPVInstance.addListener(this.yPVListener);
      }
    });
  }

  snapshot() {
    return this.traceData?.snapshot() || [];
  }

  drawTrace(g: Graphics, points: NullablePoint[]) {
    const { lineWidth } = this;
    if (this.traceType === 0) {
      // Solid Line
      g.strokePath({
        path: Path.fromPoints(points),
        color: this.traceColor,
        lineWidth,
      });
    } else if (this.traceType === 1) {
      // Dash Line
      g.strokePath({
        path: Path.fromPoints(points),
        color: this.traceColor,
        lineWidth,
        dash: [6 * this.scale, 2 * this.scale],
      });
    } else if (this.traceType === 2) {
      // Point
      // Nothing to do
    } else if (this.traceType === 3) {
      // Bar
      const yAxis = this.widget.getAxis(this.yAxisIndex).linearScale!;
      const originY = yAxis.getValuePosition(0);
      for (const point of points) {
        if (point.y !== null) {
          g.strokePath({
            path: new Path(point.x, point.y).lineTo(point.x, originY),
            lineWidth,
            color: this.traceColor,
            opacity: 100 / 255,
          });
        }
      }
    } else if (this.traceType === 4 || this.traceType === 5) {
      // Area, Line Area
      const yAxis = this.widget.getAxis(this.yAxisIndex).linearScale!;
      const originY = yAxis.getValuePosition(0);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const point = points[i];
        if (prev.y !== null && point.y !== null) {
          g.fillPath({
            path: new Path(prev.x, prev.y)
              .lineTo(prev.x, originY)
              .lineTo(point.x, originY)
              .lineTo(point.x, point.y),
            color: this.traceColor,
            opacity: 100 / 255,
          });
        }
      }
      if (this.traceType === 5) {
        g.strokePath({
          path: Path.fromPoints(points),
          color: this.traceColor,
          lineWidth,
        });
      }
    } else if (this.traceType === 6) {
      // Step Vertically
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const point = points[i];
        if (prev.y !== null && point.y !== null) {
          g.strokePath({
            path: new Path(prev.x, prev.y)
              .lineTo(prev.x, point.y)
              .lineTo(point.x, point.y),
            color: this.traceColor,
            lineWidth,
          });
        }
      }
    } else if (this.traceType === 7) {
      // Step Horizontally
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const point = points[i];
        if (prev.y !== null && point.y !== null) {
          g.strokePath({
            path: new Path(prev.x, prev.y)
              .lineTo(point.x, prev.y)
              .lineTo(point.x, point.y),
            color: this.traceColor,
            lineWidth,
          });
        }
      }
    } else if (this.traceType === 8) {
      // Dash Dot Line
      const { scale } = this;
      g.strokePath({
        path: Path.fromPoints(points),
        color: this.traceColor,
        lineWidth,
        dash: [6 * scale, 2 * scale, 2 * scale, 2 * scale],
      });
    } else if (this.traceType === 9) {
      // Dash Dot Dot Line
      const { scale } = this;
      g.strokePath({
        path: Path.fromPoints(points),
        color: this.traceColor,
        lineWidth,
        dash: [
          6 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
        ],
      });
    } else if (this.traceType === 10) {
      // Dot Line
      const { scale } = this;
      g.strokePath({
        path: Path.fromPoints(points),
        color: this.traceColor,
        lineWidth,
        dash: [2 * scale, 2 * scale],
      });
    }
  }

  drawPoint(g: Graphics, point: Point) {
    g.ctx.fillStyle = this.traceColor.toString();
    g.ctx.strokeStyle = this.traceColor.toString();
    g.ctx.lineWidth = 1 * this.scale;
    const r = this.pointSize / 2;
    const cx = point.x;
    const cy = point.y;
    switch (this.pointStyle) {
      case 1: // Point
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
        g.ctx.fill();
        break;
      case 2: // Circle
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
        g.ctx.stroke();
        break;
      case 3: // Filled circle (same as point?)
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
        g.ctx.fill();
        break;
      case 4: // Triangle
        g.ctx.lineWidth = 1 * this.scale;
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy + r);
        g.ctx.lineTo(cx, cy - r);
        g.ctx.lineTo(cx + r, cy + r);
        g.ctx.closePath();
        g.ctx.stroke();
        break;
      case 5: // Filled triangle
        g.ctx.lineWidth = 1 * this.scale;
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy + r);
        g.ctx.lineTo(cx, cy - r);
        g.ctx.lineTo(cx + r, cy + r);
        g.ctx.closePath();
        g.ctx.fill();
        break;
      case 6: // Square
        g.ctx.strokeRect(cx - r, cy - r, 2 * r, 2 * r);
        break;
      case 7: // Filled square
        g.ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        break;
      case 8: // Diamond
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy);
        g.ctx.lineTo(cx, cy - r);
        g.ctx.lineTo(cx + r, cy);
        g.ctx.lineTo(cx, cy + r);
        g.ctx.closePath();
        g.ctx.stroke();
        break;
      case 9: // Filled Diamond
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy);
        g.ctx.lineTo(cx, cy - r);
        g.ctx.lineTo(cx + r, cy);
        g.ctx.lineTo(cx, cy + r);
        g.ctx.closePath();
        g.ctx.stroke();
        break;
      case 10: // Cross (X)
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy - r);
        g.ctx.lineTo(cx + r, cy + r);
        g.ctx.moveTo(cx + r, cy - r);
        g.ctx.lineTo(cx - r, cy + r);
        g.ctx.stroke();
        break;
      case 11: // Cross (+)
        g.ctx.beginPath();
        g.ctx.moveTo(cx - r, cy);
        g.ctx.lineTo(cx + r, cy);
        g.ctx.moveTo(cx, cy - r);
        g.ctx.lineTo(cx, cy + r);
        g.ctx.stroke();
        break;
      case 12: // Bar
        g.ctx.beginPath();
        g.ctx.moveTo(cx, cy - r);
        g.ctx.lineTo(cx, cy + r);
        g.ctx.stroke();
    }
  }

  clearData() {
    this.traceData?.clear();
  }

  get scale() {
    return this.widget.scale;
  }

  private getValue(propertySufix: string) {
    return this.widget.properties.getValue(`trace_${this.i}_${propertySufix}`);
  }

  get antiAlias(): boolean {
    return this.getValue("anti_alias");
  }

  get bufferSize(): number {
    return this.getValue("buffer_size");
  }

  get concatenateData(): boolean {
    return this.getValue("concatenate_data");
  }

  get lineWidth(): number {
    return this.scale * this.getValue("line_width");
  }

  get name(): string {
    return this.getValue("name");
  }

  get plotMode(): number {
    return this.getValue("plot_mode");
  }

  get pointSize(): number {
    return this.scale * this.getValue("point_size");
  }

  get pointStyle(): number {
    return this.getValue("point_style");
  }

  get traceColor(): Color {
    return this.getValue("trace_color");
  }

  get traceType(): number {
    return this.getValue("trace_type");
  }

  get updateDelay(): number {
    return this.getValue("update_delay");
  }

  get updateMode(): number {
    return this.getValue("update_mode");
  }

  get visible(): boolean {
    return this.getValue("visible");
  }

  get xAxisIndex(): number {
    return this.getValue("x_axis_index");
  }

  get xPV(): string {
    return this.getValue("x_pv");
  }

  get yAxisIndex(): number {
    return this.getValue("y_axis_index");
  }

  get yPV(): string {
    return this.getValue("y_pv");
  }

  destroy() {
    this.historicalDataProvider?.disconnect();
  }
}
