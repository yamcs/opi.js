import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { Bounds, rotatePoint, shrink, toRadians } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { Ramp } from '../figures/Ramp';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const BORDER_COLOR = new Color(100, 100, 100);
const NEEDLE_DIAMETER = 16;
const MAJOR_TICK_LENGTH = 8;
const MINOR_TICK_LENGTH = 5;
const GAP_BTW_NEEDLE_SCALE = -1;

const PROP_COLOR_HI = 'color_hi';
const PROP_COLOR_HIHI = 'color_hihi';
const PROP_COLOR_LO = 'color_lo';
const PROP_COLOR_LOLO = 'color_lolo';
const PROP_EFFECT_3D = 'effect_3d';
const PROP_FONT = 'font';
const PROP_VALUE_LABEL_FORMAT = 'value_label_format';
const PROP_LEVEL_HI = 'level_hi';
const PROP_LEVEL_HIHI = 'level_hihi';
const PROP_LEVEL_LO = 'level_lo';
const PROP_LEVEL_LOLO = 'level_lolo';
const PROP_LIMITS_FROM_PV = 'limits_from_pv';
const PROP_LOG_SCALE = 'log_scale';
const PROP_MINIMUM = 'minimum';
const PROP_MAXIMUM = 'maximum';
const PROP_NEEDLE_COLOR = 'needle_color';
const PROP_RAMP_GRADIENT = 'ramp_gradient';
const PROP_SHOW_RAMP = 'show_ramp';

// In degrees
const START_ANGLE = 225;
const END_ANGLE = 315;
const RAMP_OVERLAP = 2;

interface DisplayLimits {
    min: number;
    lolo: number;
    lo: number;
    hi: number;
    hihi: number;
    max: number;
}

