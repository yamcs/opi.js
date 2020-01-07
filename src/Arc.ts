import { Display } from './Display';
import * as utils from './utils';
import { Widget } from './Widget';

export class Arc extends Widget {

    private alpha: number;
    private lineWidth: number;
    private startAngle: number;
    private totalAngle: number;
    private fill: boolean;

    constructor(display: Display, node: Element) {
        super(display, node);
        this.alpha = utils.parseIntChild(node, 'alpha');
        this.lineWidth = utils.parseIntChild(node, 'line_width');
        this.startAngle = utils.parseIntChild(node, 'start_angle');
        this.totalAngle = utils.parseIntChild(node, 'total_angle');
        this.fill = utils.parseBooleanChild(node, 'fill');
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
}
