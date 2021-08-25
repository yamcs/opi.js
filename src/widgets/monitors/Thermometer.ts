import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { Bounds, shrink } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';
import { LinearScale } from './LinearScale';

const PROP_COLOR_HI = 'color_hi';
const PROP_COLOR_HIHI = 'color_hihi';
const PROP_COLOR_LO = 'color_lo';
const PROP_COLOR_LOLO = 'color_lolo';
const PROP_COLOR_FILLBACKGROUND = 'color_fillbackground';
const PROP_FILL_COLOR = 'fill_color';
const PROP_FILLCOLOR_ALARM_SENSITIVE = 'fillcolor_alarm_sensitive';
const PROP_FONT = 'font';
const PROP_EFFECT_3D = 'effect_3d';
const PROP_LEVEL_HI = 'level_hi';
const PROP_LEVEL_HIHI = 'level_hihi';
const PROP_LEVEL_LO = 'level_lo';
const PROP_LEVEL_LOLO = 'level_lolo';
const PROP_LOG_SCALE = 'log_scale';
const PROP_MAXIMUM = 'maximum';
const PROP_MAJOR_TICK_STEP_HINT = 'major_tick_step_hint';
const PROP_MINIMUM = 'minimum';
const PROP_SCALE_FONT = 'scale_font';
const PROP_SHOW_BULB = 'show_bulb';
const PROP_SHOW_HI = 'show_hi';
const PROP_SHOW_HIHI = 'show_hihi';
const PROP_SHOW_LO = 'show_lo';
const PROP_SHOW_LOLO = 'show_lolo';
const PROP_SHOW_MARKERS = 'show_markers';
const PROP_SHOW_MINOR_TICKS = 'show_minor_ticks';
const PROP_SHOW_SCALE = 'show_scale';
const PROP_TRANSPARENT_BACKGROUND = 'transparent_background';
const PROP_UNIT = 'unit';

const OUTLINE_COLOR_3D = new Color(160, 160, 160);

