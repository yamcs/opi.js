import { Color } from '../Color';
import { Display } from '../Display';
import { Font } from '../Font';
import * as utils from '../utils';
import { Widget } from '../Widget';

export class ActionButton extends Widget {

    private font: Font;
    private toggleButton: boolean;
    private pushActionIndex: number;
    private releaseActionIndex?: number;

    constructor(display: Display, node: Element) {
        super(display, node);
        const fontNode = utils.findChild(node, 'font');
        this.font = utils.parseFontNode(fontNode);
        this.toggleButton = utils.parseBooleanChild(node, 'toggle_button');
        this.pushActionIndex = utils.parseIntChild(node, 'push_action_index');
        if (this.toggleButton) {
            this.releaseActionIndex = utils.parseIntChild(node, 'release_action_index');
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = (this.backgroundColor || Color.BUTTON).toString();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;
        const shadow1 = Color.BLACK;
        const shadow2 = Color.BUTTON_DARKER;
        const hl1 = Color.BUTTON_LIGHTEST;
        const hl2 = this.backgroundColor || Color.BUTTON;

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

        ctx.fillText(lines[0], this.x + (this.width / 2), this.y + (this.height / 2));
    }
}
