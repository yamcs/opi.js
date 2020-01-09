import { Color } from '../../Color';
import * as constants from '../../constants';
import { Display } from '../../Display';
import { Point } from '../../Point';
import { BooleanProperty, ColorProperty, FloatProperty, IntProperty, PointsProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_ALPHA = 'alpha';
const PROP_FILL_LEVEL = 'fill_level';
const PROP_HORIZONTAL_FILL = 'horizontal_fill';
const PROP_LINE_COLOR = 'line_color';
const PROP_LINE_WIDTH = 'line_width';
const PROP_POINTS = 'points';

export class Polygon extends Widget {

    readonly kind = constants.TYPE_POLYGON;

    constructor(display: Display) {
        super(display);
        this.addProperty(new IntProperty(PROP_ALPHA));
        this.addProperty(new IntProperty(PROP_LINE_WIDTH));
        this.addProperty(new FloatProperty(PROP_FILL_LEVEL));
        this.addProperty(new BooleanProperty(PROP_HORIZONTAL_FILL));
        this.addProperty(new ColorProperty(PROP_LINE_COLOR));
        this.addProperty(new PointsProperty(PROP_POINTS, []));
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha / 255;
        if (this.transparent) {
            ctx.globalAlpha = 0;
        }

        this.drawShape(ctx, this.backgroundColor);
        if (this.lineWidth) {
            ctx.strokeStyle = this.lineColor.toString();
            ctx.stroke();
        }

        if (this.fillLevel) {
            this.drawFill(ctx);
        }

        ctx.globalAlpha = 1;
    }

    private drawShape(ctx: CanvasRenderingContext2D, color: Color) {
        ctx.fillStyle = color.toString();
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            if (i == 0) {
                ctx.moveTo(this.points[i].x, this.points[i].y);
            } else {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
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

    get alpha(): number { return this.getPropertyValue(PROP_ALPHA); }
    get lineWidth(): number { return this.getPropertyValue(PROP_LINE_WIDTH); }
    get fillLevel(): number { return this.getPropertyValue(PROP_FILL_LEVEL); }
    get horizontalFill(): boolean { return this.getPropertyValue(PROP_HORIZONTAL_FILL); }
    get lineColor(): Color { return this.getPropertyValue(PROP_LINE_COLOR); }
    get points(): Point[] { return this.getPropertyValue(PROP_POINTS); }
}