export class Thermometer extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new ColorProperty(PROP_COLOR_HI));
        this.properties.add(new ColorProperty(PROP_COLOR_HIHI));
        this.properties.add(new ColorProperty(PROP_COLOR_LO));
        this.properties.add(new ColorProperty(PROP_COLOR_LOLO));
        this.properties.add(new ColorProperty(PROP_COLOR_FILLBACKGROUND));
        this.properties.add(new ColorProperty(PROP_FILL_COLOR));
        this.properties.add(new BooleanProperty(PROP_FILLCOLOR_ALARM_SENSITIVE, false));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new FloatProperty(PROP_LEVEL_HI));
        this.properties.add(new FloatProperty(PROP_LEVEL_HIHI));
        this.properties.add(new FloatProperty(PROP_LEVEL_LO));
        this.properties.add(new FloatProperty(PROP_LEVEL_LOLO));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_LOG_SCALE));
        this.properties.add(new FloatProperty(PROP_MAXIMUM));
        this.properties.add(new FloatProperty(PROP_MAJOR_TICK_STEP_HINT));
        this.properties.add(new FloatProperty(PROP_MINIMUM));
        this.properties.add(new FontProperty(PROP_SCALE_FONT));
        this.properties.add(new BooleanProperty(PROP_SHOW_BULB));
        this.properties.add(new BooleanProperty(PROP_SHOW_HI));
        this.properties.add(new BooleanProperty(PROP_SHOW_HIHI));
        this.properties.add(new BooleanProperty(PROP_SHOW_LO));
        this.properties.add(new BooleanProperty(PROP_SHOW_LOLO));
        this.properties.add(new BooleanProperty(PROP_SHOW_MARKERS));
        this.properties.add(new BooleanProperty(PROP_SHOW_MINOR_TICKS));
        this.properties.add(new BooleanProperty(PROP_SHOW_SCALE));
        this.properties.add(new BooleanProperty(PROP_TRANSPARENT_BACKGROUND));
        this.properties.add(new IntProperty(PROP_UNIT));
    }

    draw(g: Graphics) {
        const { scale } = this;
        let area = this.area;
        if (this.borderAlarmSensitive) {
            area = shrink(this.area, 2 * this.scale);
        }
        const backgroundColor = this.alarmSensitiveBackgroundColor;
        const foregroundColor = this.alarmSensitiveForegroundColor;
        const fillColor = this.alarmSensitiveFillColor;
        if (!this.transparentBackground) {
            g.fillRect({ ...area, color: backgroundColor });
        }

        let pipeHeight = area.height;
        if (this.showBulb) {
            let diameter = Math.min(area.width / 2, this.bulbMaxDiameter);
            pipeHeight = (area.height < diameter) ? 0 : (area.height - diameter);
        }
        let pipeArea = { ...area, height: pipeHeight };

        const linearScale = new LinearScale(scale, this.scaleFont, this.minimum,
            this.maximum, this.logScale, this.majorTickStepHint, foregroundColor,
            this.showMinorTicks, this.showScale);

        let unitHeight = 0;
        let unitText = '';
        if (this.unit === 0) {
            unitText = '°C';
        } else if (this.unit === 1) {
            unitText = '°F';
        } else if (this.unit === 2) {
            unitText = 'K';
        }
        if (unitText) {
            const unitFont = Font.ARIAL_9.scale(scale);
            const fm = g.measureText(unitText, unitFont);
            const padding = 2 * scale;
            unitHeight = fm.height + (2 * padding);
            g.fillText({
                x: area.x + (area.width / 2) - (this.pipeWidth / 2) - padding,
                y: area.y + padding,
                baseline: 'top',
                align: 'right',
                color: foregroundColor,
                font: unitFont,
                text: unitText,
            });
        }

        const x2 = pipeArea.x + (pipeArea.width / 2) - (this.pipeWidth / 2) - (1 * scale);
        const scaleArea: Bounds = {
            ...pipeArea,
            y: pipeArea.y + unitHeight,
            height: pipeArea.height - unitHeight + linearScale.calculateMargin(g, false),
        };
        const scaleWidth = linearScale.drawVertical(g, x2, scaleArea.y, scaleArea.height, false);
        const cornerSize = Math.floor(this.pipeWidth / 2);

        pipeArea = {
            ...pipeArea,
            y: linearScale.getValuePosition(this.maximum) - cornerSize,
            height: linearScale.scaleLength + (2 * cornerSize),
        };

        this.drawPipe(g, pipeArea, linearScale);

        if (this.showMarkers) {
            this.drawMarkers(g, area, linearScale);
        }

        if (this.showBulb) {
            let diameter = Math.min(area.width / 2, this.bulbMaxDiameter);
            const lineWidth = 1 * scale;
            const cx = area.x + area.width / 2;
            const cy = area.y + pipeHeight + (diameter / 2);
            const rx = diameter / 2;
            const ry = diameter / 2;
            g.fillEllipse({ cx, cy, rx, ry, color: fillColor });
            if (this.effect3d) {
                const gradient = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.withAlpha(0).toString());
                g.fillEllipse({ cx, cy, rx, ry, gradient });
            }
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - (lineWidth / 2),
                ry: ry - (lineWidth / 2),
                color: this.effect3d ? OUTLINE_COLOR_3D : foregroundColor,
                lineWidth,
            });

            // Cover border between pipe and bulb
            const joint: Bounds = {
                x: Math.round(pipeArea.x + (pipeArea.width / 2) - (this.pipeWidth / 2)) + this.outlineWidth,
                y: Math.floor(linearScale.getValuePosition(this.minimum)),
                width: this.pipeWidth - (2 * this.outlineWidth),
                height: scale * 3,
            };
            if (this.effect3d) {
                // On pipe, gradient does not consider outline, so do same
                const gx1 = Math.round(pipeArea.x + (pipeArea.width / 2) - (this.pipeWidth / 2));
                const gx2 = gx1 + this.pipeWidth;
                const gradient = g.createLinearGradient(gx1, joint.y, gx2, joint.y);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.toString());
                g.fillRect({ ...joint, gradient });
            } else {
                g.fillRect({ ...joint, color: fillColor });
            }

            const value = this.pv?.value;
            if (value) {
                g.fillText({
                    x: cx,
                    y: cy,
                    align: 'center',
                    baseline: 'middle',
                    color: fillColor.contrast(),
                    font: this.font,
                    text: this.format(value),
                });
            }

        }
    }

    private drawPipe(g: Graphics, area: Bounds, linearScale: LinearScale) {
        const { scale, outlineWidth } = this;
        const foregroundColor = this.alarmSensitiveForegroundColor;
        const fillColor = this.alarmSensitiveFillColor;
        const pipeBounds: Bounds = {
            x: Math.round(area.x + (area.width / 2) - (this.pipeWidth / 2)),
            y: area.y,
            width: this.pipeWidth,
            height: area.height,
        };

        const value = this.getFillValue();
        let valuePosition = linearScale.getValuePosition(value);
        if (this.maximum > this.minimum) {
            if (value > this.maximum) {
                valuePosition -= (10 * scale);
            } else if (value < this.minimum) {
                valuePosition += (10 * scale);
            }
        } else {
            if (value > this.minimum) {
                valuePosition += (10 * scale);
            } else if (value < this.maximum) {
                valuePosition -= (10 * scale);
            }
        }

        const cornerSize = this.pipeWidth / 2;
        const { x, y, width, height } = pipeBounds;
        if (this.effect3d) {
            let gradient = g.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, this.colorFillbackground.toString());
            g.fillRect({
                ...pipeBounds,
                rx: cornerSize / 2,
                ry: cornerSize / 2,
                gradient,
            });
            gradient = g.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, fillColor.toString());
            g.fillRect({
                x,
                y: valuePosition,
                width,
                height: y + height - valuePosition,
                rx: cornerSize / 2,
                ry: cornerSize / 2,
                gradient,
            });
        } else {
            g.fillRect({
                ...pipeBounds,
                rx: cornerSize / 2,
                ry: cornerSize / 2,
                color: this.colorFillbackground,
            });
            g.fillRect({
                x,
                y: valuePosition,
                width,
                height: y + height - valuePosition,
                rx: cornerSize / 2,
                ry: cornerSize / 2,
                color: fillColor,
            });
        }

        let outline: Bounds = shrink(pipeBounds, outlineWidth / 2);
        g.strokeRect({
            ...outline,
            rx: cornerSize / 2,
            ry: cornerSize / 2,
            color: this.effect3d ? OUTLINE_COLOR_3D : foregroundColor,
            lineWidth: outlineWidth,
        });
    }

    private drawMarkers(g: Graphics, area: Bounds, linearScale: LinearScale) {
        const font = Font.ARIAL_9.scale(this.scale);
        const x = area.x + (area.width / 2) + (this.pipeWidth / 2);
        if (this.showLoLo) {
            const y = Math.round(linearScale.getValuePosition(this.levelLoLo));
            g.strokePath({
                path: new Path(x, y).lineTo(x + this.markerTickLength, y),
                color: this.colorLoLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: x + this.markerTickLength + this.markerGap,
                y,
                text: 'LOLO',
                align: 'left',
                baseline: 'middle',
                color: this.colorLoLo,
                font,
            });
        }
        if (this.showLo) {
            const y = Math.round(linearScale.getValuePosition(this.levelLo));
            g.strokePath({
                path: new Path(x, y).lineTo(x + this.markerTickLength, y),
                color: this.colorLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: x + this.markerTickLength + this.markerGap,
                y,
                text: 'LO',
                align: 'left',
                baseline: 'middle',
                color: this.colorLo,
                font,
            });
        }
        if (this.showHi) {
            const y = Math.round(linearScale.getValuePosition(this.levelHi));
            g.strokePath({
                path: new Path(x, y).lineTo(x + this.markerTickLength, y),
                color: this.colorHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: x + this.markerTickLength + this.markerGap,
                y,
                text: 'HI',
                align: 'left',
                baseline: 'middle',
                color: this.colorHi,
                font,
            });
        }
        if (this.showHiHi) {
            const y = Math.round(linearScale.getValuePosition(this.levelHiHi));
            g.strokePath({
                path: new Path(x, y).lineTo(x + this.markerTickLength, y),
                color: this.colorHiHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: x + this.markerTickLength + this.markerGap,
                y,
                text: 'HIHI',
                align: 'left',
                baseline: 'middle',
                color: this.colorHiHi,
                font,
            });
        }
    }

    get pipeWidth() { return this.scale * 15; }
    get bulbMaxDiameter() { return this.scale * 40; }
    get outlineWidth() { return this.scale * 1; }
    get markerTickLength() { return this.scale * 10; }
    get markerTickLineWidth() { return this.scale * 2; }
    get markerGap() { return this.scale * 3; }
    get alarmSensitiveFillColor() {
        if (this.fillColorAlarmSensitive) {
            if (this.isMajorSeverity()) {
                return Color.RED;
            } else if (this.isMinorSeverity()) {
                return Color.ORANGE;
            }
        }
        return this.fillColor;
    }

    private getFillValue() {
        let value = this.pv?.value ?? this.minimum;
        value = Math.max(this.minimum, value);
        value = Math.min(this.maximum, value);
        return value;
    }

    private format(v: number) {
        return String(Number(v.toFixed(3)));
    }

    get colorLo(): Color { return this.properties.getValue(PROP_COLOR_LO); }
    get colorLoLo(): Color { return this.properties.getValue(PROP_COLOR_LOLO); }
    get colorHi(): Color { return this.properties.getValue(PROP_COLOR_HI); }
    get colorHiHi(): Color { return this.properties.getValue(PROP_COLOR_HIHI); }
    get scaleFont(): Font { return this.properties.getValue(PROP_SCALE_FONT).scale(this.scale); }
    get colorFillbackground(): Color { return this.properties.getValue(PROP_COLOR_FILLBACKGROUND); }
    get fillColorAlarmSensitive(): boolean { return this.properties.getValue(PROP_FILLCOLOR_ALARM_SENSITIVE); }
    get fillColor(): Color { return this.properties.getValue(PROP_FILL_COLOR); }
    get font(): Font { return this.properties.getValue(PROP_FONT).scale(this.scale); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get levelLo(): number { return this.properties.getValue(PROP_LEVEL_LO); }
    get levelLoLo(): number { return this.properties.getValue(PROP_LEVEL_LOLO); }
    get levelHi(): number { return this.properties.getValue(PROP_LEVEL_HI); }
    get levelHiHi(): number { return this.properties.getValue(PROP_LEVEL_HIHI); }
    get logScale(): boolean { return this.properties.getValue(PROP_LOG_SCALE); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get majorTickStepHint(): number { return this.scale * this.properties.getValue(PROP_MAJOR_TICK_STEP_HINT); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get showBulb(): boolean { return this.properties.getValue(PROP_SHOW_BULB); }
    get showMarkers(): boolean { return this.properties.getValue(PROP_SHOW_MARKERS); }
    get showMinorTicks(): boolean { return this.properties.getValue(PROP_SHOW_MINOR_TICKS); }
    get showLo(): boolean { return this.properties.getValue(PROP_SHOW_LO); }
    get showLoLo(): boolean { return this.properties.getValue(PROP_SHOW_LOLO); }
    get showHi(): boolean { return this.properties.getValue(PROP_SHOW_HI); }
    get showHiHi(): boolean { return this.properties.getValue(PROP_SHOW_HIHI); }
    get showScale(): boolean { return this.properties.getValue(PROP_SHOW_SCALE); }
    get transparentBackground(): boolean { return this.properties.getValue(PROP_TRANSPARENT_BACKGROUND); }
    get unit(): number { return this.properties.getValue(PROP_UNIT); }
}
