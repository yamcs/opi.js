import * as constants from '../../constants';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_FONT = 'font';
const PROP_HORIZONTAL_ALIGNMENT = 'horizontal_alignment';
const PROP_VERTICAL_ALIGNMENT = 'vertical_alignment';

export class TextUpdate extends Widget {

    readonly kind = constants.TYPE_TEXT_UPDATE;

    // private text: string;

    constructor(display: Display) {
        super(display);
        this.addProperty(new FontProperty(PROP_FONT));
        this.addProperty(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
        this.addProperty(new IntProperty(PROP_VERTICAL_ALIGNMENT));
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

    get font(): Font { return this.getPropertyValue(PROP_FONT); }
    get horizAlignment(): number { return this.getPropertyValue(PROP_HORIZONTAL_ALIGNMENT); }
    get vertAlignment(): number { return this.getPropertyValue(PROP_VERTICAL_ALIGNMENT); }
}
