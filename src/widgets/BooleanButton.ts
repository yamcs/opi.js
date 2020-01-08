import { Bounds } from '../Bounds';
import { Color } from '../Color';
import { Display } from '../Display';
import { Font } from '../Font';
import * as utils from '../utils';
import { Widget } from '../Widget';

export class BooleanButton extends Widget {

    private toggleButton: boolean;
    private pushActionIndex: number;
    private releaseActionIndex?: number;

    private squareButton: boolean;
    private showLed: boolean;
    private showBooleanLabel: boolean;

    private effect3d: boolean;
    private onColor: Color;
    private onLabel: string;
    private offColor: Color;
    private offLabel: string;
    private font: Font;

    private toggled = false;

    constructor(display: Display, node: Element) {
        super(display, node);
        this.squareButton = utils.parseBooleanChild(node, 'square_button');
        this.showLed = utils.parseBooleanChild(node, 'show_led');
        this.showBooleanLabel = utils.parseBooleanChild(node, 'show_boolean_label');
        this.effect3d = utils.parseBooleanChild(node, 'effect_3d');

        const onColorNode = utils.findChild(node, 'on_color');
        this.onColor = utils.parseColorChild(onColorNode);
        this.onLabel = utils.parseStringChild(node, 'on_label');

        const offColorNode = utils.findChild(node, 'off_color');
        this.offColor = utils.parseColorChild(offColorNode);
        this.offLabel = utils.parseStringChild(node, 'off_label');

        const fontNode = utils.findChild(node, 'font');
        this.font = utils.parseFontNode(fontNode);
        this.toggleButton = utils.parseBooleanChild(node, 'toggle_button');
        this.pushActionIndex = utils.parseIntChild(node, 'push_action_index');
        if (this.toggleButton) {
            this.releaseActionIndex = utils.parseIntChild(node, 'released_action_index');
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.squareButton) {
            ctx.fillStyle = Color.DARK_GRAY.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);

            if (this.effect3d) {
                ctx.fillStyle = Color.WHITE.toString();
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + 2, this.y + 2);
                ctx.lineTo(this.x + 2, this.y + this.height - 2);
                ctx.lineTo(this.x, this.y + this.height);
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + 2, this.y + 2);
                ctx.lineTo(this.x + this.width - 2, this.y + 2);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = Color.DARK_GRAY.toString();
                ctx.beginPath();
                ctx.moveTo(this.x + this.width, this.y);
                ctx.lineTo(this.x + this.width - 2, this.y + 2);
                ctx.lineTo(this.x + this.width - 2, this.y + this.height - 2);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.moveTo(this.x, this.y + this.height);
                ctx.lineTo(this.x + 2, this.y + this.height - 2);
                ctx.lineTo(this.x + this.width - 2, this.y + this.height - 2);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 2 - 2, this.height - 2 - 2);
        } else {
            if (this.effect3d) {
                const a = this.width / 2;
                const b = this.height / 2;
                const w = Math.sqrt(a * a + b * b);
                const x1 = this.x + a + (b - a - w) / 2 - 1;
                const y1 = this.y + b - (b - a + w) / 2 - 1;
                const x2 = this.x + a + (b - a + w) / 2 + 5;
                const y2 = this.y + b - (b - a - w) / 2 + 5;

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, Color.DARK_GRAY.toString());

                // Set the fill style and draw a rectangle
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = Color.DARK_GRAY.toString();
            }

            const x = this.x + (this.width / 2)
            const y = this.y + (this.height / 2)
            const rx = this.width / 2;
            const ry = this.height / 2;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = this.backgroundColor.toString();
            ctx.beginPath();
            ctx.ellipse(x, y, rx - 2, ry - 2, 0, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Foreground
        if (this.width > this.height) {
            this.drawHorizontal(ctx);
        } else {
            this.drawVertical(ctx);
        }

        if (this.showBooleanLabel) {
            ctx.font = this.font.getFontString();
            ctx.fillStyle = this.foregroundColor.toString();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.offLabel, this.x + (this.width / 2), this.y + (this.height / 2))
        }
    }

    private drawHorizontal(ctx: CanvasRenderingContext2D) {
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

            const x = ledArea.x + (ledArea.width / 2);
            const y = ledArea.y + (ledArea.height / 2);
            const rx = ledArea.width / 2;
            const ry = ledArea.height / 2;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
            ctx.fillStyle = this.offColor.toString();
            ctx.fill();

            if (this.effect3d) {
                const gradient = ctx.createLinearGradient(
                    ledArea.x, ledArea.y, ledArea.x + ledArea.width, ledArea.y + ledArea.height);
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(1, this.offColor.withAlpha(0).toString());
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
    }

    private drawVertical(ctx: CanvasRenderingContext2D) {
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

            const x = ledArea.x + (ledArea.width / 2);
            const y = ledArea.y + (ledArea.height / 2);
            const rx = ledArea.width / 2;
            const ry = ledArea.height / 2;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
            ctx.fillStyle = this.offColor.toString();
            ctx.fill();

            if (this.effect3d) {
                const gradient = ctx.createLinearGradient(
                    ledArea.x, ledArea.y, ledArea.x + ledArea.width, ledArea.y + ledArea.height);
                gradient.addColorStop(0, Color.WHITE.toString());
                gradient.addColorStop(1, this.offColor.withAlpha(0).toString());
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
    }
}
