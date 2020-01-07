import { Color } from './Color';
import { Display } from './Display';
import { Point } from './Point';
import * as utils from './utils';
import { Widget } from './Widget';


export class Polyline extends Widget {

    private alpha: number;
    private lineWidth: number;
    private fillLevel: number;
    private horizontalFill: boolean;
    private points: Point[] = [];

    constructor(display: Display, node: Element) {
        super(display, node);
        this.alpha = utils.parseIntChild(node, 'alpha');
        this.lineWidth = utils.parseIntChild(node, 'line_width');
        this.fillLevel = utils.parseFloatChild(node, 'fill_level');
        this.horizontalFill = utils.parseBooleanChild(node, 'horizontal_fill');

        const pointsNode = utils.findChild(node, 'points');
        for (const pointNode of utils.findChildren(pointsNode, 'point')) {
            this.points.push({
                x: utils.parseIntAttribute(pointNode, 'x'),
                y: utils.parseIntAttribute(pointNode, 'y'),
            });
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha / 255;
        if (this.transparent) {
            ctx.globalAlpha = 0;
        }
        this.drawShape(ctx, this.backgroundColor);
        if (this.fillLevel) {
            this.drawFill(ctx);
        }

        ctx.globalAlpha = 1;
    }

    private drawFill(ctx: CanvasRenderingContext2D) {
        let fillY = this.y;
        let fillWidth = this.width;
        let fillHeight = this.height;
        if (this.horizontalFill) {
            fillWidth *= (this.fillLevel / 100);
        } else {
            fillHeight *= (this.fillLevel / 100);
            fillY += fillHeight;
        }

        // Create a clip for the fill level
        ctx.save();
        let x = this.x - (this.lineWidth / 2);
        let y = fillY - (this.lineWidth / 2);
        let width = fillWidth + this.lineWidth;
        let height = fillHeight + this.lineWidth;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        // With clip active, draw the actual fill
        this.drawShape(ctx, this.foregroundColor);

        // Reset clip
        ctx.restore();
    }

    private drawShape(ctx: CanvasRenderingContext2D, color: Color) {
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            if (i == 0) {
                ctx.moveTo(this.points[i].x, this.points[i].y);
            } else {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
        }
        ctx.stroke();
    }
}
