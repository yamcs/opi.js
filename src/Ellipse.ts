import { Color } from './Color';
import { Display } from './Display';
import * as utils from './utils';
import { Widget } from './Widget';

export class Ellipse extends Widget {

    private alpha: number;
    private lineWidth: number;
    private fillLevel: number;
    private horizontalFill: boolean;
    private lineColor: Color;
    private foregroundGradientStartColor: Color;
    private backgroundGradientStartColor: Color;
    private gradient: boolean;

    constructor(display: Display, node: Element) {
        super(display, node);
        this.alpha = utils.parseIntChild(node, 'alpha');
        this.lineWidth = utils.parseIntChild(node, 'line_width');
        this.fillLevel = utils.parseFloatChild(node, 'fill_level');
        this.horizontalFill = utils.parseBooleanChild(node, 'horizontal_fill');
        const lineColorNode = utils.findChild(node, 'line_color');
        this.lineColor = utils.parseColorChild(lineColorNode);
        const backgroundGradientStartColorNode = utils.findChild(node, 'bg_gradient_color');
        this.backgroundGradientStartColor = utils.parseColorChild(backgroundGradientStartColorNode);
        const foregroundGradientStartColorNode = utils.findChild(node, 'fg_gradient_color');
        this.foregroundGradientStartColor = utils.parseColorChild(foregroundGradientStartColorNode);
        this.gradient = utils.parseBooleanChild(node, 'gradient');
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha / 255;
        if (this.transparent) {
            ctx.globalAlpha = 0;
        }
        this.drawBackground(ctx);
        if (this.fillLevel) {
            this.drawFill(ctx);
        }

        ctx.globalAlpha = 1;
    }

    private drawBackground(ctx: CanvasRenderingContext2D) {
        if (this.gradient) {
            const x2 = this.horizontalFill ? this.x : this.x + this.width;
            const y2 = this.horizontalFill ? this.y + this.height : this.y;
            const gradient = ctx.createLinearGradient(this.x, this.y, x2, y2);
            gradient.addColorStop(0, this.backgroundGradientStartColor.toString());
            gradient.addColorStop(1, this.backgroundColor.toString());
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.backgroundColor.toString();
        }

        const x = this.x + (this.width / 2);
        const y = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.lineColor.toString();
        ctx.stroke();
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
        if (this.gradient) {
            const x2 = this.horizontalFill ? this.x : this.x + this.width;
            const y2 = this.horizontalFill ? this.y + this.height : this.y;
            const gradient = ctx.createLinearGradient(this.x, this.y, x2, y2);
            gradient.addColorStop(0, this.foregroundGradientStartColor.toString());
            gradient.addColorStop(1, this.foregroundColor.toString());
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.foregroundColor.toString();
        }

        x = this.x + (this.width / 2);
        y = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Reset clip
        ctx.restore();
    }
}
