import { Color } from '../../Color';
import { Display } from '../../Display';
import { toBorderBox } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLNode';

interface State {
    label: string;
    color: Color;
    value?: number;
}

const PROP_EFFECT_3D = 'effect_3d';
const PROP_STATE_COUNT = 'state_count';
const PROP_SQUARE_LED = 'square_led';
const PROP_OFF_COLOR = 'off_color';
const PROP_OFF_LABEL = 'off_label';
const PROP_ON_COLOR = 'on_color';
const PROP_ON_LABEL = 'on_label';
const PROP_BULB_BORDER = 'bulb_border';
const PROP_BULB_BORDER_COLOR = 'bulb_border_color';
const PROP_STATE_COLOR_FALLBACK = 'state_color_fallback';
const PROP_STATE_LABEL_FALLBACK = 'state_label_fallback';

export class LED extends Widget {

    private states: State[] = [];
    private fallback?: State;

    constructor(display: Display) {
        super(display);
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new BooleanProperty(PROP_SQUARE_LED));
        this.properties.add(new IntProperty(PROP_STATE_COUNT, 2));

        this.properties.add(new ColorProperty(PROP_OFF_COLOR));
        this.properties.add(new StringProperty(PROP_OFF_LABEL));

        this.properties.add(new ColorProperty(PROP_ON_COLOR));
        this.properties.add(new StringProperty(PROP_ON_LABEL));

        this.properties.add(new ColorProperty(PROP_STATE_COLOR_FALLBACK));
        this.properties.add(new StringProperty(PROP_STATE_LABEL_FALLBACK));

        // Old displays don't have these properties
        this.properties.add(new IntProperty(PROP_BULB_BORDER, 3));
        this.properties.add(new ColorProperty(PROP_BULB_BORDER_COLOR, Color.DARK_GRAY));
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);
        if (this.stateCount === 2) {
            this.states.push({
                label: this.offLabel,
                color: this.offColor,
            });
            this.states.push({
                label: this.onLabel,
                color: this.onColor,
            });
        } else {
            for (let i = 0; i < this.stateCount; i++) {
                const colorProperty = new ColorProperty(`state_color_${i}`);
                colorProperty.value = node.getColor(`state_color_${i}`);
                this.properties.add(colorProperty);

                const labelProperty = new StringProperty(`state_label_${i}`);
                labelProperty.value = node.getString(`state_label_${i}`);
                this.properties.add(labelProperty);

                const valueProperty = new FloatProperty(`state_value_${i}`);
                valueProperty.value = node.getFloat(`state_value_${i}`);
                this.properties.add(valueProperty);

                this.states.push({
                    label: this.properties.getValue(labelProperty.name),
                    color: this.properties.getValue(colorProperty.name),
                    value: this.properties.getValue(valueProperty.name),
                });
                this.fallback = {
                    label: this.stateLabelFallback,
                    color: this.stateColorFallback,
                };
            }
        }
    }

    get bulbColor(): Color {
        let color = this.fallback ? this.fallback.color : this.states[0].color;
        for (const state of this.states) {
            if (state.value === 0) {
                color = state.color;
            }
        }
        return color;
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

    get squareLed(): boolean { return this.properties.getValue(PROP_SQUARE_LED); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get stateCount(): number { return this.properties.getValue(PROP_STATE_COUNT); }
    get bulbBorder(): number { return this.properties.getValue(PROP_BULB_BORDER); }
    get bulbBorderColor(): Color { return this.properties.getValue(PROP_BULB_BORDER_COLOR); }
    get offLabel(): string { return this.properties.getValue(PROP_OFF_LABEL); }
    get offColor(): Color { return this.properties.getValue(PROP_OFF_COLOR); }
    get onLabel(): string { return this.properties.getValue(PROP_ON_LABEL); }
    get onColor(): Color { return this.properties.getValue(PROP_ON_COLOR); }
    get stateLabelFallback(): string { return this.properties.getValue(PROP_STATE_LABEL_FALLBACK); }
    get stateColorFallback(): Color { return this.properties.getValue(PROP_STATE_COLOR_FALLBACK); }
}
