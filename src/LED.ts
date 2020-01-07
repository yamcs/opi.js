import { toBorderBox } from './Bounds';
import { Color } from './Color';
import { Display } from './Display';
import * as utils from './utils';
import { Widget } from './Widget';

interface State {
    label: string;
    color: Color;
    value?: number;
}

export class LED extends Widget {

    private squareLed: boolean;
    private effect3d: boolean;

    private states: State[] = [];
    private fallback?: State;

    private bulbColor: Color;
    private bulbBorderColor: Color;
    private bulbBorder: number;

    constructor(display: Display, node: Element) {
        super(display, node);
        const stateCount = utils.parseIntChild(node, 'state_count', 2);
        if (stateCount === 2) {
            const offColorNode = utils.findChild(node, 'off_color');
            this.states.push({
                label: utils.parseStringChild(node, 'off_label'),
                color: utils.parseColorChild(offColorNode),
            });
            const onColorNode = utils.findChild(node, 'on_color');
            this.states.push({
                label: utils.parseStringChild(node, 'on_label'),
                color: utils.parseColorChild(onColorNode),
            });
        } else {
            for (let i = 0; i < stateCount; i++) {
                const colorNode = utils.findChild(node, `state_color_${i}`);
                this.states.push({
                    label: utils.parseStringChild(node, `state_label_${i}`),
                    color: utils.parseColorChild(colorNode),
                    value: utils.parseFloatChild(node, `state_value_${i}`),
                });
                const fallbackColorNode = utils.findChild(node, 'state_color_fallback');
                this.fallback = {
                    label: utils.parseStringChild(node, 'state_label_fallback'),
                    color: utils.parseColorChild(fallbackColorNode),
                };
            }
        }

        // Initial state
        this.bulbColor = this.fallback ? this.fallback.color : this.states[0].color;
        for (const state of this.states) {
            if (state.value === 0) {
                this.bulbColor = state.color;
            }
        }

        // Old displays don't have these properties
        this.bulbBorder = utils.parseIntChild(node, 'bulb_border', 3);
        this.bulbBorderColor = Color.DARK_GRAY;
        if (utils.hasChild(node, 'bulb_border_color')) {
            const bulbBorderColorNode = utils.findChild(node, 'bulb_border_color');
            this.bulbBorderColor = utils.parseColorChild(bulbBorderColorNode);
        }

        this.squareLed = utils.parseBooleanChild(node, 'square_led');
        this.effect3d = utils.parseBooleanChild(node, 'effect_3d');
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.squareLed) {
            if (this.effect3d) {
                this.drawSquare3d(ctx);
            } else {
                this.drawSquare2d(ctx);
            }
        } else {
            if (this.effect3d) {
                this.drawCircle3d(ctx);
            } else {
                this.drawCircle2d(ctx);
            }
        }
    }

    private drawCircle2d(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bulbColor.toString();
        ctx.lineWidth = this.bulbBorder;
        ctx.strokeStyle = this.bulbBorderColor.toString();

        const x = this.x + (this.width / 2);
        const y = this.y + (this.height / 2);
        let rx = this.width / 2;
        let ry = this.height / 2;
        if (this.bulbBorder > 0) {
            rx -= (this.bulbBorder / 2.0);
            ry -= (this.bulbBorder / 2.0);
        }
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    private drawCircle3d(ctx: CanvasRenderingContext2D) {
        let x = this.x + (this.width / 2);
        let y = this.y + (this.height / 2);
        let rx = this.width / 2;
        let ry = this.height / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fillStyle = Color.WHITE.toString();
        ctx.fill();

        let gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, this.bulbBorderColor.toString());
        gradient.addColorStop(1, this.bulbBorderColor.withAlpha(0).toString());
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        const innerWidth = this.width - (2 * this.bulbBorder);
        const innerHeight = this.height - (2 * this.bulbBorder);
        x = this.x + (this.width / 2);
        y = this.y + (this.height / 2);
        rx = innerWidth / 2;
        ry = innerHeight / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fillStyle = this.bulbColor.toString();
        ctx.fill();

        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, this.bulbBorderColor.withAlpha(0).toString());
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawSquare2d(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bulbColor.toString();
        ctx.strokeStyle = this.bulbBorderColor.toString();
        ctx.lineWidth = this.bulbBorder;
        const box = toBorderBox(this.x, this.y, this.width, this.height, this.bulbBorder);
        ctx.fillRect(box.x, box.y, box.width, box.height);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    private drawSquare3d(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bulbBorderColor.toString();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Left border
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.bulbBorder, this.y + this.bulbBorder);
        ctx.lineTo(this.x + this.bulbBorder, this.y + this.height - this.bulbBorder);
        ctx.lineTo(this.x, this.y + this.height);
        let gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Top border
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.bulbBorder, this.y + this.bulbBorder);
        ctx.lineTo(this.x + this.width - this.bulbBorder, this.y + this.bulbBorder);
        ctx.lineTo(this.x + this.width, this.y);
        gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Right border
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width - this.bulbBorder, this.y + this.bulbBorder);
        ctx.lineTo(this.x + this.width - this.bulbBorder, this.y + this.height - this.bulbBorder);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bottom border
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.bulbBorder, this.y + this.height - this.bulbBorder);
        ctx.lineTo(this.x + this.width - this.bulbBorder, this.y + this.height - this.bulbBorder);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bulb
        const x = this.x + this.bulbBorder;
        const y = this.y + this.bulbBorder;
        const width = this.width - (2 * this.bulbBorder);
        const height = this.height - (2 * this.bulbBorder);

        ctx.fillStyle = this.bulbColor.toString();
        ctx.fillRect(x, y, width, height);

        // Bulb gradient overlay
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.784)');
        gradient.addColorStop(1, this.bulbColor.withAlpha(0).toString());
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
    }
}
