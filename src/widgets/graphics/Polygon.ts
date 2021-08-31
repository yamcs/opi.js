import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics, Path } from '../../Graphics';
import { Point, scalePoints, translatePoints } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, IntProperty, PointsProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ALPHA = 'alpha';
const PROP_FILL_LEVEL = 'fill_level';
const PROP_HORIZONTAL_FILL = 'horizontal_fill';
const PROP_LINE_COLOR = 'line_color';
const PROP_LINE_STYLE = 'line_style';
const PROP_LINE_WIDTH = 'line_width';
const PROP_POINTS = 'points';

export class Polygon extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_ALPHA, 255));
        this.properties.add(new IntProperty(PROP_LINE_WIDTH));
        this.properties.add(new FloatProperty(PROP_FILL_LEVEL));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL_FILL));
        this.properties.add(new ColorProperty(PROP_LINE_COLOR));
        this.properties.add(new IntProperty(PROP_LINE_STYLE));
        this.properties.add(new PointsProperty(PROP_POINTS, []));
    }

    init() {
        const xProperty = this.properties.getProperty('x');
        xProperty?.addListener((newValue, oldValue) => {
            const newPoints = translatePoints(this.points, newValue - oldValue, 0);
            this.properties.setValue(PROP_POINTS, newPoints);
            this.requestRepaint();
        });

        const yProperty = this.properties.getProperty('y');
        yProperty?.addListener((newValue, oldValue) => {
            const newPoints = translatePoints(this.points, 0, newValue - oldValue);
            this.properties.setValue(PROP_POINTS, newPoints);
            this.requestRepaint();
        });
    }

    draw(g: Graphics) {
        g.ctx.globalAlpha = this.alpha / 255;

        const path = Path.fromPoints(this.points).closePath();
        if (!this.transparent) {
            const backgroundColor = this.alarmSensitiveBackgroundColor;
            g.fillPath({ path, color: backgroundColor });
        }

        if (this.lineWidth) {
            if (this.lineStyle === 0) {
                g.strokePath({
                    path,
                    lineWidth: this.lineWidth,
                    color: this.lineColor,
                });
            } else if (this.lineStyle === 2) {
                g.strokePath({
                    path,
                    lineWidth: this.lineWidth,
                    color: this.lineColor,
                    dash: [6, 2],
                });
            } else {
                console.warn(`Unsupported polygon line style ${this.lineStyle}`);
            }
        }

        if (this.fillLevel) {
            this.drawFill(g, path);
        }

        g.ctx.globalAlpha = 1;
    }

    private drawFill(g: Graphics, path: Path) {
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
        g.ctx.save();
        let x = this.x - (this.lineWidth / 2);
        let y = fillY - (this.lineWidth / 2);
        let width = fillWidth + this.lineWidth;
        let height = fillHeight + this.lineWidth;
        g.ctx.beginPath();
        g.ctx.rect(x, y, width, height);
        g.ctx.clip();

        // With clip active, draw the actual fill
        const foregroundColor = this.alarmSensitiveForegroundColor;
        g.fillPath({ path, color: foregroundColor });

        // Reset clip
        g.ctx.restore();
    }

    get alpha(): number { return this.properties.getValue(PROP_ALPHA); }
    get lineWidth(): number {
        return this.scale * this.properties.getValue(PROP_LINE_WIDTH);
    }
    get fillLevel(): number { return this.properties.getValue(PROP_FILL_LEVEL); }
    get horizontalFill(): boolean { return this.properties.getValue(PROP_HORIZONTAL_FILL); }
    get lineColor(): Color { return this.properties.getValue(PROP_LINE_COLOR); }
    get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
    get points(): Point[] {
        return scalePoints(this.properties.getValue(PROP_POINTS), this.scale);
    }
}
