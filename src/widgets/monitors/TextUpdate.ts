import { Display } from "../../Display";
import { OpenPVEvent } from "../../events";
import { Font } from "../../Font";
import { Graphics } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import { Bounds, shrink } from "../../positioning";
import { BooleanProperty, FontProperty, IntProperty } from "../../properties";
import { formatValue } from "../../utils";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_FONT = "font";
const PROP_FORMAT_TYPE = "format_type";
const PROP_HORIZONTAL_ALIGNMENT = "horizontal_alignment";
const PROP_PRECISION = "precision";
const PROP_PRECISION_FROM_PV = "precision_from_pv";
const PROP_SHOW_LOHI = "show_lohi";
const PROP_SHOW_UNITS = "show_units";
const PROP_VERTICAL_ALIGNMENT = "vertical_alignment";

export class TextUpdate extends Widget {
  private areaRegion?: HitRegionSpecification;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new IntProperty(PROP_FORMAT_TYPE));
    this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
    this.properties.add(new IntProperty(PROP_PRECISION));
    this.properties.add(new BooleanProperty(PROP_PRECISION_FROM_PV));
    this.properties.add(new BooleanProperty(PROP_SHOW_LOHI, true));
    this.properties.add(new BooleanProperty(PROP_SHOW_UNITS, true));
    this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT));
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
    const ctx = g.ctx;
    if (this.backgroundAlarmSensitive && this.alarm) {
      g.fillRect({
        ...this.area,
        color: this.alarmSensitiveBackgroundColor,
      });
    } else if (!this.transparent) {
      g.fillRect({
        ...this.area,
        color: this.backgroundColor,
      });
    }

    if (this.pv && this.pv.navigable && !this.pv.disconnected) {
      const area = g.addHitRegion(this.areaRegion!);
      area.addRect(this.x, this.y, this.width, this.height);
    }

    const { scale } = this;
    let textArea = this.area;
    if (this.borderAlarmSensitive) {
      textArea = shrink(textArea, 2 * scale, 2 * scale);
    }

    let text = this.text;
    if (this.pv?.value !== undefined) {
      let precision = this.precisionFromPV
        ? this.pv.precision
        : this.precision;
      if (precision === -1) { // Use PV precision if available
        precision = this.pv.precision ?? -1;
      }
      text = formatValue(this.pv.value, this.formatType, precision, this.pv.typeHint);
    } else if (this.value !== undefined) {
      text = formatValue(this.value, this.formatType, this.precision, undefined);
    }
    if (this.showUnits && this.pv?.units) {
      text += " " + this.pv.units;
    }
    if (this.showLohi) {
      if (this.pv?.alarmName === "LOLO" || this.pv?.alarmName === "LOW") {
        text += " ↓";
      } else if (this.pv?.alarmName === "HIHI" || this.pv?.alarmName === "HIGH") {
        text += " ↑";
      }
    }

    const textSize = g.measureText(text, this.font, true);

    ctx.font = this.font.getFontString();

    // Vertical positioning in Yamcs Studio is based on cap heights,
    // rather than x-heights.

    // Measure cap height as the distance between the alphabetic baseline
    // and the ascent relative to that baseline.
    ctx.textBaseline = "alphabetic";
    const fm = ctx.measureText(text);
    const capHeight = fm.fontBoundingBoxAscent;


    // Canvas font heights don't match very well with Yamcs Studio.
    // Strategy: position a box surrounding text, then always
    // center text within that box.
    const textBounds: Bounds = {
      x: textArea.x,
      y: textArea.y,
      width: textSize.width,
      height: textSize.height,
    }
    if (this.horizAlignment === 0) { // LEFT
      // NOP
    } else if (this.horizAlignment === 1) { // CENTER
      textBounds.x += (textArea.width - textSize.width) / 2;
    } else if (this.horizAlignment === 2) { // RIGHT
      textBounds.x += textArea.width - textSize.width;
    }

    if (this.vertAlignment === 0 || (textArea.height <= textSize.height)) { // TOP
      // NOP
    } else if (this.vertAlignment === 1) { // MIDDLE
      textBounds.y += (textArea.height / 2) - (textSize.height / 2);
    } else if (this.vertAlignment === 2) { // BOTTOM
      textBounds.y += textArea.height - textSize.height;
    }

    // Vertically center in textBounds based on capHeight
    // Note: not using 'textBaseline = "middle"', because Canvas applies this
    // based on the middle of a lowercase letter (middle of x-height), whereas
    // Yamcs Studio takes the middle of an uppercase letter (middle of cap-height).
    ctx.textAlign = "start";
    ctx.textBaseline = "top";
    textBounds.y += (textBounds.height / 2) - (capHeight / 2);

    ctx.save(); // Clip text in box
    ctx.beginPath();
    const box = this.area;
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.clip(); // Activate clip
    ctx.fillStyle = this.alarmSensitiveForegroundColor.toString();
    ctx.fillText(text, textBounds.x, textBounds.y);
    ctx.restore();
  }

  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get formatType(): number {
    return this.properties.getValue(PROP_FORMAT_TYPE);
  }
  get horizAlignment(): number {
    return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT);
  }
  get precision(): number {
    return this.properties.getValue(PROP_PRECISION);
  }
  get precisionFromPV(): boolean {
    return this.properties.getValue(PROP_PRECISION_FROM_PV);
  }
  get showLohi(): boolean {
    return this.properties.getValue(PROP_SHOW_LOHI);
  }
  get showUnits(): boolean {
    return this.properties.getValue(PROP_SHOW_UNITS);
  }
  get vertAlignment(): number {
    return this.properties.getValue(PROP_VERTICAL_ALIGNMENT);
  }
}
