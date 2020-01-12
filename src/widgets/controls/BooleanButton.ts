import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { HitRegion } from '../../HitRegion';
import { Bounds } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_EFFECT_3D = 'effect_3d';
const PROP_FONT = 'font';
const PROP_OFF_COLOR = 'off_color';
const PROP_OFF_LABEL = 'off_label';
const PROP_ON_COLOR = 'on_color';
const PROP_ON_LABEL = 'on_label';
const PROP_PUSH_ACTION_INDEX = 'push_action_index';
const PROP_RELEASE_ACTION_INDEX = 'released_action_index'; // with 'd'
const PROP_SHOW_LED = 'show_led';
const PROP_SHOW_BOOLEAN_LABEL = 'show_boolean_label';
const PROP_SQUARE_BUTTON = 'square_button';
const PROP_TOGGLE_BUTTON = 'toggle_button';

export class BooleanButton extends Widget {

    private hovered = false;
    private enabled = false;

    private areaRegion?: HitRegion;

    constructor(display: Display) {
        super(display);

        this.properties.add(new BooleanProperty(PROP_SQUARE_BUTTON));
        this.properties.add(new BooleanProperty(PROP_SHOW_LED));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new ColorProperty(PROP_ON_COLOR));
        this.properties.add(new StringProperty(PROP_ON_LABEL));
        this.properties.add(new ColorProperty(PROP_OFF_COLOR));
        this.properties.add(new StringProperty(PROP_OFF_LABEL));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_TOGGLE_BUTTON));
        this.properties.add(new IntProperty(PROP_PUSH_ACTION_INDEX));
        this.properties.add(new IntProperty(PROP_RELEASE_ACTION_INDEX));
        this.properties.add(new BooleanProperty(PROP_SHOW_BOOLEAN_LABEL));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            mouseDown: () => {
                this.enabled = !this.enabled;
                if (this.enabled) {
                    this.executeAction(this.pushActionIndex);
                } else if (this.releaseActionIndex !== undefined) {
                    this.executeAction(this.releaseActionIndex);
                }
                this.requestRepaint();
            },
            mouseEnter: () => {
                this.hovered = true;
                this.requestRepaint();
            },
            mouseOut: () => {
                this.hovered = false;
                this.requestRepaint();
            },
            cursor: 'pointer'
        };
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        if (this.squareButton) {
            this.drawSquare(g, hitCanvas);
        } else {
            this.drawEllipse(g, hitCanvas);
        }

        // Foreground
        if (this.width > this.height) {
            this.drawHorizontal(g);
        } else {
            this.drawVertical(g);
        }

        if (this.showBooleanLabel) {
            g.fillText({
                x: this.x + (this.width / 2),
                y: this.y + (this.height / 2),
                font: this.font,
                color: this.foregroundColor,
                align: 'center',
                baseline: 'middle',
                text: this.enabled ? this.onLabel : this.offLabel,
            });
        }
    }

    private drawSquare(g: Graphics, hitCanvas: HitCanvas) {
        g.fillRect({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: Color.DARK_GRAY,
        });

        hitCanvas.beginHitRegion(this.areaRegion!);
        hitCanvas.ctx.fillRect(this.x, this.y, this.width, this.height);

        const tlColor = this.enabled ? Color.DARK_GRAY : Color.WHITE;
        const brColor = this.enabled ? Color.WHITE : Color.DARK_GRAY;
        if (this.effect3d) {
            g.path(this.x, this.y)
                .lineTo(this.x, this.y + this.height)
                .lineTo(this.x + 2, this.y + this.height - 2)
                .lineTo(this.x + 2, this.y + 2)
                .lineTo(this.x + this.width - 2, this.y + 2)
                .lineTo(this.x + this.width, this.y)
                .closePath()
                .fill({ color: tlColor });

            g.path(this.x, this.y + this.height)
                .lineTo(this.x + this.width, this.y + this.height)
                .lineTo(this.x + this.width, this.y)
                .lineTo(this.x + this.width - 2, this.y + 2)
                .lineTo(this.x + this.width - 2, this.y + this.height - 2)
                .lineTo(this.x + 2, this.y + this.height - 2)
                .closePath()
                .fill({ color: brColor })
        }

        let color = this.backgroundColor;
        if (this.hovered) {
            color = this.backgroundColor.mixWith(Color.WHITE, 0.5);
        }
        g.fillRect({
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 2 - 2,
            height: this.height - 2 - 2,
            color,
        });
    }

    private drawEllipse(g: Graphics, hitCanvas: HitCanvas) {
        if (this.effect3d) {
            const a = this.width / 2;
            const b = this.height / 2;
            const w = Math.sqrt(a * a + b * b);
            const x1 = this.x + a + (b - a - w) / 2 - 1;
            const y1 = this.y + b - (b - a + w) / 2 - 1;
            const x2 = this.x + a + (b - a + w) / 2 + 5;
            const y2 = this.y + b - (b - a - w) / 2 + 5;

            const gradient = g.ctx.createLinearGradient(x1, y1, x2, y2);
            if (this.enabled) {
                gradient.addColorStop(0, Color.DARK_GRAY.toString());
                gradient.addColorStop(1, Color.WHITE.toString());
            } else {
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, Color.DARK_GRAY.toString());
            }
            g.ctx.fillStyle = gradient;
        } else if (this.enabled) {
            g.ctx.fillStyle = Color.WHITE.toString();
        } else {
            g.ctx.fillStyle = Color.DARK_GRAY.toString();
        }

        const x = this.x + (this.width / 2)
        const y = this.y + (this.height / 2)
        const rx = this.width / 2;
        const ry = this.height / 2;
        g.ctx.beginPath();
        g.ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        g.ctx.fill();

        hitCanvas.beginHitRegion(this.areaRegion!);
        hitCanvas.ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        hitCanvas.ctx.fill();

        if (this.hovered) {
            g.ctx.fillStyle = this.backgroundColor.mixWith(Color.WHITE, 0.5).toString();
        } else {
            g.ctx.fillStyle = this.backgroundColor.toString();
        }
        g.ctx.beginPath();
        g.ctx.ellipse(x, y, rx - 2, ry - 2, 0, 0, 2 * Math.PI);
        g.ctx.fill();
    }

    private drawHorizontal(g: Graphics) {
        if (this.showLed) {
            let diameter: number;
            if (this.squareButton) {
                diameter = Math.floor(0.3 * (this.width + this.height) / 2);
                if (diameter > Math.min(this.width, this.height)) {
                    diameter = Math.min(this.width, this.height) - 2;
                }
            } else {
                diameter = Math.floor(0.25 * (this.width + this.height) / 2);
                if (diameter > Math.min(this.width, this.height)) {
                    diameter = Math.min(this.width, this.height) - 8;
                }
            }
            const ledArea: Bounds = {
                x: Math.floor(this.x + this.width * 0.79999 - diameter / 2),
                y: Math.floor(this.y + this.height / 2 - diameter / 2),
                width: diameter,
                height: diameter
            };

            const cx = ledArea.x + (ledArea.width / 2);
            const cy = ledArea.y + (ledArea.height / 2);
            const rx = ledArea.width / 2;
            const ry = ledArea.height / 2;
            const ledColor = this.enabled ? this.onColor : this.offColor;

            g.fillEllipse({ cx, cy, rx, ry, color: ledColor });

            if (this.effect3d) {
                const gradient = g.ctx.createLinearGradient(
                    ledArea.x, ledArea.y, ledArea.x + ledArea.width, ledArea.y + ledArea.height);
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(1, ledColor.withAlpha(0).toString());
                g.ctx.beginPath();
                g.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                g.ctx.fillStyle = gradient;
                g.ctx.fill();
            }
        }
    }

    private drawVertical(g: Graphics) {
        if (this.showLed) {
            let diameter: number;
            if (this.squareButton) {
                diameter = Math.floor(0.3 * (this.width + this.height) / 2);
                if (diameter > Math.min(this.width, this.height)) {
                    diameter = Math.min(this.width, this.height) - 2;
                }
            } else {
                diameter = Math.floor(0.25 * (this.width + this.height) / 2);
                if (diameter > Math.min(this.width, this.height)) {
                    diameter = Math.min(this.width, this.height) - 8;
                }
            }
            const ledArea: Bounds = {
                x: Math.floor(this.x + this.width / 2 - diameter / 2),
                y: Math.floor(this.y + ((1 - 0.79999) * this.height) - diameter / 2),
                width: diameter,
                height: diameter
            };

            const ledColor = this.enabled ? this.onColor : this.offColor;
            const cx = ledArea.x + (ledArea.width / 2);
            const cy = ledArea.y + (ledArea.height / 2);
            const rx = ledArea.width / 2;
            const ry = ledArea.height / 2;
            g.fillEllipse({ cx, cy, rx, ry, color: ledColor });

            if (this.effect3d) {
                const gradient = g.ctx.createLinearGradient(
                    ledArea.x, ledArea.y, ledArea.x + ledArea.width, ledArea.y + ledArea.height);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, ledColor.withAlpha(0).toString());
                g.ctx.beginPath();
                g.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                g.ctx.fillStyle = gradient;
                g.ctx.fill();
            }
        }
    }

    get toggleButton(): boolean { return this.properties.getValue(PROP_TOGGLE_BUTTON); }
    get pushActionIndex(): number { return this.properties.getValue(PROP_PUSH_ACTION_INDEX); }
    get releaseActionIndex(): number { return this.properties.getValue(PROP_RELEASE_ACTION_INDEX); }
    get squareButton(): boolean { return this.properties.getValue(PROP_SQUARE_BUTTON); }
    get showLed(): boolean { return this.properties.getValue(PROP_SHOW_LED); }
    get showBooleanLabel(): boolean { return this.properties.getValue(PROP_SHOW_BOOLEAN_LABEL); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get onColor(): Color { return this.properties.getValue(PROP_ON_COLOR); }
    get onLabel(): string { return this.properties.getValue(PROP_ON_LABEL); }
    get offColor(): Color { return this.properties.getValue(PROP_OFF_COLOR); }
    get offLabel(): string { return this.properties.getValue(PROP_OFF_LABEL); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
}
