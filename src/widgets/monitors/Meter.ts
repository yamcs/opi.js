import { Color } from "../../Color";
import { DecimalFormat } from "../../DecimalFormat";
import { Display } from "../../Display";
import { OpenPVEvent } from "../../events";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import { Bounds, rotatePoint, shrink, toRadians } from "../../positioning";
import {
  BooleanProperty,
  ColorProperty,
  FontProperty,
  IntProperty,
  StringProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { Ramp } from "../figures/Ramp";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const NEEDLE_WIDTH = 16;
const RAMP_WIDTH = 12;
const GAP_BTW_NEEDLE_SCALE = -5;
const SPACE_ANGLE = 45;
const ALPHA = toRadians(SPACE_ANGLE);
const HW_RATIO = (1 - Math.sin(ALPHA) / 2) / (2 * Math.cos(ALPHA));

const PROP_COLOR_HI = "color_hi";
const PROP_COLOR_HIHI = "color_hihi";
const PROP_COLOR_LO = "color_lo";
const PROP_COLOR_LOLO = "color_lolo";
const PROP_FONT = "font";
const PROP_LEVEL_HI = "level_hi";
const PROP_LEVEL_HIHI = "level_hihi";
const PROP_LEVEL_LO = "level_lo";
const PROP_LEVEL_LOLO = "level_lolo";
const PROP_LOG_SCALE = "log_scale";
const PROP_MINIMUM = "minimum";
const PROP_MAXIMUM = "maximum";
const PROP_NEEDLE_COLOR = "needle_color";
const PROP_RAMP_GRADIENT = "ramp_gradient";
const PROP_SCALE_FONT = "scale_font";
const PROP_SHOW_HI = "show_hi";
const PROP_SHOW_HIHI = "show_hihi";
const PROP_SHOW_LO = "show_lo";
const PROP_SHOW_LOLO = "show_lolo";
const PROP_SHOW_RAMP = "show_ramp";
const PROP_VALUE_LABEL_FORMAT = "value_label_format";

export class Meter extends Widget {
  private areaRegion?: HitRegionSpecification;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new ColorProperty(PROP_COLOR_HI));
    this.properties.add(new ColorProperty(PROP_COLOR_HIHI));
    this.properties.add(new ColorProperty(PROP_COLOR_LO));
    this.properties.add(new ColorProperty(PROP_COLOR_LOLO));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new IntProperty(PROP_LEVEL_HI));
    this.properties.add(new IntProperty(PROP_LEVEL_HIHI));
    this.properties.add(new IntProperty(PROP_LEVEL_LO));
    this.properties.add(new IntProperty(PROP_LEVEL_LOLO));
    this.properties.add(new BooleanProperty(PROP_LOG_SCALE));
    this.properties.add(new IntProperty(PROP_MAXIMUM));
    this.properties.add(new IntProperty(PROP_MINIMUM));
    this.properties.add(new ColorProperty(PROP_NEEDLE_COLOR));
    this.properties.add(new BooleanProperty(PROP_RAMP_GRADIENT));
    this.properties.add(new FontProperty(PROP_SCALE_FONT));
    this.properties.add(new BooleanProperty(PROP_SHOW_HI));
    this.properties.add(new BooleanProperty(PROP_SHOW_HIHI));
    this.properties.add(new BooleanProperty(PROP_SHOW_LO));
    this.properties.add(new BooleanProperty(PROP_SHOW_LOLO));
    this.properties.add(new BooleanProperty(PROP_SHOW_RAMP, true));
    this.properties.add(new StringProperty(PROP_VALUE_LABEL_FORMAT));
  }

  init() {
    this.areaRegion = {
      id: `${this.wuid}-area`,
      click: () => {
        const event: OpenPVEvent = { pvName: this.pvName! };
        this.display.fireEvent("openpv", event);
      },
      tooltip: () => this.tooltip,
      cursor: "pointer",
    };
  }

  draw(g: Graphics) {
    g.fillRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.backgroundColor,
    });
    if (this.showRamp) {
      this.drawRamp(g);
    }

    if (this.pv && this.pv.navigable && !this.pv.disconnected) {
      const area = g.addHitRegion(this.areaRegion!);
      area.addRect(this.x, this.y, this.width, this.height);
    }
  }

  private drawRamp(g: Graphics) {
    const minText = String(this.minimum);
    const fm1 = g.measureText(minText, this.scaleFont);
    const maxText = String(this.maximum);
    const fm2 = g.measureText(maxText, this.scaleFont);
    const M = Math.max(fm1.width, fm2.width) / 2;
    let h = this.height;
    let w = this.width;
    if (h > HW_RATIO * (w - 2 * M)) {
      h = Math.floor(HW_RATIO * (w - 2 * M));
    }
    const r = h / (1 - Math.sin(ALPHA) / 2);
    const x = Math.floor(this.x - r * (1.0 - Math.cos(ALPHA)) + M);
    const y = this.y;

    const scaleBounds: Bounds = {
      x,
      y,
      width: Math.floor(2 * r),
      height: Math.floor(2 * r),
    };

    const { rampWidth } = this;
    const rampBounds = shrink(
      scaleBounds,
      scaleBounds.width / 4 - rampWidth,
      scaleBounds.height / 4 - rampWidth
    );
    rampBounds.width = Math.min(rampBounds.width, rampBounds.height);
    rampBounds.height = rampBounds.width;

    const ramp = new Ramp(rampWidth, 180 - 45, 45);
    ramp.lolo = this.levelLoLo;
    ramp.loloColor = this.colorLoLo;
    ramp.showLoLo = true;
    ramp.lo = this.levelLo;
    ramp.loColor = this.colorLo;
    ramp.showLo = true;
    ramp.hi = this.levelHi;
    ramp.hiColor = this.colorHi;
    ramp.showHi = true;
    ramp.hihi = this.levelHiHi;
    ramp.hihiColor = this.colorHiHi;
    ramp.showHiHi = true;
    ramp.minimum = this.minimum;
    ramp.maximum = this.maximum;
    ramp.gradient = this.rampGradient;
    ramp.logScale = this.logScale;
    ramp.draw(g, scaleBounds, rampBounds);

    this.drawNeedle(g, scaleBounds, ramp);

    const font = Font.ARIAL_12_BOLD.scale(this.scale);
    if (this.pv && this.pv.value !== undefined) {
      const stringValue = this.format(this.pv.value);
      const fm = g.measureText(stringValue, font);
      g.fillText({
        x: scaleBounds.x + scaleBounds.width / 2 - fm.width / 2,
        y:
          scaleBounds.y +
          scaleBounds.height / 2 -
          scaleBounds.height / 4 -
          (ramp.getRadius() - scaleBounds.height / 4) / 2 -
          fm.height / 2,
        align: "left",
        baseline: "top",
        font,
        text: stringValue,
        color: this.foregroundColor,
      });
    }
  }

  private drawNeedle(g: Graphics, area: Bounds, ramp: Ramp) {
    const cx = area.x + area.width / 2;
    const cy = area.y + area.height / 2;
    let valuePosition;
    if (this.pv && this.pv.value !== undefined) {
      const v = ramp.getValueInRange(this.pv.value);
      valuePosition = 360 - ramp.getValuePosition(v);
      if (this.maximum > this.minimum) {
        if (v > this.maximum) {
          valuePosition += 8;
        } else if (v < this.minimum) {
          valuePosition -= 8;
        }
      } else {
        if (v > this.minimum) {
          valuePosition -= 8;
        } else if (v < this.maximum) {
          valuePosition += 8;
        }
      }
    } else {
      valuePosition =
        360 - ramp.getValuePosition(this.minimum + this.maximum / 2);
    }

    const angle = toRadians(valuePosition);
    const { needleWidth, gapBetweenNeedleScale, scale } = this;
    const p1 = rotatePoint(
      cx + area.width / 4,
      cy - needleWidth / 2 + 3 * scale,
      cx,
      cy,
      angle
    );
    const p2 = rotatePoint(
      cx + ramp.getRadius() - gapBetweenNeedleScale,
      cy,
      cx,
      cy,
      angle
    );
    const p3 = rotatePoint(
      cx + area.width / 4,
      cy + needleWidth / 2 - 3 * scale,
      cx,
      cy,
      angle
    );
    g.fillPath({
      color: this.needleColor,
      path: new Path(p1.x, p1.y)
        .lineTo(p2.x, p2.y)
        .lineTo(p3.x, p3.y)
        .closePath(),
    });
  }

  get needleWidth() {
    return this.scale * NEEDLE_WIDTH;
  }

  get gapBetweenNeedleScale() {
    return this.scale * GAP_BTW_NEEDLE_SCALE;
  }

  get rampWidth() {
    return this.scale * RAMP_WIDTH;
  }

  private format(v: number) {
    if (this.valueLabelFormat) {
      return new DecimalFormat(this.valueLabelFormat).format(v);
    } else {
      return String(Number(v.toFixed(2)));
    }
  }

  get colorLo(): Color {
    return this.properties.getValue(PROP_COLOR_LO);
  }
  get colorLoLo(): Color {
    return this.properties.getValue(PROP_COLOR_LOLO);
  }
  get colorHi(): Color {
    return this.properties.getValue(PROP_COLOR_HI);
  }
  get colorHiHi(): Color {
    return this.properties.getValue(PROP_COLOR_HIHI);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get levelLo(): number {
    return this.properties.getValue(PROP_LEVEL_LO);
  }
  get levelLoLo(): number {
    return this.properties.getValue(PROP_LEVEL_LOLO);
  }
  get levelHi(): number {
    return this.properties.getValue(PROP_LEVEL_HI);
  }
  get levelHiHi(): number {
    return this.properties.getValue(PROP_LEVEL_HIHI);
  }
  get logScale(): boolean {
    return this.properties.getValue(PROP_LOG_SCALE);
  }
  get minimum(): number {
    return this.properties.getValue(PROP_MINIMUM);
  }
  get maximum(): number {
    return this.properties.getValue(PROP_MAXIMUM);
  }
  get needleColor(): Color {
    return this.properties.getValue(PROP_NEEDLE_COLOR);
  }
  get rampGradient(): boolean {
    return this.properties.getValue(PROP_RAMP_GRADIENT);
  }
  get scaleFont(): Font {
    return this.properties.getValue(PROP_SCALE_FONT).scale(this.scale);
  }
  get showLo(): boolean {
    return this.properties.getValue(PROP_SHOW_LO);
  }
  get showLoLo(): boolean {
    return this.properties.getValue(PROP_SHOW_LOLO);
  }
  get showHi(): boolean {
    return this.properties.getValue(PROP_SHOW_HI);
  }
  get showHiHi(): boolean {
    return this.properties.getValue(PROP_SHOW_HIHI);
  }
  get showRamp(): boolean {
    return this.properties.getValue(PROP_SHOW_RAMP);
  }
  get valueLabelFormat(): string {
    return this.properties.getValue(PROP_VALUE_LABEL_FORMAT);
  }
}
