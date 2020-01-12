import { Color } from './Color';
import { Font } from './Font';
import { toBorderBox } from './positioning';
import * as utils from './utils';

interface RectColorFill {
    x: number;
    y: number;
    width: number;
    height: number;
    color: Color;
    rx?: number;
    ry?: number;
}

interface RectGradientFill {
    x: number;
    y: number;
    width: number;
    height: number;
    gradient: CanvasGradient;
    rx?: number;
    ry?: number;
}

type RectFill = RectColorFill | RectGradientFill;

interface TextFill {
    x: number;
    y: number;
    baseline: 'top' | 'middle' | 'bottom';
    align: 'left' | 'right' | 'center';
    font: Font;
    color: Color;
    text: string;
}

interface EclipseFill {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    color: Color;
}

interface RectStroke {
    x: number;
    y: number;
    width: number;
    height: number;
    color: Color;
    rx?: number;
    ry?: number;
    lineWidth?: number;
    dash?: number[];
    crispen?: boolean;
}

interface PathStroke {
    color: Color;
    lineWidth?: number;
    dash?: number[];
}

interface PathFill {
    color: Color;
}

export class Graphics {

    readonly ctx: CanvasRenderingContext2D;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
    }

    fillCanvas(color: Color) {
        this.ctx.fillStyle = color.toString();
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize(width: number, height: number) {
        // Careful not to reset dimensions all the time (it does lots of stuff)
        if (this.ctx.canvas.width != width || this.ctx.canvas.height != height) {
            this.ctx.canvas.width = width;
            this.ctx.canvas.height = height;
        }
    }

    fillRect(fill: RectFill) {
        if ('color' in fill) {
            this.ctx.fillStyle = fill.color.toString();
        } else {
            this.ctx.fillStyle = fill.gradient;
        }

        if (fill.rx || fill.ry) {
            utils.roundRect(this.ctx, fill.x, fill.y, fill.width, fill.height, fill.rx || 0, fill.ry || 0);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(fill.x, fill.y, fill.width, fill.height);
        }
    }

    fillText(fill: TextFill) {
        this.ctx.textBaseline = fill.baseline;
        this.ctx.textAlign = fill.align;
        this.ctx.font = fill.font.getFontString();
        this.ctx.fillStyle = fill.color.toString();
        this.ctx.fillText(fill.text, fill.x, fill.y);
    }

    fillEclipse(fill: EclipseFill) {
        this.ctx.beginPath();
        this.ctx.ellipse(fill.cx, fill.cy, fill.rx, fill.ry, 0, 0, 2 * Math.PI);
        this.ctx.fillStyle = fill.color.toString();
        this.ctx.fill();
    }

    measureText(text: string, font: Font) {
        this.ctx.font = font.getFontString();
        const fm = this.ctx.measureText(text);
        return { width: fm.width, height: font.height };
    }

    strokeRect(stroke: RectStroke) {
        if (stroke.dash) {
            this.ctx.setLineDash(stroke.dash);
        }
        this.ctx.lineWidth = stroke.lineWidth || 1;
        this.ctx.strokeStyle = stroke.color.toString();
        if (stroke.crispen && stroke.lineWidth) {
            const box = toBorderBox(stroke.x, stroke.y, stroke.width, stroke.height, stroke.lineWidth);
            if (stroke.rx || stroke.ry) {
                utils.roundRect(this.ctx, box.x, box.y, box.width, box.height, stroke.rx || 0, stroke.ry || 0);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(box.x, box.y, box.width, box.height);
            }
        } else {
            if (stroke.rx || stroke.ry) {
                utils.roundRect(this.ctx, stroke.x, stroke.y, stroke.width, stroke.height, stroke.rx || 0, stroke.ry || 0);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
            }
        }
        if (stroke.dash) {
            this.ctx.setLineDash([]);
        }
    }

    path(x: number, y: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        return new Path(this.ctx);
    }
}

export class Path {

    constructor(private ctx: CanvasRenderingContext2D) {
    }

    lineTo(x: number, y: number) {
        this.ctx.lineTo(x, y);
        return this;
    }

    moveTo(x: number, y: number) {
        this.ctx.moveTo(x, y);
        return this;
    }

    closePath() {
        this.ctx.closePath();
        return this;
    }

    stroke(stroke: PathStroke) {
        if (stroke.dash) {
            this.ctx.setLineDash(stroke.dash);
        }
        this.ctx.lineWidth = stroke.lineWidth || 1;
        this.ctx.strokeStyle = stroke.color.toString();
        this.ctx.stroke();
        if (stroke.dash) {
            this.ctx.setLineDash([]);
        }
    }

    fill(fill: PathFill) {
        this.ctx.fillStyle = fill.color.toString();
        this.ctx.fill();
    }
}
