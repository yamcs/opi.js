import { Color } from '../../../Color';
import { Font } from '../../../Font';
import { LinearScale } from '../LinearScale';
import { XYGraph } from './XYGraph';

const LOWEST_LOG_10 = -323.3062; // 4.940656e-324
const HIGHEST_LOG_10 = 308.2547; // 1.797629e308

export class Axis {

    linearScale?: LinearScale;

    // Update during draw operation, influenced by zoom actions
    private _effectiveMinimum?: number;
    private _effectiveMaximum?: number;

    constructor(private widget: XYGraph, readonly index: number) {
    }

    get scale() { return this.widget.scale; }

    private getValue(propertySufix: string) {
        return this.widget.properties.getValue(`axis_${this.index}_${propertySufix}`);
    }

    isDateEnabled() {
        return this.timeFormat !== 0;
    }

    isHorizontal() {
        return this.index === 0 || (this.index !== 1 && !this.yAxis);
    }

    isVertical() {
        return !this.isHorizontal();
    }

    isPrimary() {
        return this.index <= 1;
    }

    get effectiveMinimum(): number {
        return this._effectiveMinimum ?? this.minimum;
    }

    set effectiveMinimum(effectiveMinimum: number) {
        this._effectiveMinimum = effectiveMinimum;
    }

    get effectiveMaximum(): number {
        return this._effectiveMaximum ?? this.maximum;
    }

    set effectiveMaximum(effectiveMaximum: number) {
        this._effectiveMaximum = effectiveMaximum;
    }

    performAutoScale() {
        const range = this.widget.calculateAutoscaledRange(this);
        if (range) {
            this.effectiveMinimum = range.start;
            this.effectiveMaximum = range.stop;
            this.widget.requestRepaint();
        }
    }

    applyZoom(center: number, ratio: number) { // Positive means zoom-in
        let min = this.effectiveMinimum;
        let max = this.effectiveMaximum;
        let t1: number;
        let t2: number;
        if (this.logScale) {
            max = Math.log10(max);
            min = Math.log10(min);
            const c = Math.log10(center) * ratio;
            const e = 1 - ratio;
            t1 = c + min * e;
            t2 = c + max * e;
            if (t1 < LOWEST_LOG_10) { // clamp lower value
                t1 = LOWEST_LOG_10;
            }
            t1 = Math.pow(10, t1);
            if (t2 > HIGHEST_LOG_10) { // clamp upper value
                t2 = HIGHEST_LOG_10;
            }
            t2 = Math.pow(10, t2);
        } else {
            const f = Math.max(Math.abs(min), Math.abs(max));
            min /= f;
            max /= f;
            const c = (center / f) * ratio;
            const e = 1 - ratio;
            t1 = (c + min * e) * f;
            t2 = (c + max * e) * f;
        }

        this.effectiveMinimum = t1!;
        this.effectiveMaximum = t2!;
        this.widget.requestRepaint();
    }

    get autoScale(): boolean { return this.getValue('auto_scale'); }
    get autoScaleTreshold(): number { return this.getValue('auto_scale_treshold'); }
    get axisColor(): Color { return this.getValue('axis_color'); }
    get axisTitle(): string { return this.getValue('axis_title'); }
    get dashGridLine(): boolean { return this.getValue('dash_grid_line'); }
    get gridColor(): Color { return this.getValue('grid_color'); }
    get leftBottomSide(): boolean { return this.getValue('left_bottom_side'); }
    get logScale(): boolean { return this.getValue('log_scale'); }
    private get maximum(): number { return this.getValue('maximum'); }
    private get minimum(): number { return this.getValue('minimum'); }
    get scaleFont(): Font { return this.getValue('scale_font').scale(this.scale); }
    get scaleFormat(): string { return this.getValue('scale_format'); }
    get showGrid(): boolean { return this.getValue('show_grid'); }
    get timeFormat(): number { return this.getValue('time_format'); }
    get titleFont(): Font { return this.getValue('title_font').scale(this.scale); }
    get visible(): boolean { return this.getValue('visible'); }
    get yAxis(): boolean { return this.getValue('y_axis'); }
}
