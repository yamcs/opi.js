import { Color } from "../../Color";
import { ColorMap } from "../../ColorMap";
import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { shrink } from "../../positioning";
import {
  BooleanProperty,
  ColorMapProperty,
  ColorProperty,
  FloatProperty,
  FontProperty,
  IntProperty,
  StringProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";
import { LinearScale } from "./LinearScale";

const PROP_COLOR_MAP = "color_map";
const PROP_CROP_BOTTOM = "crop_bottom";
const PROP_CROP_LEFT = "crop_left";
const PROP_CROP_RIGHT = "crop_right";
const PROP_CROP_TOP = "crop_top";
const PROP_DATA_HEIGHT = "data_height";
const PROP_DATA_WIDTH = "data_width";
const PROP_FONT = "font";
const PROP_GRAPH_AREA_HEIGHT = "graph_area_height";
const PROP_GRAPH_AREA_WIDTH = "graph_area_width";
const PROP_MAXIMUM = "maximum";
const PROP_MINIMUM = "minimum";
const PROP_SHOW_RAMP = "show_ramp";
const PROP_X_AXIS_AXIS_COLOR = "x_axis_axis_color";
const PROP_X_AXIS_AXIS_TITLE = "x_axis_axis_title";
const PROP_X_AXIS_MAJOR_TICK_STEP_HINT = "x_axis_major_tick_step_hint";
const PROP_X_AXIS_MAXIMUM = "x_axis_maximum";
const PROP_X_AXIS_MINIMUM = "x_axis_minimum";
const PROP_X_AXIS_SCALE_FONT = "x_axis_scale_font";
const PROP_X_AXIS_SHOW_MINOR_TICKS = "x_axis_show_minor_ticks";
const PROP_X_AXIS_TITLE_FONT = "x_axis_title_font";
const PROP_X_AXIS_VISIBLE = "x_axis_visible";
const PROP_Y_AXIS_AXIS_COLOR = "y_axis_axis_color";
const PROP_Y_AXIS_AXIS_TITLE = "y_axis_axis_title";
const PROP_Y_AXIS_MAJOR_TICK_STEP_HINT = "y_axis_major_tick_step_hint";
const PROP_Y_AXIS_MAXIMUM = "y_axis_maximum";
const PROP_Y_AXIS_MINIMUM = "y_axis_minimum";
const PROP_Y_AXIS_SCALE_FONT = "y_axis_scale_font";
const PROP_Y_AXIS_SHOW_MINOR_TICKS = "y_axis_show_minor_ticks";
const PROP_Y_AXIS_TITLE_FONT = "y_axis_title_font";
const PROP_Y_AXIS_VISIBLE = "y_axis_visible";

export class IntensityGraph extends Widget {
  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new ColorMapProperty(PROP_COLOR_MAP));
    this.properties.add(new IntProperty(PROP_CROP_BOTTOM));
    this.properties.add(new IntProperty(PROP_CROP_LEFT));
    this.properties.add(new IntProperty(PROP_CROP_RIGHT));
    this.properties.add(new IntProperty(PROP_CROP_TOP));
    this.properties.add(new IntProperty(PROP_DATA_HEIGHT));
    this.properties.add(new IntProperty(PROP_DATA_WIDTH));
    this.properties.add(new IntProperty(PROP_GRAPH_AREA_HEIGHT));
    this.properties.add(new IntProperty(PROP_GRAPH_AREA_WIDTH));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new FloatProperty(PROP_MAXIMUM));
    this.properties.add(new FloatProperty(PROP_MINIMUM));
    this.properties.add(new BooleanProperty(PROP_SHOW_RAMP));
    this.properties.add(new ColorProperty(PROP_X_AXIS_AXIS_COLOR));
    this.properties.add(new StringProperty(PROP_X_AXIS_AXIS_TITLE));
    this.properties.add(new IntProperty(PROP_X_AXIS_MAJOR_TICK_STEP_HINT));
    this.properties.add(new FloatProperty(PROP_X_AXIS_MAXIMUM));
    this.properties.add(new FloatProperty(PROP_X_AXIS_MINIMUM));
    this.properties.add(new FontProperty(PROP_X_AXIS_SCALE_FONT));
    this.properties.add(new BooleanProperty(PROP_X_AXIS_SHOW_MINOR_TICKS));
    this.properties.add(new FontProperty(PROP_X_AXIS_TITLE_FONT));
    this.properties.add(new BooleanProperty(PROP_X_AXIS_VISIBLE));
    this.properties.add(new ColorProperty(PROP_Y_AXIS_AXIS_COLOR));
    this.properties.add(new StringProperty(PROP_Y_AXIS_AXIS_TITLE));
    this.properties.add(new IntProperty(PROP_Y_AXIS_MAJOR_TICK_STEP_HINT));
    this.properties.add(new FloatProperty(PROP_Y_AXIS_MAXIMUM));
    this.properties.add(new FloatProperty(PROP_Y_AXIS_MINIMUM));
    this.properties.add(new FontProperty(PROP_Y_AXIS_SCALE_FONT));
    this.properties.add(new BooleanProperty(PROP_Y_AXIS_SHOW_MINOR_TICKS));
    this.properties.add(new FontProperty(PROP_Y_AXIS_TITLE_FONT));
    this.properties.add(new BooleanProperty(PROP_Y_AXIS_VISIBLE));
  }

  draw(g: Graphics) {
    const { scale } = this;
    let area = this.area;
    if (this.borderAlarmSensitive) {
      area = shrink(area, 2 * scale);
    }
    const backgroundColor = this.alarmSensitiveBackgroundColor;
    g.fillRect({ ...area, color: backgroundColor });

    // The graph area is what we fix. Axis are all positioned in function of it.
    const { graphAreaWidth, graphAreaHeight } = this;

    let xTitleHeight = 0;
    if (this.xAxisVisible) {
      xTitleHeight = g.measureText(
        this.xAxisAxisTitle,
        this.xAxisTitleFont
      ).height;
    }

    let yTitleWidth = 0;
    if (this.yAxisVisible) {
      yTitleWidth = g.measureText(
        this.yAxisAxisTitle,
        this.yAxisTitleFont
      ).height;
    }

    const xScale = new LinearScale(
      this.display.formatter,
      scale,
      this.xAxisScaleFont,
      this.xAxisMinimum,
      this.xAxisMaximum,
      false,
      this.xAxisMajorTickStepHint,
      this.xAxisAxisColor,
      this.xAxisShowMinorTicks,
      this.xAxisVisible
    );
    const xScaleMargin = xScale.calculateMargin(g, true);
    const yScale = new LinearScale(
      this.display.formatter,
      scale,
      this.yAxisScaleFont,
      this.yAxisMinimum,
      this.yAxisMaximum,
      false,
      this.yAxisMajorTickStepHint,
      this.yAxisAxisColor,
      this.yAxisShowMinorTicks,
      this.yAxisVisible
    );
    const yScaleMargin = yScale.calculateMargin(g, false);

    const xScaleHeight = xScale.measureHorizontalHeight(g);
    const yScaleHeight = graphAreaHeight + 2 * yScaleMargin;
    const yScaleWidth = yScale.drawVertical(
      g,
      area.x + yTitleWidth,
      area.y,
      yScaleHeight,
      true
    );
    const xScaleWidth = graphAreaWidth + 2 * xScaleMargin;

    const xScaleX = area.x + yTitleWidth + yScaleWidth - xScaleMargin;
    const xScaleY2 = area.y + yScaleHeight + xScaleHeight - yScaleMargin;
    xScale.drawHorizontal(g, xScaleX, xScaleY2, xScaleWidth);

    const lineWidth = scale * 1;
    const verticalLineX =
      Math.round(area.x + yTitleWidth + yScaleWidth) - lineWidth / 2;
    const verticalLineY = Math.round(area.y + yScaleMargin) - lineWidth / 2;
    g.strokePath({
      path: new Path(verticalLineX, verticalLineY).lineTo(
        verticalLineX,
        verticalLineY + graphAreaHeight
      ),
      color: this.yAxisAxisColor,
      opacity: 100 / 255,
      lineWidth,
    });
    const horizontalLineX = verticalLineX;
    const horizontalLineY = verticalLineY + graphAreaHeight + lineWidth;
    g.strokePath({
      path: new Path(horizontalLineX, horizontalLineY).lineTo(
        horizontalLineX + graphAreaWidth,
        horizontalLineY
      ),
      color: this.xAxisAxisColor,
      opacity: 100 / 255,
      lineWidth,
    });

    const { dataWidth, dataHeight, colorMap } = this;
    const { minimum: min, maximum: max } = this;
    const [mapMin, mapMax] = colorMap.getMinMax();

    if (this.value && this.value.length) {
      const offscreen = document.createElement("canvas");
      const { cropLeft, cropRight, cropTop, cropBottom } = this;
      offscreen.width = dataWidth - cropLeft - cropRight;
      offscreen.height = dataHeight - cropTop - cropBottom;
      const offscreenCtx = offscreen.getContext("2d")!;

      // Note: fillRect said to be more efficient than putImageData.
      for (let x = cropLeft; x < dataWidth - cropRight; x++) {
        for (let y = cropTop; y < dataHeight - cropBottom; y++) {
          let value = this.value[y * dataWidth + x];
          if (colorMap.autoscale) {
            const ratio = (value - min) / (max - min);
            value = mapMin + ratio * (mapMax - mapMin);
          }
          const [red, green, blue] = colorMap.lookup(value);
          offscreenCtx.fillStyle = `rgb(${red},${green},${blue})`;
          offscreenCtx.fillRect(x - cropLeft, y - cropTop, 1, 1);
        }
      }

      const x = Math.round(area.x + yTitleWidth + yScaleWidth);
      const y = Math.round(area.y + yScale.margin);
      g.ctx.drawImage(offscreen, x, y, graphAreaWidth, graphAreaHeight);
    }

    if (this.showRamp) {
      const rampScale = new LinearScale(
        this.display.formatter,
        scale,
        this.font,
        min,
        max,
        false,
        50 * scale,
        this.alarmSensitiveForegroundColor,
        false,
        true
      );
      const rampY = area.y + yScale.margin;
      const rampFullHeight = graphAreaHeight;
      const rampScaleWidth = rampScale.drawVertical(
        g,
        area.x + area.width,
        rampY,
        rampFullHeight,
        false,
        true
      );
      const rampX =
        area.x + yTitleWidth + yScaleWidth + graphAreaWidth + this.gap;
      const rampWidth =
        area.width -
        yTitleWidth -
        yScaleWidth -
        graphAreaWidth -
        rampScaleWidth -
        this.gap;
      const rampHeight = rampFullHeight - 2 * rampScale.margin;

      const offscreen = document.createElement("canvas");
      offscreen.width = rampWidth;
      offscreen.height = rampHeight;
      const offscreenCtx = offscreen.getContext("2d")!;
      for (let y = 0; y < rampHeight; y++) {
        let value = max - (y / rampHeight) * (max - min);
        if (colorMap.autoscale) {
          const ratio = (value - min) / (max - min);
          value = mapMin + ratio * (mapMax - mapMin);
        }
        const [red, green, blue] = colorMap.lookup(value);
        offscreenCtx.fillStyle = `rgb(${red},${green},${blue})`;
        offscreenCtx.fillRect(0, y, rampWidth, 1);
      }
      g.ctx.drawImage(offscreen, rampX, rampY + rampScale.margin);
    }

    if (this.xAxisVisible) {
      let textX = area.x + yScaleWidth + graphAreaWidth / 2;
      if (this.yAxisVisible) {
        textX += yTitleWidth;
      }
      g.fillText({
        x: textX,
        y: area.y + area.height,
        align: "center",
        baseline: "bottom",
        font: this.xAxisTitleFont,
        color: this.xAxisAxisColor,
        text: this.xAxisAxisTitle,
      });
    }

    if (this.yAxisVisible) {
      g.ctx.save();
      g.ctx.translate(area.x + yTitleWidth / 2, area.y + yScaleHeight / 2);
      g.ctx.rotate(-Math.PI / 2);
      g.fillText({
        x: 0,
        y: 0,
        align: "center",
        baseline: "middle",
        font: this.yAxisTitleFont,
        color: this.yAxisAxisColor,
        text: this.yAxisAxisTitle,
      });
      g.ctx.restore();
    }
  }

  get gap(): number {
    return this.scale * 3;
  }

  get colorMap(): ColorMap {
    return this.properties.getValue(PROP_COLOR_MAP);
  }
  get cropBottom(): number {
    return this.properties.getValue(PROP_CROP_BOTTOM);
  }
  get cropLeft(): number {
    return this.properties.getValue(PROP_CROP_LEFT);
  }
  get cropRight(): number {
    return this.properties.getValue(PROP_CROP_RIGHT);
  }
  get cropTop(): number {
    return this.properties.getValue(PROP_CROP_TOP);
  }
  get dataHeight(): number {
    return this.properties.getValue(PROP_DATA_HEIGHT);
  }
  get dataWidth(): number {
    return this.properties.getValue(PROP_DATA_WIDTH);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get graphAreaHeight(): number {
    return this.scale * this.properties.getValue(PROP_GRAPH_AREA_HEIGHT);
  }
  get graphAreaWidth(): number {
    return this.scale * this.properties.getValue(PROP_GRAPH_AREA_WIDTH);
  }
  get maximum(): number {
    return this.properties.getValue(PROP_MAXIMUM);
  }
  get minimum(): number {
    return this.properties.getValue(PROP_MINIMUM);
  }
  get showRamp(): boolean {
    return this.properties.getValue(PROP_SHOW_RAMP);
  }

  get xAxisAxisColor(): Color {
    return this.properties.getValue(PROP_X_AXIS_AXIS_COLOR);
  }
  get xAxisAxisTitle(): string {
    return this.properties.getValue(PROP_X_AXIS_AXIS_TITLE);
  }
  get xAxisMajorTickStepHint(): number {
    return (
      this.scale * this.properties.getValue(PROP_X_AXIS_MAJOR_TICK_STEP_HINT)
    );
  }
  get xAxisMaximum(): number {
    return this.properties.getValue(PROP_X_AXIS_MAXIMUM);
  }
  get xAxisMinimum(): number {
    return this.properties.getValue(PROP_X_AXIS_MINIMUM);
  }
  get xAxisScaleFont(): Font {
    return this.properties.getValue(PROP_X_AXIS_SCALE_FONT).scale(this.scale);
  }
  get xAxisShowMinorTicks(): boolean {
    return this.properties.getValue(PROP_X_AXIS_SHOW_MINOR_TICKS);
  }
  get xAxisTitleFont(): Font {
    return this.properties.getValue(PROP_X_AXIS_TITLE_FONT).scale(this.scale);
  }
  get xAxisVisible(): boolean {
    return this.properties.getValue(PROP_X_AXIS_VISIBLE);
  }

  get yAxisAxisColor(): Color {
    return this.properties.getValue(PROP_Y_AXIS_AXIS_COLOR);
  }
  get yAxisAxisTitle(): string {
    return this.properties.getValue(PROP_Y_AXIS_AXIS_TITLE);
  }
  get yAxisMajorTickStepHint(): number {
    return (
      this.scale * this.properties.getValue(PROP_Y_AXIS_MAJOR_TICK_STEP_HINT)
    );
  }
  get yAxisMaximum(): number {
    return this.properties.getValue(PROP_Y_AXIS_MAXIMUM);
  }
  get yAxisMinimum(): number {
    return this.properties.getValue(PROP_Y_AXIS_MINIMUM);
  }
  get yAxisScaleFont(): Font {
    return this.properties.getValue(PROP_Y_AXIS_SCALE_FONT).scale(this.scale);
  }
  get yAxisShowMinorTicks(): boolean {
    return this.properties.getValue(PROP_Y_AXIS_SHOW_MINOR_TICKS);
  }
  get yAxisTitleFont(): Font {
    return this.properties.getValue(PROP_Y_AXIS_TITLE_FONT).scale(this.scale);
  }
  get yAxisVisible(): boolean {
    return this.properties.getValue(PROP_Y_AXIS_VISIBLE);
  }
}
