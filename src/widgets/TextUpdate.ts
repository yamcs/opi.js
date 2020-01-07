import { Display } from '../Display';
import { Font } from '../Font';
import * as utils from '../utils';
import { Widget } from '../Widget';

export class TextUpdate extends Widget {

    private font: Font;
    private horizAlignment: number;
    private vertAlignment: number;
    // private text: string;

    constructor(display: Display, node: Element) {
        super(display, node);
        const fontNode = utils.findChild(node, 'font');
        this.font = utils.parseFontNode(fontNode);
        this.horizAlignment = utils.parseIntChild(node, 'horizontal_alignment');
        this.vertAlignment = utils.parseIntChild(node, 'vertical_alignment');
        // this.text = utils.parseStringChild(node, 'text');
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.transparent) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        let x = this.x;
        if (this.horizAlignment === 0) { // LEFT
            ctx.textAlign = 'start';
        } else if (this.horizAlignment === 1) { // CENTER
            x += this.width / 2;
            ctx.textAlign = 'center';
        } else if (this.horizAlignment === 2) { // RIGHT
            x += this.width;
            ctx.textAlign = 'end';
        }

        let y = this.y;
        if (this.vertAlignment === 0) { // TOP
            ctx.textBaseline = 'top';
        } else if (this.vertAlignment === 1) { // MIDDLE
            y = y + (this.height / 2);
            ctx.textBaseline = 'middle';
        } else if (this.vertAlignment === 2) { // BOTTOM
            y = y + this.height;
            ctx.textBaseline = 'bottom';
        }

        ctx.fillText(this.text, x, y);
    }
}