export class Gauge extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new ColorProperty(PROP_COLOR_HI));
        this.properties.add(new ColorProperty(PROP_COLOR_HIHI));
        this.properties.add(new ColorProperty(PROP_COLOR_LO));
        this.properties.add(new ColorProperty(PROP_COLOR_LOLO));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new IntProperty(PROP_LEVEL_HI));
        this.properties.add(new IntProperty(PROP_LEVEL_HIHI));
        this.properties.add(new IntProperty(PROP_LEVEL_LO));
        this.properties.add(new IntProperty(PROP_LEVEL_LOLO));
        this.properties.add(new BooleanProperty(PROP_LOG_SCALE));
        this.properties.add(new BooleanProperty(PROP_LIMITS_FROM_PV));
        this.properties.add(new IntProperty(PROP_MAXIMUM));
        this.properties.add(new IntProperty(PROP_MINIMUM));
        this.properties.add(new ColorProperty(PROP_NEEDLE_COLOR));
        this.properties.add(new BooleanProperty(PROP_RAMP_GRADIENT));
        this.properties.add(new BooleanProperty(PROP_SHOW_RAMP, true));
        this.properties.add(new StringProperty(PROP_VALUE_LABEL_FORMAT));
    }

    draw(g: Graphics) {
        let limits: DisplayLimits;
        if (this.pv) {
            limits = {
                min: this.pv.lowerDisplayLimit!,
                lolo: this.pv.lowerAlarmLimit!,
                lo: this.pv.lowerWarningLimit!,
                hi: this.pv.upperWarningLimit!,
                hihi: this.pv.upperAlarmLimit!,
                max: this.pv.upperDisplayLimit!,
            };
        } else {
            limits = {
                min: this.minimum,
                lolo: this.levelLoLo,
                lo: this.levelLo,
                hi: this.levelHi,
                hihi: this.levelHiHi,
                max: this.maximum,
            };
        }

        if (this.logScale) {
            limits.min = Math.max(0.1, limits.min);
            if (limits.max <= limits.min) {
                limits.max = limits.min + 100;
            }
        }

        const width = Math.min(this.width, this.height);
        const height = width;
        this.drawBackground(g, width, height);
        if (this.showRamp) {
            this.drawRamp(g, width, height, limits);
        }
        this.drawLabel(g, width, height);
        this.drawNeedle(g, width, height, limits);
        this.drawNeedleCenter(g, width, height);
    }

    private drawBackground(g: Graphics, width: number, height: number) {
        g.fillEllipse({
            cx: this.x + (width / 2),
            cy: this.y + (height / 2),
            rx: width / 2,
            ry: height / 2,
            color: Color.GRAY,
        });

        if (this.effect3d) {
            const gradient = g.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
            gradient.addColorStop(0, BORDER_COLOR.toString());
            gradient.addColorStop(1, Color.WHITE.toString());
            g.fillEllipse({
                cx: this.x + (width / 2),
                cy: this.y + (height / 2),
                rx: width / 2,
                ry: height / 2,
                gradient,
            });
        }

        const strokeWidth = (this.effect3d ? 2 : 1) * this.zoom;
        g.fillEllipse({
            cx: this.x + (width / 2),
            cy: this.y + (height / 2),
            rx: width / 2 - strokeWidth,
            ry: height / 2 - strokeWidth,
            color: this.backgroundColor,
        });

        if (this.effect3d) {
            const R = width / 2;
            const UD_FILL_PART = 9.5 / 10;
            const UP_DOWN_RATIO = 1 / 2;
            const LR_FILL_PART = 8.5 / 10;
            const UP_ANGLE = toRadians(0);
            const DOWN_ANGLE = toRadians(35);
            let box: Bounds = {
                x: Math.floor(this.x + width / 2 - R * LR_FILL_PART * Math.cos(UP_ANGLE)),
                y: Math.floor(this.y + height / 2 - R * UD_FILL_PART),
                width: Math.floor(2 * R * LR_FILL_PART * Math.cos(UP_ANGLE)),
                height: Math.floor(R * UD_FILL_PART + R * UP_DOWN_RATIO),
            };
            let gradient = g.createLinearGradient(box.x, box.y, box.x, box.y + box.height);
            gradient.addColorStop(0, Color.WHITE.withAlpha(90 / 255).toString());
            gradient.addColorStop(1, Color.WHITE.withAlpha(0).toString());

            g.fillEllipse({
                cx: box.x + (box.width / 2),
                cy: box.y + (box.height / 2),
                rx: box.width / 2,
                ry: box.height / 2,
                gradient,
            });

            box = {
                x: Math.floor(this.x + width / 2 - R * LR_FILL_PART * Math.sin(DOWN_ANGLE)),
                y: Math.floor(Math.ceil(this.y + height / 2 + R * UP_DOWN_RATIO)),
                width: Math.floor(2 * R * LR_FILL_PART * Math.sin(DOWN_ANGLE)),
                height: Math.floor(Math.ceil(R * UD_FILL_PART - R * UP_DOWN_RATIO)),
            };
            gradient = g.createLinearGradient(box.x, box.y, box.x, box.y + box.height);
            gradient.addColorStop(0, Color.WHITE.withAlpha(0).toString());
            gradient.addColorStop(1, Color.WHITE.withAlpha(40 / 255).toString());
            g.fillEllipse({
                cx: box.x + (box.width / 2),
                cy: box.y + (box.height / 2),
                rx: box.width / 2,
                ry: box.height / 2,
                gradient,
            });
        }
    }

    private drawRamp(g: Graphics, width: number, height: number, limits: DisplayLimits) {
        const area = shrink({ x: this.x, y: this.y, width, height }, width / 4, height / 4);
        const rampArea = { ...area };
        rampArea.width = Math.min(area.width, area.height);
        rampArea.height = area.width;

        const ramp = new Ramp(10 * this.zoom, 225, 315);
        ramp.lolo = limits.lolo;
        ramp.loloColor = this.colorLoLo;
        ramp.lo = limits.lo;
        ramp.loColor = this.colorLo;
        ramp.hi = limits.hi;
        ramp.hiColor = this.colorHi;
        ramp.hihi = limits.hihi;
        ramp.hihiColor = this.colorHiHi;
        ramp.minimum = limits.min;
        ramp.maximum = limits.max;
        ramp.effect3d = this.effect3d;
        ramp.gradient = this.rampGradient;
        ramp.logScale = this.logScale;
        ramp.draw(g, area, rampArea);
    }

    private drawLabel(g: Graphics, width: number, height: number) {
        // A font property is exposed in the UI, but it seems to get ignored in favour of arial 12 bold.
        const font = Font.ARIAL_12_BOLD.scale(this.zoom);
        if (this.pv?.value !== undefined) {
            const text = this.formatLabelValue(this.pv.value);
            const fm = g.measureText(text, font);
            g.fillText({
                x: this.x + width / 2 - fm.width / 2,
                y: this.y + height * 7 / 8 - fm.height / 2,
                color: this.foregroundColor,
                align: 'left',
                baseline: 'top',
                font,
                text,
            });
        }
    }

    private drawNeedle(g: Graphics, width: number, height: number, limits: DisplayLimits) {
        const cx = this.x + (width / 2);
        const cy = this.y + (height / 2);
        let valuePosition;
        if (this.pv?.value !== undefined) {
            const v = this.getValueInRange(this.pv.value, limits);
            valuePosition = 360 - this.getValuePosition(v, limits);
            if (limits.max > limits.min) {
                if (v > limits.max) {
                    valuePosition += 10;
                } else if (v < limits.min) {
                    valuePosition -= 10;
                }
            } else {
                if (v > limits.min) {
                    valuePosition -= 10;
                } else if (v < limits.max) {
                    valuePosition += 10;
                }
            }
        } else {
            valuePosition = 360 - this.getValuePosition((limits.min + limits.max) / 2, limits);
        }

        const angle = toRadians(valuePosition);
        const { zoom } = this;
        const { needleDiameter, majorTickLength, gapBetweenNeedleScale } = this;
        const p1 = rotatePoint(cx, cy - needleDiameter / 2 + (3 * zoom), cx, cy, angle);
        const p2 = rotatePoint(cx + width / 2 - majorTickLength - gapBetweenNeedleScale, cy, cx, cy, angle);
        const p3 = rotatePoint(cx, cy + needleDiameter / 2 - (3 * zoom), cx, cy, angle);
        g.fillPath({
            color: this.needleColor,
            path: new Path(p1.x, p1.y)
                .lineTo(p2.x, p2.y)
                .lineTo(p3.x, p3.y)
                .closePath()
        });
    }

    private drawNeedleCenter(g: Graphics, width: number, height: number) {
        const { needleDiameter } = this;
        const cx = this.x + (width / 2);
        const cy = this.y + (height / 2);
        const rx = needleDiameter / 2;
        const ry = needleDiameter / 2;
        if (this.effect3d) {
            const gradient = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, BORDER_COLOR.toString());
            g.fillEllipse({ cx, cy, rx, ry, gradient });
        } else {
            g.fillEllipse({ cx, cy, rx, ry, color: Color.GRAY });
        }
    }

    private getValueInRange(v: number, limits: DisplayLimits) {
        if (limits.min <= v && v <= limits.max) {
            return v;
        } else {
            return v > limits.max ? limits.max : limits.min;
        }
    }

    private getValuePosition(v: number, limits: DisplayLimits) {
        const lengthInDegrees = 360 - (END_ANGLE - START_ANGLE);

        let valuePosition;
        if (this.logScale) {
            valuePosition = START_ANGLE - ((Math.log10(v) - Math.log10(limits.min))
                / (Math.log10(limits.max) - Math.log10(limits.min)) * lengthInDegrees);
        } else {
            valuePosition = START_ANGLE - ((v - limits.min) / (limits.max - limits.min) * lengthInDegrees);
        }

        if (valuePosition < 0) {
            valuePosition += 360;
        }

        return valuePosition;
    }

    private formatLabelValue(value: number) {
        if (this.valueLabelFormat) {
            console.log(`Custom format ${this.valueLabelFormat} not supported.`);
            return String(value);
        } else {
            return String(Number(value.toFixed(3)));
        }
    }

    get needleDiameter() {
        return this.zoom * NEEDLE_DIAMETER;
    }

    get majorTickLength() {
        return this.zoom * MAJOR_TICK_LENGTH;
    }

    get minorTickLength() {
        return this.zoom * MINOR_TICK_LENGTH;
    }

    get gapBetweenNeedleScale() {
        return this.zoom * GAP_BTW_NEEDLE_SCALE;
    }

    get colorLo(): Color { return this.properties.getValue(PROP_COLOR_LO); }
    get colorLoLo(): Color { return this.properties.getValue(PROP_COLOR_LOLO); }
    get colorHi(): Color { return this.properties.getValue(PROP_COLOR_HI); }
    get colorHiHi(): Color { return this.properties.getValue(PROP_COLOR_HIHI); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get font(): Font {
        return this.properties.getValue(PROP_FONT).scale(this.zoom);
    }
    get levelLo(): number { return this.properties.getValue(PROP_LEVEL_LO); }
    get levelLoLo(): number { return this.properties.getValue(PROP_LEVEL_LOLO); }
    get levelHi(): number { return this.properties.getValue(PROP_LEVEL_HI); }
    get levelHiHi(): number { return this.properties.getValue(PROP_LEVEL_HIHI); }
    get limitsFromPv(): boolean { return this.properties.getValue(PROP_LIMITS_FROM_PV); }
    get logScale(): boolean { return this.properties.getValue(PROP_LOG_SCALE); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get needleColor(): Color { return this.properties.getValue(PROP_NEEDLE_COLOR); }
    get rampGradient(): boolean { return this.properties.getValue(PROP_RAMP_GRADIENT); }
    get showRamp(): boolean { return this.properties.getValue(PROP_SHOW_RAMP); }
    get valueLabelFormat(): string { return this.properties.getValue(PROP_VALUE_LABEL_FORMAT); }
}
