import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { BooleanProperty, FontProperty, IntProperty } from '../../properties';
import { PV } from '../../pv/PV';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_FONT = 'font';
const PROP_FORMAT_TYPE = 'format_type';
const PROP_HORIZONTAL_ALIGNMENT = 'horizontal_alignment';
const PROP_PRECISION = 'precision';
const PROP_PRECISION_FROM_PV = 'precision_from_pv';
const PROP_VERTICAL_ALIGNMENT = 'vertical_alignment';

export class TextInput extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new IntProperty(PROP_FORMAT_TYPE));
        this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
        this.properties.add(new IntProperty(PROP_PRECISION));
        this.properties.add(new BooleanProperty(PROP_PRECISION_FROM_PV));
        this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT));
    }

    draw(g: Graphics) {
        const ctx = g.ctx;
        if (!this.transparent) {
            g.fillRect({
                ... this.area,
                color: this.backgroundColor,
            });
        } else if (this.backgroundAlarmSensitive && this.alarm) {
            g.fillRect({
                ... this.area,
                color: this.alarmSensitiveBackgroundColor,
            });
        }

        ctx.fillStyle = this.alarmSensitiveForegroundColor.toString();
        ctx.font = this.font.getFontString();

        let x = this.x;
        if (this.horizAlignment === 0) { // LEFT
            ctx.textAlign = 'start';
        } else if (this.horizAlignment === 1) { // CENTER
            x += this.width / 2;
            ctx.textAlign = 'center';
        } else if (this.horizAlignment === 2) { // RIGHT
            x += this.width;
            ctx.textAlign = 'end';
        }

        let y = this.y;
        if (this.vertAlignment === 0) { // TOP
            ctx.textBaseline = 'top';
        } else if (this.vertAlignment === 1) { // MIDDLE
            y = y + (this.height / 2);
            ctx.textBaseline = 'middle';
        } else if (this.vertAlignment === 2) { // BOTTOM
            y = y + this.height;
            ctx.textBaseline = 'bottom';
        }

        let text = this.text;
        if (this.pv && this.pv.value !== undefined) {
            text = this.formatValue(this.pv, this.pv.value);
        }

        ctx.fillText(text, x, y);
    }

    private formatValue(pv: PV, value: any) {
        const precision = this.precisionFromPV ? pv.precision : this.precision;
        if (typeof value === 'number') {
            if (this.formatType === 0) { // "Default"
                return String(Number(value.toFixed(precision)));
            } else if (this.formatType === 1) { // Decimal
                return String(Number(value.toFixed(precision)));
            } else if (this.formatType === 2) { // Exponential
                return value.toExponential();
            } else if (this.formatType === 3) { // Hex
                return value.toString(16);
            } else {
                console.log(`Unexpected format type ${this.formatType}`);
                return String(value);
            }
        } else {
            return String(value);
        }
    }

    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get formatType(): number { return this.properties.getValue(PROP_FORMAT_TYPE); }
    get horizAlignment(): number { return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT); }
    get precision(): number { return this.properties.getValue(PROP_PRECISION); }
    get precisionFromPV(): boolean { return this.properties.getValue(PROP_PRECISION_FROM_PV); }
    get vertAlignment(): number { return this.properties.getValue(PROP_VERTICAL_ALIGNMENT); }
}
