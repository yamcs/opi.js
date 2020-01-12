import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { Bounds, convertPolarToCartesian, rotatePoint, shrink, toRadians } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';

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
const PROP_LEVEL_HI = 'level_hi';
const PROP_LEVEL_HIHI = 'level_hihi';
const PROP_LEVEL_LO = 'level_lo';
const PROP_LEVEL_LOLO = 'level_lolo';
const PROP_LOG_SCALE = 'log_scale';
const PROP_MINIMUM = 'minimum';
const PROP_MAXIMUM = 'maximum';
const PROP_NEEDLE_COLOR = 'needle_color';
const PROP_RAMP_GRADIENT = 'ramp_gradient';

// In degrees
const START_ANGLE = 225;
const END_ANGLE = 315;
const RAMP_OVERLAP = 2;

export class Gauge extends Widget {

    constructor(display: Display) {
        super(display);
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
        this.properties.add(new IntProperty(PROP_MAXIMUM));
        this.properties.add(new IntProperty(PROP_MINIMUM));
        this.properties.add(new ColorProperty(PROP_NEEDLE_COLOR));
        this.properties.add(new BooleanProperty(PROP_RAMP_GRADIENT));
    }

    draw(g: Graphics) {
        const width = Math.min(this.width, this.height);
        const height = width;
        this.drawBackground(g, width, height);
        this.drawRamp(g, width, height);
        this.drawLabel(g, width, height);
        this.drawNeedle(g, width, height);
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
            const gradient = g.ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
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

        const strokeWidth = this.effect3d ? 2 : 1;
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
            let gradient = g.ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.height);
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
            gradient = g.ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.height);
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

    private drawRamp(g: Graphics, width: number, height: number) {
        const area = shrink({ x: this.x, y: this.y, width, height }, width / 4, height / 4);
        area.width = Math.min(area.width, area.height);
        area.height = area.width;

        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        const rx = area.width / 2;
        const ry = area.height / 2;

        const range = this.getRenderedRange();

        // LOLO
        let startAngle = START_ANGLE - 90;
        let endAngle = 360 - this.getValuePosition(this.levelLoLo, range);
        g.strokeEllipse({
            cx,
            cy,
            rx: rx - 5,
            ry: ry - 5,
            lineWidth: 10,
            startAngle: toRadians(startAngle),
            endAngle: toRadians(endAngle),
            color: this.colorLoLo,
        });

        // LO
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.levelLo, range);
        if (this.effect3d && this.rampGradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.levelLoLo, range));
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.levelLo, range));
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.ctx.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, this.colorLoLo.toString());
            gradient.addColorStop(1, this.colorLo.toString());
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: this.colorLo,
            });
        }

        const midNormal = (this.levelLo + this.levelHi) / 2;

        // NORMAL (left part)
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(midNormal, range);
        if (this.effect3d && this.rampGradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.levelLo, range));
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(midNormal, range));
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.ctx.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, this.colorLo.toString());
            gradient.addColorStop(1, Color.GREEN.toString());
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: Color.GREEN,
            });
        }

        // NORMAL (right part)
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.levelHi, range);
        if (this.effect3d && this.rampGradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(midNormal, range));
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.levelHi, range));
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.ctx.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, Color.GREEN.toString());
            gradient.addColorStop(1, this.colorHi.toString());
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: Color.GREEN,
            });
        }

        // HI
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.levelHiHi, range);
        if (this.effect3d && this.rampGradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.levelHi, range));
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.levelHiHi, range));
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.ctx.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, this.colorHi.toString());
            gradient.addColorStop(1, this.colorHiHi.toString());
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - 5,
                ry: ry - 5,
                lineWidth: 10,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: this.colorHi,
            });
        }

        // HIHI
        startAngle = endAngle;
        endAngle = 360 - END_ANGLE;
        /*const gradient = g.ctx.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, Color.GREEN.toString());
        gradient.addColorStop(1, Color.PURPLE.toString());*/
        g.strokeEllipse({
            cx,
            cy,
            rx: rx - 5,
            ry: ry - 5,
            lineWidth: 10,
            startAngle: toRadians(startAngle),
            endAngle: toRadians(endAngle),
            color: this.colorHiHi,
        });
    }

    private drawLabel(g: Graphics, width: number, height: number) {
        // A font property is exposed in the UI, but it seems to get ignored in favour of arial 12 bold.
        const font = Font.ARIAL_12_BOLD;
        if (this.pv && this.pv.value !== undefined) {
            const stringValue = String(this.pv.value);
            const fm = g.measureText(stringValue, font);
            g.fillText({
                x: this.x + width / 2 - fm.width / 2,
                y: this.y + height * 7 / 8 - fm.height / 2,
                color: this.foregroundColor,
                align: 'left',
                baseline: 'top',
                font,
                text: stringValue,
            });
        }
    }

    private drawNeedle(g: Graphics, width: number, height: number) {
        const cx = this.x + (width / 2);
        const cy = this.y + (height / 2);
        let valuePosition;
        const range = this.getRenderedRange();
        if (this.pv && this.pv.value !== undefined) {
            const v = this.getValueInRange(this.pv.value, range);
            valuePosition = 360 - this.getValuePosition(v, range);
            if (range.max > range.min) {
                if (v > range.max) {
                    valuePosition += 10;
                } else if (v < range.min) {
                    valuePosition -= 10;
                }
            } else {
                if (v > range.min) {
                    valuePosition -= 10;
                } else if (v < range.max) {
                    valuePosition += 10;
                }
            }
        } else {
            valuePosition = 360 - this.getValuePosition((range.min + range.max) / 2, range);
        }

        const angle = toRadians(valuePosition);
        const p1 = rotatePoint(cx, cy - NEEDLE_DIAMETER / 2 + 3, cx, cy, angle);
        const p2 = rotatePoint(cx + width / 2 - MAJOR_TICK_LENGTH - GAP_BTW_NEEDLE_SCALE, cy, cx, cy, angle);
        const p3 = rotatePoint(cx, cy + NEEDLE_DIAMETER / 2 - 3, cx, cy, angle);
        g.path(p1.x, p1.y)
            .lineTo(p2.x, p2.y)
            .lineTo(p3.x, p3.y)
            .closePath()
            .fill({ color: this.needleColor });
    }

    private drawNeedleCenter(g: Graphics, width: number, height: number) {
        const cx = this.x + (width / 2);
        const cy = this.y + (height / 2);
        const rx = NEEDLE_DIAMETER / 2;
        const ry = NEEDLE_DIAMETER / 2;
        if (this.effect3d) {
            const gradient = g.ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, BORDER_COLOR.toString());
            g.fillEllipse({ cx, cy, rx, ry, gradient });
        } else {
            g.fillEllipse({ cx, cy, rx, ry, color: Color.GRAY });
        }
    }

    private getValueInRange(v: number, range: Range) {
        if (range.min <= v && v <= range.max) {
            return v;
        } else {
            return v > range.max ? range.max : range.min;
        }
    }

    private getValuePosition(v: number, range: Range) {
        const lengthInDegrees = 360 - (END_ANGLE - START_ANGLE);

        let valuePosition;
        if (this.logScale) {
            valuePosition = START_ANGLE - ((Math.log10(v) - Math.log10(range.min))
                / (Math.log10(range.max) - Math.log10(range.min)) * lengthInDegrees);
        } else {
            valuePosition = START_ANGLE - ((v - range.min) / (range.max - range.min) * lengthInDegrees);
        }

        if (valuePosition < 0) {
            valuePosition += 360;
        }

        return valuePosition;
    }

    private getRenderedRange(): Range {
        const range = { min: this.minimum, max: this.maximum };
        if (this.logScale) {
            if (this.minimum <= 0) {
                range.min = 0.1;
            }
            if (range.max <= this.minimum) {
                range.max = range.min + 100;
            }
        }
        return range;
    }

    get colorLo(): Color { return this.properties.getValue(PROP_COLOR_LO); }
    get colorLoLo(): Color { return this.properties.getValue(PROP_COLOR_LOLO); }
    get colorHi(): Color { return this.properties.getValue(PROP_COLOR_HI); }
    get colorHiHi(): Color { return this.properties.getValue(PROP_COLOR_HIHI); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get levelLo(): number { return this.properties.getValue(PROP_LEVEL_LO); }
    get levelLoLo(): number { return this.properties.getValue(PROP_LEVEL_LOLO); }
    get levelHi(): number { return this.properties.getValue(PROP_LEVEL_HI); }
    get levelHiHi(): number { return this.properties.getValue(PROP_LEVEL_HIHI); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get needleColor(): Color { return this.properties.getValue(PROP_NEEDLE_COLOR); }
    get rampGradient(): boolean { return this.properties.getValue(PROP_RAMP_GRADIENT); }
    get logScale(): boolean { return this.properties.getValue(PROP_LOG_SCALE); }
}

interface Range {
    min: number;
    max: number;
}
