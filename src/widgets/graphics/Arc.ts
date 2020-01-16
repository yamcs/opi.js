import { Display } from '../../Display';
import { Graphics, Path } from '../../Graphics';
import { convertPolarToCartesian2, findRelativePoint, toRadians } from '../../positioning';
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

        if (!this.transparent && this.fill) {
            if (this.totalAngle < 180) {
                this.drawSlice(g, startAngle, endAngle);
            } else { // Draw two slices
                let midAngle = -toRadians(this.startAngle + 180 + 2 /* overlap */);
                // this.drawSlice(g, startAngle, midAngle);
                g.fillEllipse({
                    cx, cy, rx, ry, startAngle, endAngle: midAngle,
                    anticlockwise: true,
                    color: this.alarmSensitiveBackgroundColor,
                });
                midAngle = -toRadians(this.startAngle + 180);
                this.drawSlice(g, midAngle, endAngle);
            }
        }

        if (this.lineWidth && this.totalAngle !== 0 && this.totalAngle !== 360) {
            let dash;
            if (this.lineStyle === 0) { // Solid
                dash = [];
            } else if (this.lineStyle === 1) { // Dash
                dash = [6, 2];
            } else if (this.lineStyle === 2) { // Dot
                dash = [2, 2];
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

    private drawSlice(g: Graphics, startAngle: number, endAngle: number) {
        const cx = this.x + (this.width / 2);
        const cy = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;

        const p1 = convertPolarToCartesian2(rx, ry, startAngle);
        const p2 = convertPolarToCartesian2(rx, ry, endAngle);

        g.ctx.save();
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        g.ctx.clip();

        const triangleP1 = findRelativePoint({ x: 0, y: 0 }, p1, 1000);
        const triangleP2 = findRelativePoint({ x: 0, y: 0 }, p2, 1000);

        g.fillPath({
            color: this.alarmSensitiveBackgroundColor,
            path: new Path(cx, cy)
                .lineTo(cx + triangleP1.x, cy + triangleP1.y)
                .lineTo(cx + triangleP2.x, cy + triangleP2.y)
                .closePath()
        });
        g.ctx.restore();
    }

    get alpha(): number { return this.properties.getValue(PROP_ALPHA); }
    get lineWidth(): number { return this.properties.getValue(PROP_LINE_WIDTH); }
    get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
    get startAngle(): number { return this.properties.getValue(PROP_START_ANGLE); }
    get totalAngle(): number { return this.properties.getValue(PROP_TOTAL_ANGLE); }
    get fill(): boolean { return this.properties.getValue(PROP_FILL); }
}
