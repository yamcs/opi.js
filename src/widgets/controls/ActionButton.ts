import { Color } from '../../Color';
import * as constants from '../../constants';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { HitCanvas } from '../../HitCanvas';
import { HitRegion } from '../../HitRegion';
import { BooleanProperty, FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_FONT = 'font';
const PROP_PUSH_ACTION_INDEX = 'push_action_index';
const PROP_RELEASE_ACTION_INDEX = 'release_action_index';
const PROP_TOGGLE_BUTTON = 'toggle_button';

export class ActionButton extends Widget {

    readonly kind = constants.TYPE_ACTION_BUTTON;

    private areaRegion?: HitRegion;

    private pushed = false;

    constructor(display: Display) {
        super(display);
        this.addProperty(new FontProperty(PROP_FONT));
        this.addProperty(new BooleanProperty(PROP_TOGGLE_BUTTON));
        this.addProperty(new IntProperty(PROP_PUSH_ACTION_INDEX));
        this.addProperty(new IntProperty(PROP_RELEASE_ACTION_INDEX));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            mouseDown: () => this.onAreaMouseDown(),
            mouseOut: () => this.onAreaMouseOut(),
            mouseUp: () => this.onAreaMouseUp(),
            click: () => this.onAreaClick(),
            cursor: 'pointer'
        };
    }

    private onAreaMouseDown() {
        if (!this.toggleButton) {
            this.pushed = true;
            this.requestRepaint();
        }
    }

    private onAreaMouseUp() {
        if (!this.toggleButton) {
            this.pushed = false;
            this.requestRepaint();
        }
    }

    private onAreaMouseOut() {
        this.pushed = false;
        this.requestRepaint();
    }

    private onAreaClick() {
        this.executeAction(this.pushed ? this.releaseActionIndex! : this.pushActionIndex);
        if (this.toggleButton) {
            this.pushed = !this.pushed;
        }
    }

    draw(ctx: CanvasRenderingContext2D, hitCanvas: HitCanvas) {
        ctx.fillStyle = (this.backgroundColor || Color.BUTTON).toString();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        hitCanvas.beginHitRegion(this.areaRegion!);
        hitCanvas.ctx.fillRect(this.x, this.y, this.width, this.height);

        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;

        let shadow1 = Color.BLACK;
        let shadow2 = Color.BUTTON_DARKER;
        let hl1 = Color.BUTTON_LIGHTEST;
        let hl2 = this.backgroundColor || Color.BUTTON;
        if (this.pushed) {
            shadow1 = hl1;
            shadow2 = hl2;
            hl1 = Color.BLACK;
            hl2 = Color.BUTTON_DARKER;
        }

        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(right, bottom);
        ctx.lineTo(right, top);
        ctx.strokeStyle = shadow1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.strokeStyle = shadow1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(right - 1, bottom - 1);
        ctx.lineTo(right - 1, top + 1);
        ctx.strokeStyle = shadow2.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(right - 1, bottom - 1);
        ctx.lineTo(left + 1, bottom - 1);
        ctx.strokeStyle = shadow2.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right - 1, top);
        ctx.strokeStyle = hl1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom - 1);
        ctx.strokeStyle = hl1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left + 1, top + 1);
        ctx.lineTo(right - 1 - 1, top + 1);
        ctx.strokeStyle = hl2.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left + 1, top + 1);
        ctx.lineTo(left + 1, bottom - 1 - 1);
        ctx.strokeStyle = hl2.toString();
        ctx.stroke();

        const lines = this.text.split('\n');

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        let x = this.x + (this.width / 2);
        let y = this.y + (this.height / 2);
        if (this.pushed) {
            x += 1;
            y += 1;
        }

        ctx.fillText(lines[0], x, y);
    }

    get font(): Font { return this.getPropertyValue(PROP_FONT); }
    get toggleButton(): boolean { return this.getPropertyValue(PROP_TOGGLE_BUTTON); }
    get pushActionIndex(): number { return this.getPropertyValue(PROP_PUSH_ACTION_INDEX); }
    get releaseActionIndex(): number { return this.getPropertyValue(PROP_RELEASE_ACTION_INDEX); }
}
