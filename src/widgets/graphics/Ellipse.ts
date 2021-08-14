import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { shrink } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ALPHA = 'alpha';
const PROP_BG_GRADIENT_COLOR = 'bg_gradient_color';
const PROP_FG_GRADIENT_COLOR = 'fg_gradient_color';
const PROP_FILL_LEVEL = 'fill_level';
const PROP_GRADIENT = 'gradient';
const PROP_HORIZONTAL_FILL = 'horizontal_fill';
const PROP_LINE_COLOR = 'line_color';
const PROP_LINE_WIDTH = 'line_width';
const PROP_LINE_STYLE = 'line_style';

export class Ellipse extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_ALPHA, 255));
        this.properties.add(new ColorProperty(PROP_BG_GRADIENT_COLOR));
        this.properties.add(new ColorProperty(PROP_FG_GRADIENT_COLOR));
        this.properties.add(new BooleanProperty(PROP_GRADIENT));
        this.properties.add(new IntProperty(PROP_LINE_WIDTH));
        this.properties.add(new FloatProperty(PROP_FILL_LEVEL));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL_FILL));
        this.properties.add(new ColorProperty(PROP_LINE_COLOR));
        this.properties.add(new IntProperty(PROP_LINE_STYLE));
    }

    draw(g: Graphics) {
        g.ctx.globalAlpha = this.alpha / 255;

        this.drawBackground(g);
        if (this.fillLevel) {
            this.drawFill(g);
        }

        g.ctx.globalAlpha = 1;
    }

    private drawBackground(g: Graphics) {
        const cx = this.x + (this.width / 2);
        const cy = this.y + (this.height / 2);
        const rx = this.width / 2;
        const ry = this.height / 2;

        if (!this.transparent) {
            if (this.gradient) {
                const x2 = this.horizontalFill ? this.x : this.x + this.width;
                const y2 = this.horizontalFill ? this.y + this.height : this.y;
                const gradient = g.createLinearGradient(this.x, this.y, x2, y2);
                gradient.addColorStop(0, this.backgroundGradientStartColor.toString());
                gradient.addColorStop(1, this.backgroundColor.toString());
                g.fillEllipse({ cx, cy, rx, ry, gradient });
            } else {
                g.fillEllipse({ cx, cy, rx, ry, color: this.backgroundColor });
            }
        }

        if (this.lineWidth) {
            if (this.lineStyle === 0) {
                g.strokeEllipse({
                    cx, cy, rx, ry,
                    color: this.lineColor, lineWidth: this.lineWidth,
                });
            } else if (this.lineStyle === 1) {
                g.strokeEllipse({
                    cx, cy, rx, ry,
                    color: this.lineColor, lineWidth: this.lineWidth,
                    dash: [6, 2],
                });
            } else {
                console.warn(`Unsupported ellipse line style ${this.lineStyle}`);
            }
        }
    }

    private drawFill(g: Graphics) {
        const box = shrink(this, this.lineWidth);

        // Create a clip for the fill level
        g.ctx.save();
        if (this.horizontalFill) {
            const fillWidth = box.width * (this.fillLevel / 100);
            g.ctx.beginPath();
            g.ctx.rect(box.x, box.y, fillWidth, box.height);
        } else {
            const fillHeight = box.height * (this.fillLevel / 100);
            const fillY = box.y + box.height - fillHeight;
            g.ctx.beginPath();
            g.ctx.rect(box.x, fillY, box.width, box.height);
        }
        g.ctx.clip();

        // With clip active, draw the actual fill

        // Do not overlap shape border
        const cx = this.x + (this.width / 2);
        const cy = this.y + (this.height / 2);
        const rx = (this.width - this.lineWidth) / 2;
        const ry = (this.height - this.lineWidth) / 2;

        if (this.gradient) {
            const x2 = this.horizontalFill ? this.x : this.x + this.width;
            const y2 = this.horizontalFill ? this.y + this.height : this.y;
            const gradient = g.createLinearGradient(this.x, this.y, x2, y2);
            gradient.addColorStop(0, this.foregroundGradientStartColor.toString());
            gradient.addColorStop(1, this.foregroundColor.toString());
            g.fillEllipse({ cx, cy, rx, ry, gradient });
        } else {
            g.fillEllipse({ cx, cy, rx, ry, color: this.foregroundColor });
        }

        // Reset clip
        g.ctx.restore();
    }

    get alpha(): number { return this.properties.getValue(PROP_ALPHA); }
    get lineWidth(): number {
        return this.zoom * this.properties.getValue(PROP_LINE_WIDTH);
    }
    get fillLevel(): number { return this.properties.getValue(PROP_FILL_LEVEL); }
    get horizontalFill(): boolean { return this.properties.getValue(PROP_HORIZONTAL_FILL); }
    get lineColor(): Color { return this.properties.getValue(PROP_LINE_COLOR); }
    get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
    get gradient(): boolean { return this.properties.getValue(PROP_GRADIENT); }
    get backgroundGradientStartColor(): Color {
        return this.properties.getValue(PROP_BG_GRADIENT_COLOR);
    }
    get foregroundGradientStartColor(): Color {
        return this.properties.getValue(PROP_FG_GRADIENT_COLOR);
    }
}
