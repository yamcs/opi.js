import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { Bounds, shrink, translatePoints } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';
import { LinearScale } from './LinearScale';

const PROP_COLOR_HI = 'color_hi';
const PROP_COLOR_HIHI = 'color_hihi';
const PROP_COLOR_LO = 'color_lo';
const PROP_COLOR_LOLO = 'color_lolo';
const PROP_COLOR_FILLBACKGROUND = 'color_fillbackground';
const PROP_EFFECT_3D = 'effect_3d';
const PROP_FILL_COLOR = 'fill_color';
const PROP_FILLCOLOR_ALARM_SENSITIVE = 'fillcolor_alarm_sensitive';
const PROP_FONT = 'font';
const PROP_HORIZONTAL = 'horizontal';
const PROP_INDICATOR_MODE = 'indicator_mode';
const PROP_LEVEL_HI = 'level_hi';
const PROP_LEVEL_HIHI = 'level_hihi';
const PROP_LEVEL_LO = 'level_lo';
const PROP_LEVEL_LOLO = 'level_lolo';
const PROP_LIMITS_FROM_PV = 'limits_from_pv';
const PROP_LOG_SCALE = 'log_scale';
const PROP_MAXIMUM = 'maximum';
const PROP_MAJOR_TICK_STEP_HINT = 'major_tick_step_hint';
const PROP_MINIMUM = 'minimum';
const PROP_ORIGIN = 'origin';
const PROP_ORIGIN_IGNORED = 'origin_ignored';
const PROP_SCALE_FONT = 'scale_font';
const PROP_SHOW_HI = 'show_hi';
const PROP_SHOW_HIHI = 'show_hihi';
const PROP_SHOW_LABEL = 'show_label';
const PROP_SHOW_LO = 'show_lo';
const PROP_SHOW_LOLO = 'show_lolo';
const PROP_SHOW_MARKERS = 'show_markers';
const PROP_SHOW_MINOR_TICKS = 'show_minor_ticks';
const PROP_SHOW_SCALE = 'show_scale';
const PROP_TRANSPARENT_BACKGROUND = 'transparent_background';

