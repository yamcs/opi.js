import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics, Path } from '../../Graphics';
import { Bounds, shrink, toBorderBox } from '../../positioning';
import { BooleanProperty, ColorProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_BIT_REVERSE = 'bitReverse';
const PROP_EFFECT_3D = 'effect_3d';
const PROP_HORIZONTAL = 'horizontal';
const PROP_LED_BORDER = 'led_border';
const PROP_LED_BORDER_COLOR = 'led_border_color';
const PROP_LED_PACKED = 'led_packed';
const PROP_NUM_BITS = 'numBits';
const PROP_OFF_COLOR = 'off_color';
const PROP_ON_COLOR = 'on_color';
const PROP_START_BIT = 'startBit';
const PROP_SQUARE_LED = 'square_led';

export class ByteMonitor extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new BooleanProperty(PROP_BIT_REVERSE));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL));
        this.properties.add(new IntProperty(PROP_NUM_BITS));
        this.properties.add(new ColorProperty(PROP_OFF_COLOR));
        this.properties.add(new ColorProperty(PROP_ON_COLOR));
        this.properties.add(new IntProperty(PROP_START_BIT));
        this.properties.add(new BooleanProperty(PROP_SQUARE_LED));

        // Old displays don't have these properties
        this.properties.add(new IntProperty(PROP_LED_BORDER, 3));
        this.properties.add(new ColorProperty(PROP_LED_BORDER_COLOR, Color.DARK_GRAY));
        this.properties.add(new BooleanProperty(PROP_LED_PACKED, false));
    }

    getLedColor(index: number): Color {
        let booleanValue = false;
        if (this.pv?.value !== undefined) {
            for (let ii = this.startBit; ii < this.startBit + this.numBits; ii++) {
                let widgetIndex = 0;
                if (this.bitReverse) {
                    widgetIndex = ii - this.startBit;
                } else {
                    widgetIndex = (this.numBits - 1) - (ii - this.startBit);
                }
                if (widgetIndex === index) {
                    booleanValue = ((this.pv?.value >> ii) & 1) > 0;
                    break;
                }
            }
        }

        return booleanValue ? this.onColor : this.offColor;
    }

    draw(g: Graphics) {
        if (this.numBits < 1) {
            return;
        }

        let bounds = this.bounds;
        if (this.borderAlarmSensitive) {
            bounds = shrink(bounds, 2);
        }

        if (this.horizontal) {
            this.drawHorizontal(g, bounds);
        } else {
            this.drawVertical(g, bounds);
        }
    }

    private drawHorizontal(g: Graphics, bounds: Bounds) {
        let ledWidth;
        let ledSpacing;
        if (this.ledPacked) {
            ledWidth = Math.floor((bounds.width - this.ledBorder) / this.numBits + this.ledBorder);
            ledSpacing = ledWidth - this.ledBorder;
        } else {
            ledWidth = Math.floor(bounds.width / this.numBits);
            ledSpacing = ledWidth;
        }

        let ledHeight = 0;
        if (ledWidth > bounds.height || this.squareLed) {
            ledHeight = bounds.height;
        } else {
            ledHeight = ledWidth;
        }

        for (let i = 0; i < this.numBits; i++) {
            if (this.squareLed) {
                const area: Bounds = {
                    x: bounds.x + (i * ledSpacing),
                    y: bounds.y,
                    width: ledWidth,
                    height: ledHeight,
                };
                if (this.effect3d) {
                    this.drawSquare3d(g, area, i);
                } else {
                    this.drawSquare2d(g, area, i);
                }
            } else {
                const ledSize = Math.min(ledWidth, ledHeight);
                const area: Bounds = {
                    x: bounds.x + (i * ledSpacing),
                    y: bounds.y,
                    width: ledSize,
                    height: ledSize,
                };
                if (this.effect3d) {
                    this.drawCircle3d(g, area, i);
                } else {
                    this.drawCircle2d(g, area, i);
                }
            }
        }
    }

    private drawVertical(g: Graphics, bounds: Bounds) {
        let ledHeight;
        let ledSpacing;
        if (this.ledPacked) {
            ledHeight = Math.floor((bounds.height - this.ledBorder) / this.numBits + this.ledBorder);
            ledSpacing = ledHeight - this.ledBorder;
        } else {
            ledHeight = Math.floor(bounds.height / this.numBits);
            ledSpacing = ledHeight;
        }

        let ledWidth = 0;
        if (ledHeight > bounds.width || this.squareLed) {
            ledWidth = bounds.width;
        } else {
            ledWidth = ledHeight;
        }

        for (let i = 0; i < this.numBits; i++) {
            if (this.squareLed) {
                const area: Bounds = {
                    x: bounds.x,
                    y: bounds.y + (i * ledSpacing),
                    width: ledWidth,
                    height: ledHeight,
                };
                if (this.effect3d) {
                    this.drawSquare3d(g, area, i);
                } else {
                    this.drawSquare2d(g, area, i);
                }
            } else {
                const ledSize = Math.min(ledWidth, ledHeight);
                const area: Bounds = {
                    x: bounds.x,
                    y: bounds.y + (i * ledSpacing),
                    width: ledSize,
                    height: ledSize,
                };
                if (this.effect3d) {
                    this.drawCircle3d(g, area, i);
                } else {
                    this.drawCircle2d(g, area, i);
                }
            }
        }
    }

    private drawCircle2d(g: Graphics, area: Bounds, bit: number) {
        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        let rx = area.width / 2;
        let ry = area.height / 2;
        if (this.ledBorder > 0) {
            rx -= (this.ledBorder / 2.0);
            ry -= (this.ledBorder / 2.0);
        }

        g.fillEllipse({ cx, cy, rx, ry, color: this.getLedColor(bit) });
        g.strokeEllipse({ cx, cy, rx, ry, color: this.ledBorderColor, lineWidth: this.ledBorder });
    }

    private drawCircle3d(g: Graphics, area: Bounds, bit: number) {
        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        let rx = area.width / 2;
        let ry = area.height / 2;
        g.fillEllipse({ cx, cy, rx, ry, color: Color.WHITE });

        let gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, this.ledBorderColor.toString());
        gradient.addColorStop(1, this.ledBorderColor.withAlpha(0).toString());
        g.fillEllipse({ cx, cy, rx, ry, gradient });

        const innerWidth = area.width - (2 * this.ledBorder);
        const innerHeight = area.height - (2 * this.ledBorder);
        rx = innerWidth / 2;
        ry = innerHeight / 2;
        g.fillEllipse({ cx, cy, rx, ry, color: this.getLedColor(bit) });

        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, this.ledBorderColor.withAlpha(0).toString());
        g.fillEllipse({ cx, cy, rx, ry, gradient });
    }

    private drawSquare2d(g: Graphics, area: Bounds, bit: number) {
        const box = toBorderBox(area.x, area.y, area.width, area.height, this.ledBorder);
        g.fillRect({
            ...box,
            color: this.getLedColor(bit),
        });
        g.strokeRect({
            ...box,
            color: this.ledBorderColor,
            lineWidth: this.ledBorder,
        });
    }

    private drawSquare3d(g: Graphics, area: Bounds, bit: number) {
        g.fillRect({
            ...area,
            color: this.ledBorderColor,
        });

        // Left border
        let gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y)
                .lineTo(area.x + this.ledBorder, area.y + this.ledBorder)
                .lineTo(area.x + this.ledBorder, area.y + area.height - this.ledBorder)
                .lineTo(area.x, area.y + area.height)
        });

        // Top border
        gradient = g.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y)
                .lineTo(area.x + this.ledBorder, area.y + this.ledBorder)
                .lineTo(area.x + area.width - this.ledBorder, area.y + this.ledBorder)
                .lineTo(area.x + area.width, area.y)
        });

        // Right border
        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x + area.width, area.y)
                .lineTo(area.x + area.width - this.ledBorder, area.y + this.ledBorder)
                .lineTo(area.x + area.width - this.ledBorder, area.y + area.height - this.ledBorder)
                .lineTo(area.x + area.width, area.y + area.height)
        });

        // Bottom border
        gradient = g.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y + area.height)
                .lineTo(area.x + this.ledBorder, area.y + area.height - this.ledBorder)
                .lineTo(area.x + area.width - this.ledBorder, area.y + area.height - this.ledBorder)
                .lineTo(area.x + area.width, area.y + area.height)
        });

        // Bulb
        const x = area.x + this.ledBorder;
        const y = area.y + this.ledBorder;
        const width = area.width - (2 * this.ledBorder);
        const height = area.height - (2 * this.ledBorder);

        const ledColor = this.getLedColor(bit);
        g.fillRect({ x, y, width, height, color: ledColor });

        // Bulb gradient overlay
        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.784)');
        gradient.addColorStop(1, ledColor.withAlpha(0).toString());
        g.fillRect({ x, y, width, height, gradient });
    }

    get bitReverse(): boolean { return this.properties.getValue(PROP_BIT_REVERSE); }
    get horizontal(): boolean { return this.properties.getValue(PROP_HORIZONTAL); }
    get numBits(): number { return this.properties.getValue(PROP_NUM_BITS); }
    get startBit(): number { return this.properties.getValue(PROP_START_BIT); }
    get ledPacked(): boolean { return this.properties.getValue(PROP_LED_PACKED); }
    get ledBorder(): number { return this.properties.getValue(PROP_LED_BORDER); }
    get ledBorderColor(): Color { return this.properties.getValue(PROP_LED_BORDER_COLOR); }
    get offColor(): Color { return this.properties.getValue(PROP_OFF_COLOR); }
    get onColor(): Color { return this.properties.getValue(PROP_ON_COLOR); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get squareLed(): boolean { return this.properties.getValue(PROP_SQUARE_LED); }
}
