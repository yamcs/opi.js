import * as constants from '../../constants';
import { Display } from '../../Display';
import { BooleanProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_ALPHA = 'alpha';
const PROP_FILL = 'fill';
const PROP_LINE_WIDTH = 'line_width';
const PROP_START_ANGLE = 'start_angle';
const PROP_TOTAL_ANGLE = 'total_angle';

export class Arc extends Widget {

    readonly kind = constants.TYPE_ARC;

    constructor(display: Display) {
        super(display);
        this.addProperty(new IntProperty(PROP_ALPHA));
        this.addProperty(new IntProperty(PROP_LINE_WIDTH));
        this.addProperty(new IntProperty(PROP_START_ANGLE));
        this.addProperty(new IntProperty(PROP_TOTAL_ANGLE));
        this.addProperty(new BooleanProperty(PROP_FILL));
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha / 255;
        if (this.transparent) {
            ctx.globalAlpha = 0;
        }

        this.drawShape(ctx);

        if (this.lineWidth) {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.foregroundColor.toString();
            ctx.stroke();
        }
        if (this.fill) {
            ctx.fillStyle = this.backgroundColor.toString();
            // TODO the default fill is not accurate. It should fill pie
            // slices.
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    private drawShape(ctx: CanvasRenderingContext2D) {
        const cx = this.x + (this.width / 2);
        const cy = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;

        const startAngle = -this.startAngle * Math.PI / 180;
        const endAngle = -(this.totalAngle + this.startAngle) * Math.PI / 180;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, startAngle, endAngle, true);
    }

    get alpha(): number { return this.getPropertyValue(PROP_ALPHA); }
    get lineWidth(): number { return this.getPropertyValue(PROP_LINE_WIDTH); }
    get startAngle(): number { return this.getPropertyValue(PROP_START_ANGLE); }
    get totalAngle(): number { return this.getPropertyValue(PROP_TOTAL_ANGLE); }
    get fill(): boolean { return this.getPropertyValue(PROP_FILL); }
}
