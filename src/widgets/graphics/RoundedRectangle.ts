import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { shrink } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_ALPHA = 'alpha';
const PROP_BG_GRADIENT_COLOR = 'bg_gradient_color';
const PROP_CORNER_WIDTH = 'corner_width';
const PROP_CORNER_HEIGHT = 'corner_height';
const PROP_FG_GRADIENT_COLOR = 'fg_gradient_color';
const PROP_FILL_LEVEL = 'fill_level';
const PROP_GRADIENT = 'gradient';
const PROP_HORIZONTAL_FILL = 'horizontal_fill';
const PROP_LINE_COLOR = 'line_color';
const PROP_LINE_WIDTH = 'line_width';
const PROP_LINE_STYLE = 'line_style';

export class RoundedRectangle extends Widget {

    constructor(display: Display) {
        super(display);

        // This widget ignores the fill associated with border 14.
        this.fillRoundRectangleBackgroundBorder = false;

        this.properties.add(new IntProperty(PROP_ALPHA))
        this.properties.add(new ColorProperty(PROP_BG_GRADIENT_COLOR));
        this.properties.add(new ColorProperty(PROP_FG_GRADIENT_COLOR));
        this.properties.add(new BooleanProperty(PROP_GRADIENT));
        this.properties.add(new IntProperty(PROP_LINE_WIDTH));
        this.properties.add(new FloatProperty(PROP_FILL_LEVEL));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL_FILL));
        this.properties.add(new ColorProperty(PROP_LINE_COLOR));
        this.properties.add(new IntProperty(PROP_CORNER_WIDTH));
        this.properties.add(new IntProperty(PROP_CORNER_HEIGHT));
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
        if (!this.transparent) {
            if (this.gradient) {
                const x2 = this.horizontalFill ? this.x : this.x + this.width;
                const y2 = this.horizontalFill ? this.y + this.height : this.y;
                const gradient = g.ctx.createLinearGradient(this.x, this.y, x2, y2);
                gradient.addColorStop(0, this.backgroundGradientStartColor.toString());
                gradient.addColorStop(1, this.backgroundColor.toString());
                g.fillRect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    rx: this.cornerWidth / 2,
                    ry: this.cornerHeight / 2,
                    gradient,
                });
            } else {
                g.fillRect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    rx: this.cornerWidth / 2,
                    ry: this.cornerHeight / 2,
                    color: this.backgroundColor,
                });
            }
        }

        if (this.lineWidth) {
            if (this.lineStyle === 0) { // Solid
                g.strokeRect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    rx: this.cornerWidth / 2,
                    ry: this.cornerHeight / 2,
                    color: this.lineColor,
                    lineWidth: this.lineWidth,
                    crispen: true,
                });
            } else {
                console.warn(`Unsupported RoundedRectangle line style ${this.lineStyle}`);
            }
        }
    }

    private drawFill(g: Graphics) {
        const rx = this.cornerWidth / 2;
        const ry = this.cornerHeight / 2

        const box = shrink(this, this.lineWidth);

        // Create a clip for the fill level
        // (no rounded corners, the fill will do that)
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
        if (this.gradient) {
            const x2 = this.horizontalFill ? box.x : box.x + box.width;
            const y2 = this.horizontalFill ? box.y + box.height : box.y;
            const gradient = g.ctx.createLinearGradient(box.x, box.y, x2, y2);
            gradient.addColorStop(0, this.foregroundGradientStartColor.toString());
            gradient.addColorStop(1, this.foregroundColor.toString());
            g.fillRect({ ...box, rx, ry, gradient });
        } else {
            g.fillRect({ ...box, rx, ry, color: this.foregroundColor });
        }

        // Reset clip
        g.ctx.restore();
    }

    get alpha(): number { return this.properties.getValue(PROP_ALPHA); }
    get lineWidth(): number { return this.properties.getValue(PROP_LINE_WIDTH); }
    get fillLevel(): number { return this.properties.getValue(PROP_FILL_LEVEL); }
    get horizontalFill(): boolean { return this.properties.getValue(PROP_HORIZONTAL_FILL); }
    get lineColor(): Color { return this.properties.getValue(PROP_LINE_COLOR); }
    get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
    get gradient(): boolean { return this.properties.getValue(PROP_GRADIENT); }
    get cornerWidth(): number { return this.properties.getValue(PROP_CORNER_WIDTH); }
    get cornerHeight(): number { return this.properties.getValue(PROP_CORNER_HEIGHT); }
    get backgroundGradientStartColor(): Color {
        return this.properties.getValue(PROP_BG_GRADIENT_COLOR);
    }
    get foregroundGradientStartColor(): Color {
        return this.properties.getValue(PROP_FG_GRADIENT_COLOR);
    }
}