export class ProgressBar extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new ColorProperty(PROP_COLOR_HI));
        this.properties.add(new ColorProperty(PROP_COLOR_HIHI));
        this.properties.add(new ColorProperty(PROP_COLOR_LO));
        this.properties.add(new ColorProperty(PROP_COLOR_LOLO));
        this.properties.add(new ColorProperty(PROP_COLOR_FILLBACKGROUND));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new ColorProperty(PROP_FILL_COLOR));
        this.properties.add(new BooleanProperty(PROP_FILLCOLOR_ALARM_SENSITIVE, false));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL));
        this.properties.add(new BooleanProperty(PROP_INDICATOR_MODE));
        this.properties.add(new FloatProperty(PROP_LEVEL_HI));
        this.properties.add(new FloatProperty(PROP_LEVEL_HIHI));
        this.properties.add(new FloatProperty(PROP_LEVEL_LO));
        this.properties.add(new FloatProperty(PROP_LEVEL_LOLO));
        this.properties.add(new BooleanProperty(PROP_LIMITS_FROM_PV));
        this.properties.add(new BooleanProperty(PROP_LOG_SCALE));
        this.properties.add(new FloatProperty(PROP_MAXIMUM));
        this.properties.add(new FloatProperty(PROP_MAJOR_TICK_STEP_HINT));
        this.properties.add(new FloatProperty(PROP_MINIMUM));
        this.properties.add(new FloatProperty(PROP_ORIGIN, 0));
        this.properties.add(new BooleanProperty(PROP_ORIGIN_IGNORED, true));
        this.properties.add(new FontProperty(PROP_SCALE_FONT));
        this.properties.add(new BooleanProperty(PROP_SHOW_HI));
        this.properties.add(new BooleanProperty(PROP_SHOW_HIHI));
        this.properties.add(new BooleanProperty(PROP_SHOW_LABEL));
        this.properties.add(new BooleanProperty(PROP_SHOW_LO));
        this.properties.add(new BooleanProperty(PROP_SHOW_LOLO));
        this.properties.add(new BooleanProperty(PROP_SHOW_MARKERS));
        this.properties.add(new BooleanProperty(PROP_SHOW_MINOR_TICKS));
        this.properties.add(new BooleanProperty(PROP_SHOW_SCALE));
        this.properties.add(new BooleanProperty(PROP_TRANSPARENT_BACKGROUND));
    }

    draw(g: Graphics) {
        let area = this.area;
        if (this.borderAlarmSensitive) {
            area = shrink(this.area, 2 * this.scale);
        }
        const backgroundColor = this.alarmSensitiveBackgroundColor;
        if (!this.transparentBackground) {
            g.fillRect({ ...area, color: backgroundColor });
        }

        if (this.horizontal) {
            this.drawHorizontal(g, area);
        } else {
            this.drawVertical(g, area);
        }
    }

    private drawVertical(g: Graphics, area: Bounds) {
        const foregroundColor = this.alarmSensitiveForegroundColor;

        const linearScale = new LinearScale(this.scale, this.scaleFont, this.min,
            this.max, this.logScale, this.majorTickStepHint, foregroundColor,
            this.showMinorTicks, this.showScale);
        const scaleWidth = linearScale.drawVertical(g, area.x, area.y, area.height, true);

        let markerWidth = 0;
        if (this.showMarkers) {
            markerWidth = this.drawVerticalMarkers(g, linearScale, area);
        }

        this.drawVerticalBar(g, linearScale, {
            x: area.x + scaleWidth,
            y: area.y + linearScale.margin,
            width: area.width - scaleWidth - markerWidth,
            height: area.height - (2 * linearScale.margin),
        });
    }

    private drawVerticalMarkers(g: Graphics, linearScale: LinearScale, area: Bounds) {
        const { lolo, lo, hi, hihi } = this;
        const font = Font.ARIAL_9.scale(this.scale);
        let markerWidth = 0;
        if (this.showLoLo && lolo !== undefined) {
            const fm = g.measureText("LOLO", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showLo && lo !== undefined) {
            const fm = g.measureText("LO", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showHi && hi !== undefined) {
            const fm = g.measureText("HI", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showHiHi && hihi !== undefined) {
            const fm = g.measureText("HIHI", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }

        const x2 = area.x + area.width; // Stick to right side
        if (this.showLoLo && lolo !== undefined) {
            const tickX = x2 - markerWidth - this.markerGap;
            const y = Math.round(linearScale.getValuePosition(lolo));
            g.strokePath({
                path: new Path(tickX, y).lineTo(tickX - this.markerTickLength, y),
                color: this.colorLoLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: tickX + this.markerGap,
                y,
                text: 'LOLO',
                align: 'left',
                baseline: 'middle',
                color: this.colorLoLo,
                font,
            });
        }
        if (this.showLo && lo !== undefined) {
            const tickX = x2 - markerWidth - this.markerGap;
            const y = Math.round(linearScale.getValuePosition(lo));
            g.strokePath({
                path: new Path(tickX, y).lineTo(tickX - this.markerTickLength, y),
                color: this.colorLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: tickX + this.markerGap,
                y,
                text: 'LO',
                align: 'left',
                baseline: 'middle',
                color: this.colorLo,
                font,
            });
        }
        if (this.showHi && hi !== undefined) {
            const tickX = x2 - markerWidth - this.markerGap;
            const y = Math.round(linearScale.getValuePosition(hi));
            g.strokePath({
                path: new Path(tickX, y).lineTo(tickX - this.markerTickLength, y),
                color: this.colorHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: tickX + this.markerGap,
                y,
                text: 'HI',
                align: 'left',
                baseline: 'middle',
                color: this.colorHi,
                font,
            });
        }
        if (this.showHiHi && hihi !== undefined) {
            const tickX = x2 - markerWidth - this.markerGap;
            const y = Math.round(linearScale.getValuePosition(hihi));
            g.strokePath({
                path: new Path(tickX, y).lineTo(tickX - this.markerTickLength, y),
                color: this.colorHiHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x: tickX + this.markerGap,
                y,
                text: 'HIHI',
                align: 'left',
                baseline: 'middle',
                color: this.colorHiHi,
                font,
            });
        }

        return this.markerTickLength + this.markerGap + markerWidth;
    }

    private drawVerticalBar(g: Graphics, linearScale: LinearScale, area: Bounds) {
        const { outlineWidth } = this;
        g.fillRect({ ...area, color: this.colorFillbackground });
        if (this.effect3d) {
            const gradient = g.createLinearGradient(area.x, 0, area.x + area.width, 0);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, this.colorFillbackground.withAlpha(0).toString());
            g.fillRect({ ...area, gradient });
            const outline = shrink(area, outlineWidth / 2);
            g.strokeRect({
                ...outline,
                color: Color.GRAY,
                lineWidth: outlineWidth,
            });
        }

        const fillColor = this.alarmSensitiveFillColor;
        if (this.indicatorMode) {
            const position = Math.round(linearScale.getValuePosition(this.getFillValue()));
            const h = area.width;
            const b = this.thumbBreadth;
            const points = translatePoints([
                { x: 0, y: b / 2 },
                { x: h / 2, y: 0 },
                { x: h - 1, y: b / 2 },
                { x: h / 2, y: b },
            ], area.x, position - b / 2);
            const path = Path.fromPoints(points);
            if (this.effect3d) {
                const { x: x1, y: y1 } = points[0];
                const { x: x2, y: y2 } = points[2];
                const gradient = g.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.toString());
                g.fillPath({ path, gradient });
                g.strokePath({ path, color: Color.GRAY, lineWidth: outlineWidth });
            } else {
                g.fillPath({ path, color: fillColor });
            }
        } else {
            let fillStart = this.originIgnored ? this.min : this.origin;
            let fillStop = this.getFillValue();
            if (fillStop < fillStart) {
                const swap = fillStart;
                fillStart = fillStop;
                fillStop = swap;
            }
            const y1 = Math.round(linearScale.getValuePosition(fillStart));
            const y2 = Math.round(linearScale.getValuePosition(fillStop));
            const fillArea = shrink({
                ...area,
                y: y1,
                height: y2 - y1,
            }, outlineWidth);

            g.fillRect({ ...fillArea, color: fillColor });
            if (this.effect3d) {
                const gradient = g.createLinearGradient(fillArea.x, 0, fillArea.x + fillArea.width, 0);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.withAlpha(0).toString());
                g.fillRect({ ...fillArea, gradient });
            }
        }

        const value = this.pv?.value;
        if (this.showLabel && value !== undefined) {
            g.fillText({
                x: area.x + (area.width / 2),
                y: area.y + (area.height / 2),
                align: 'center',
                baseline: 'middle',
                color: this.alarmSensitiveForegroundColor,
                font: this.font,
                text: this.format(value),
            });
        }
    }

    private drawHorizontal(g: Graphics, area: Bounds) {
        const foregroundColor = this.alarmSensitiveForegroundColor;

        const linearScale = new LinearScale(this.scale, this.scaleFont, this.min,
            this.max, this.logScale, this.majorTickStepHint, foregroundColor,
            this.showMinorTicks, this.showScale);
        const scaleHeight = linearScale.drawHorizontal(g, area.x, area.y + area.height, area.width);

        let markerHeight = 0;
        if (this.showMarkers) {
            markerHeight = this.drawHorizontalMarkers(g, linearScale, area);
        }

        this.drawHorizontalBar(g, linearScale, {
            x: area.x + linearScale.margin,
            y: area.y + markerHeight,
            width: area.width - (2 * linearScale.margin),
            height: area.height - scaleHeight - markerHeight,
        });
    }

    private drawHorizontalMarkers(g: Graphics, linearScale: LinearScale, area: Bounds) {
        const { lolo, lo, hi, hihi } = this;
        const font = Font.ARIAL_9.scale(this.scale);
        let markerHeight = 0;
        if (this.showLoLo && lolo !== undefined) {
            const fm = g.measureText("LOLO", font);
            markerHeight = Math.max(markerHeight, fm.height);
        }
        if (this.showLo && lo !== undefined) {
            const fm = g.measureText("LO", font);
            markerHeight = Math.max(markerHeight, fm.height);
        }
        if (this.showHi && hi !== undefined) {
            const fm = g.measureText("HI", font);
            markerHeight = Math.max(markerHeight, fm.height);
        }
        if (this.showHiHi && hihi !== undefined) {
            const fm = g.measureText("HIHI", font);
            markerHeight = Math.max(markerHeight, fm.height);
        }

        const y = area.y;
        if (this.showLoLo && lolo !== undefined) {
            const x = Math.round(linearScale.getValuePosition(lolo));
            const tickY = y + markerHeight + this.markerGap;
            g.strokePath({
                path: new Path(x, tickY).lineTo(x, tickY + this.markerTickLength),
                color: this.colorLoLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x,
                y,
                text: 'LOLO',
                align: 'center',
                baseline: 'top',
                color: this.colorLoLo,
                font,
            });
        }
        if (this.showLo && lo !== undefined) {
            const x = Math.round(linearScale.getValuePosition(lo));
            const tickY = y + markerHeight + this.markerGap;
            g.strokePath({
                path: new Path(x, tickY).lineTo(x, tickY + this.markerTickLength),
                color: this.colorLo,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x,
                y,
                text: 'LO',
                align: 'center',
                baseline: 'top',
                color: this.colorLo,
                font,
            });
        }
        if (this.showHi && hi !== undefined) {
            const x = Math.round(linearScale.getValuePosition(hi));
            const tickY = y + markerHeight + this.markerGap;
            g.strokePath({
                path: new Path(x, tickY).lineTo(x, tickY + this.markerTickLength),
                color: this.colorHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x,
                y,
                text: 'HI',
                align: 'center',
                baseline: 'top',
                color: this.colorHi,
                font,
            });
        }
        if (this.showHiHi && hihi !== undefined) {
            const x = Math.round(linearScale.getValuePosition(hihi));
            const tickY = y + markerHeight + this.markerGap;
            g.strokePath({
                path: new Path(x, tickY).lineTo(x, tickY + this.markerTickLength),
                color: this.colorHiHi,
                lineWidth: this.markerTickLineWidth,
            });
            g.fillText({
                x,
                y,
                text: 'HIHI',
                align: 'center',
                baseline: 'top',
                color: this.colorHiHi,
                font,
            });
        }

        return this.markerTickLength + this.markerGap + markerHeight;
    }

    private drawHorizontalBar(g: Graphics, linearScale: LinearScale, area: Bounds) {
        const { outlineWidth } = this;
        g.fillRect({ ...area, color: this.colorFillbackground });
        if (this.effect3d) {
            const gradient = g.createLinearGradient(0, area.y, 0, area.y + area.height);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, this.colorFillbackground.withAlpha(0).toString());
            g.fillRect({ ...area, gradient });
            const outline = shrink(area, outlineWidth / 2);
            g.strokeRect({
                ...outline,
                color: Color.GRAY,
                lineWidth: outlineWidth,
            });
        }

        const fillColor = this.alarmSensitiveFillColor;
        if (this.indicatorMode) {
            const position = Math.round(linearScale.getValuePosition(this.getFillValue()));
            const h = area.height;
            const b = this.thumbBreadth;
            const points = translatePoints([
                { x: b / 2, y: 0 },
                { x: b, y: h / 2 },
                { x: b / 2, y: h - 1 },
                { x: 0, y: h / 2 },
            ], position - b / 2, area.y);
            const path = Path.fromPoints(points);
            if (this.effect3d) {
                const { x: x1, y: y1 } = points[0];
                const { x: x2, y: y2 } = points[2];
                const gradient = g.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.toString());
                g.fillPath({ path, gradient });
                g.strokePath({ path, color: Color.GRAY, lineWidth: outlineWidth });
            } else {
                g.fillPath({ path, color: fillColor });
            }
        } else {
            let fillStart = this.originIgnored ? this.min : this.origin;
            let fillStop = this.getFillValue();
            if (fillStop < fillStart) {
                const swap = fillStart;
                fillStart = fillStop;
                fillStop = swap;
            }
            const x1 = Math.round(linearScale.getValuePosition(fillStart));
            const x2 = Math.round(linearScale.getValuePosition(fillStop));
            const fillArea = shrink({
                ...area,
                x: x1,
                width: x2 - x1,
            }, outlineWidth);
            g.fillRect({ ...fillArea, color: fillColor });
            if (this.effect3d) {
                const gradient = g.createLinearGradient(0, fillArea.y, 0, fillArea.y + fillArea.height);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, fillColor.withAlpha(0).toString());
                g.fillRect({ ...fillArea, gradient });
            }
        }

        const value = this.pv?.value;
        if (this.showLabel && value !== undefined) {
            g.fillText({
                x: area.x + (area.width / 2),
                y: area.y + (area.height / 2),
                align: 'center',
                baseline: 'middle',
                color: this.alarmSensitiveForegroundColor,
                font: this.font,
                text: this.format(value),
            });
        }
    }

    get min() {
        if (this.limitsFromPv) {
            return this.pv?.lowerDisplayLimit ?? this.minimum;
        } else {
            return this.minimum;
        }
    }

    get max() {
        if (this.limitsFromPv) {
            return this.pv?.upperDisplayLimit ?? this.maximum;
        } else {
            return this.maximum;
        }
    }

    get lolo() {
        if (this.limitsFromPv && this.pv && !this.pv.disconnected) {
            return this.pv.lowerAlarmLimit;
        } else {
            return this.levelLoLo;
        }
    }

    get lo() {
        if (this.limitsFromPv && this.pv && !this.pv.disconnected) {
            return this.pv.lowerWarningLimit;
        } else {
            return this.levelLo;
        }
    }

    get hi() {
        if (this.limitsFromPv && this.pv && !this.pv.disconnected) {
            return this.pv.upperWarningLimit;
        } else {
            return this.levelHi;
        }
    }

    get hihi() {
        if (this.limitsFromPv && this.pv && !this.pv.disconnected) {
            return this.pv.upperAlarmLimit;
        } else {
            return this.levelHiHi;
        }
    }

    get markerTickLength() { return this.scale * 10; }
    get markerTickLineWidth() { return this.scale * 2; }
    get markerGap() { return this.scale * 3; }
    get thumbBreadth() { return this.scale * 13; }
    get outlineWidth() { return this.scale * 1; }
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
        let value = this.pv?.value ?? this.min;
        value = Math.max(this.min, value);
        value = Math.min(this.max, value);
        return value;
    }

    private format(v: number) {
        return String(Number(v.toFixed(2)));
    }

    get colorLo(): Color { return this.properties.getValue(PROP_COLOR_LO); }
    get colorLoLo(): Color { return this.properties.getValue(PROP_COLOR_LOLO); }
    get colorHi(): Color { return this.properties.getValue(PROP_COLOR_HI); }
    get colorHiHi(): Color { return this.properties.getValue(PROP_COLOR_HIHI); }
    get scaleFont(): Font { return this.properties.getValue(PROP_SCALE_FONT).scale(this.scale); }
    get colorFillbackground(): Color { return this.properties.getValue(PROP_COLOR_FILLBACKGROUND); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get fillColorAlarmSensitive(): boolean { return this.properties.getValue(PROP_FILLCOLOR_ALARM_SENSITIVE); }
    get fillColor(): Color { return this.properties.getValue(PROP_FILL_COLOR); }
    get font(): Font { return this.properties.getValue(PROP_FONT).scale(this.scale); }
    get horizontal(): boolean { return this.properties.getValue(PROP_HORIZONTAL); }
    get indicatorMode(): boolean { return this.properties.getValue(PROP_INDICATOR_MODE); }
    get levelLo(): number { return this.properties.getValue(PROP_LEVEL_LO); }
    get levelLoLo(): number { return this.properties.getValue(PROP_LEVEL_LOLO); }
    get levelHi(): number { return this.properties.getValue(PROP_LEVEL_HI); }
    get levelHiHi(): number { return this.properties.getValue(PROP_LEVEL_HIHI); }
    get limitsFromPv(): boolean { return this.properties.getValue(PROP_LIMITS_FROM_PV); }
    get logScale(): boolean { return this.properties.getValue(PROP_LOG_SCALE); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get majorTickStepHint(): number { return this.scale * this.properties.getValue(PROP_MAJOR_TICK_STEP_HINT); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get origin(): number { return this.properties.getValue(PROP_ORIGIN); }
    get originIgnored(): boolean { return this.properties.getValue(PROP_ORIGIN_IGNORED); }
    get showHi(): boolean { return this.properties.getValue(PROP_SHOW_HI); }
    get showHiHi(): boolean { return this.properties.getValue(PROP_SHOW_HIHI); }
    get showLabel(): boolean { return this.properties.getValue(PROP_SHOW_LABEL); }
    get showLo(): boolean { return this.properties.getValue(PROP_SHOW_LO); }
    get showLoLo(): boolean { return this.properties.getValue(PROP_SHOW_LOLO); }
    get showMarkers(): boolean { return this.properties.getValue(PROP_SHOW_MARKERS); }
    get showMinorTicks(): boolean { return this.properties.getValue(PROP_SHOW_MINOR_TICKS); }
    get showScale(): boolean { return this.properties.getValue(PROP_SHOW_SCALE); }
    get transparentBackground(): boolean { return this.properties.getValue(PROP_TRANSPARENT_BACKGROUND); }
}
