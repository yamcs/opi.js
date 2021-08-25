import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { Bounds, shrink } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty } from '../../properties';
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
const PROP_SHOW_HI = 'show_hi';
const PROP_SHOW_HIHI = 'show_hihi';
const PROP_SHOW_LO = 'show_lo';
const PROP_SHOW_LOLO = 'show_lolo';
const PROP_SHOW_MARKERS = 'show_markers';
const PROP_SHOW_MINOR_TICKS = 'show_minor_ticks';
const PROP_SHOW_SCALE = 'show_scale';
const PROP_TRANSPARENT_BACKGROUND = 'transparent_background';

const OUTLINE_COLOR_3D = new Color(160, 160, 160);

export class Tank extends Widget {

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
        this.properties.add(new FloatProperty(PROP_LEVEL_HI));
        this.properties.add(new FloatProperty(PROP_LEVEL_HIHI));
        this.properties.add(new FloatProperty(PROP_LEVEL_LO));
        this.properties.add(new FloatProperty(PROP_LEVEL_LOLO));
        this.properties.add(new BooleanProperty(PROP_LOG_SCALE));
        this.properties.add(new FloatProperty(PROP_MAXIMUM));
        this.properties.add(new FloatProperty(PROP_MAJOR_TICK_STEP_HINT));
        this.properties.add(new FloatProperty(PROP_MINIMUM));
        this.properties.add(new FontProperty(PROP_SCALE_FONT));
        this.properties.add(new BooleanProperty(PROP_SHOW_HI));
        this.properties.add(new BooleanProperty(PROP_SHOW_HIHI));
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
            area = shrink(area, 2 * this.scale);
        }
        const backgroundColor = this.alarmSensitiveBackgroundColor;
        if (!this.transparentBackground) {
            g.fillRect({ ...area, color: backgroundColor });
        }

        const foregroundColor = this.alarmSensitiveForegroundColor;
        const linearScale = new LinearScale(this.scale, this.scaleFont, this.minimum,
            this.maximum, this.logScale, this.majorTickStepHint, foregroundColor,
            this.showMinorTicks, this.showScale);
        const scaleWidth = linearScale.drawVertical(g, area.x, area.y, area.height, true);

        let markerWidth = 0;
        if (this.showMarkers) {
            markerWidth = this.drawMarkers(g, area, linearScale);
        }

        this.drawTank(g, area, scaleWidth, markerWidth, linearScale);
    }

    private drawMarkers(g: Graphics, area: Bounds, linearScale: LinearScale) {
        const font = Font.ARIAL_9.scale(this.scale);
        let markerWidth = 0;
        if (this.showLoLo) {
            const fm = g.measureText("LOLO", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showLo) {
            const fm = g.measureText("LO", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showHi) {
            const fm = g.measureText("HI", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }
        if (this.showHiHi) {
            const fm = g.measureText("HIHI", font);
            markerWidth = Math.max(markerWidth, fm.width);
        }

        const x = area.x + area.width - markerWidth - this.markerGap - this.markerTickLength;
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
        return this.markerTickLength + this.markerGap + markerWidth;
    }

    private drawTank(g: Graphics, area: Bounds, scaleWidth: number, markerWidth: number, linearScale: LinearScale) {
        const foregroundColor = this.alarmSensitiveForegroundColor;
        const { scale, outlineWidth } = this;
        const x = area.x + scaleWidth;
        const y = area.y + linearScale.margin;
        const width = area.width - scaleWidth - markerWidth;
        const height = area.height - (2 * linearScale.margin);

        let fillCorner = this.defaultCorner;
        let intersectFactor = 11.0 / 20.0;
        if (width < 2 * fillCorner) { // Make gradient effect a little darker
            intersectFactor = 12.0 / 20.0;
        }
        const rectWidth = Math.floor(width * intersectFactor);
        if (fillCorner > (2 * rectWidth) - width - (2 * outlineWidth)) {
            fillCorner = (2 * rectWidth) - width;
        }

        const valuePosition = linearScale.getValuePosition(this.getFillValue());
        const fillColor = this.alarmSensitiveFillColor;
        if (this.effect3d) {
            g.fillRect({
                x,
                y,
                width,
                height,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                color: Color.WHITE,
            });
            let gradient = g.createLinearGradient(x, y, x + rectWidth + (2 * scale), y);
            gradient.addColorStop(0, this.colorFillbackground.toString());
            gradient.addColorStop(1, Color.WHITE.withAlpha(0).toString());
            g.fillRect({
                x,
                y,
                width: rectWidth,
                height,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                gradient,
            });
            gradient = g.createLinearGradient(x + width - rectWidth - (2 * scale), y, x + width, y);
            gradient.addColorStop(0, Color.WHITE.withAlpha(0).toString());
            gradient.addColorStop(1, this.colorFillbackground.toString());
            g.fillRect({
                x: x + width - rectWidth,
                y,
                width: rectWidth,
                height,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                gradient,
            });

            const fillY = valuePosition;
            const fillHeight = y + height - valuePosition;
            gradient = g.createLinearGradient(x, fillY, x + rectWidth + (2 * scale), fillY);
            gradient.addColorStop(0, fillColor.toString());
            gradient.addColorStop(1, Color.WHITE.withAlpha(0).toString());
            g.fillRect({
                x,
                y: fillY,
                width: rectWidth,
                height: fillHeight,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                gradient,
            });
            gradient = g.createLinearGradient(x + width - rectWidth - (2 * scale), fillY, x + width, fillY);
            gradient.addColorStop(0, Color.WHITE.withAlpha(0).toString());
            gradient.addColorStop(1, fillColor.toString());
            g.fillRect({
                x: x + width - rectWidth,
                y: fillY,
                width: rectWidth,
                height: fillHeight,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                gradient,
            });
        } else {
            g.fillRect({
                x,
                y,
                width,
                height,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                color: this.colorFillbackground,
            });
            g.fillRect({
                x,
                y: valuePosition,
                width,
                height: y + height - valuePosition,
                rx: fillCorner / 2,
                ry: fillCorner / 2,
                color: fillColor,
            });
        }

        // Outline
        let outline: Bounds = shrink({
            x,
            y,
            width,
            height,
        }, outlineWidth / 2);
        g.strokeRect({
            ...outline,
            rx: fillCorner / 2,
            ry: fillCorner / 2,
            color: this.effect3d ? OUTLINE_COLOR_3D : foregroundColor,
            lineWidth: outlineWidth,
        });
    }

    get defaultCorner() { return this.scale * 15; }
    get markerTickLength() { return this.scale * 10; }
    get markerTickLineWidth() { return this.scale * 2; }
    get markerGap() { return this.scale * 3; }
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
        let value = this.pv?.value ?? this.minimum;
        value = Math.max(this.minimum, value);
        value = Math.min(this.maximum, value);
        return value;
    }

    get colorLo(): Color { return this.properties.getValue(PROP_COLOR_LO); }
    get colorLoLo(): Color { return this.properties.getValue(PROP_COLOR_LOLO); }
    get colorHi(): Color { return this.properties.getValue(PROP_COLOR_HI); }
    get colorHiHi(): Color { return this.properties.getValue(PROP_COLOR_HIHI); }
    get scaleFont(): Font { return this.properties.getValue(PROP_SCALE_FONT).scale(this.scale); }
    get colorFillbackground(): Color { return this.properties.getValue(PROP_COLOR_FILLBACKGROUND); }
    get fillColorAlarmSensitive(): boolean { return this.properties.getValue(PROP_FILLCOLOR_ALARM_SENSITIVE); }
    get fillColor(): Color { return this.properties.getValue(PROP_FILL_COLOR); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get levelLo(): number { return this.properties.getValue(PROP_LEVEL_LO); }
    get levelLoLo(): number { return this.properties.getValue(PROP_LEVEL_LOLO); }
    get levelHi(): number { return this.properties.getValue(PROP_LEVEL_HI); }
    get levelHiHi(): number { return this.properties.getValue(PROP_LEVEL_HIHI); }
    get logScale(): boolean { return this.properties.getValue(PROP_LOG_SCALE); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get majorTickStepHint(): number { return this.scale * this.properties.getValue(PROP_MAJOR_TICK_STEP_HINT); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get showLo(): boolean { return this.properties.getValue(PROP_SHOW_LO); }
    get showLoLo(): boolean { return this.properties.getValue(PROP_SHOW_LOLO); }
    get showHi(): boolean { return this.properties.getValue(PROP_SHOW_HI); }
    get showHiHi(): boolean { return this.properties.getValue(PROP_SHOW_HIHI); }
    get showMarkers(): boolean { return this.properties.getValue(PROP_SHOW_MARKERS); }
    get showMinorTicks(): boolean { return this.properties.getValue(PROP_SHOW_MINOR_TICKS); }
    get showScale(): boolean { return this.properties.getValue(PROP_SHOW_SCALE); }
    get transparentBackground(): boolean { return this.properties.getValue(PROP_TRANSPARENT_BACKGROUND); }
}
