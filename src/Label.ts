import { Display } from './Display';
import { Font } from './Font';
import * as utils from './utils';
import { Widget } from './Widget';

export class Label extends Widget {

    private font: Font;
    private horizAlignment: number;
    private vertAlignment: number;

    constructor(display: Display, node: Element) {
        super(display, node);
        const fontNode = utils.findChild(node, 'font');
        this.font = utils.parseFontNode(fontNode);

        this.horizAlignment = utils.parseIntChild(node, 'horizontal_alignment');
        this.vertAlignment = utils.parseIntChild(node, 'vertical_alignment');
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.transparent) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        const lines = this.text.split('\n');

        ctx.textBaseline = 'hanging';
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

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, this.y);
        }
    }
}
