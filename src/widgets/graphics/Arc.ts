import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { toRadians } from '../../positioning';
import { BooleanProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ALPHA = 'alpha';
const PROP_FILL = 'fill';
const PROP_LINE_WIDTH = 'line_width';
const PROP_LINE_STYLE = 'line_style';
const PROP_START_ANGLE = 'start_angle';
const PROP_TOTAL_ANGLE = 'total_angle';

export class Arc extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_ALPHA, 255));
        this.properties.add(new IntProperty(PROP_LINE_WIDTH));
        this.properties.add(new IntProperty(PROP_START_ANGLE));
        this.properties.add(new IntProperty(PROP_TOTAL_ANGLE));
        this.properties.add(new BooleanProperty(PROP_FILL));
        this.properties.add(new IntProperty(PROP_LINE_STYLE));
    }

    draw(g: Graphics) {
        g.ctx.globalAlpha = this.alpha / 255;
        this.drawShape(g);
        g.ctx.globalAlpha = 1;
    }

    private drawShape(g: Graphics) {
        const cx = this.x + (this.width / 2);
        const cy = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;

        const startAngle = -toRadians(this.startAngle);
        const endAngle = -toRadians(this.totalAngle + this.startAngle);

        if (this.fill) {
            // Path tricks to draw a wedge
            g.ctx.fillStyle = this.alarmSensitiveBackgroundColor.toString();
            g.ctx.beginPath();
            g.ctx.moveTo(cx, cy);
            g.ctx.ellipse(cx, cy, rx, ry, 0, startAngle, endAngle, true);
            g.ctx.closePath();
            g.ctx.fill();
        }

        if (this.lineWidth && this.totalAngle !== 0) {
            let dash;
            const { scale } = this;
            if (this.lineStyle === 0) { // Solid
                dash = [];
            } else if (this.lineStyle === 1) { // Dash
                dash = [6 * scale, 2 * scale];
            } else if (this.lineStyle === 2) { // Dot
                dash = [2 * scale, 2 * scale];
            } else {
                console.warn(`Unsupported arc line style ${this.lineStyle}`);
            }

            g.strokeEllipse({
                cx, cy, rx, ry, startAngle, endAngle,
                lineWidth: this.lineWidth,
                anticlockwise: true,
                color: this.alarmSensitiveForegroundColor,
                dash,
            });
        }
    }

    get alpha(): number { return this.properties.getValue(PROP_ALPHA); }
    get lineWidth(): number {
        return this.scale * this.properties.getValue(PROP_LINE_WIDTH);
    }
    get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
    get startAngle(): number { return this.properties.getValue(PROP_START_ANGLE); }
    get totalAngle(): number { return this.properties.getValue(PROP_TOTAL_ANGLE); }
    get fill(): boolean { return this.properties.getValue(PROP_FILL); }
}
