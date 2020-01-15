import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_FONT = 'font';
const PROP_HORIZONTAL_ALIGNMENT = 'horizontal_alignment';
const PROP_VERTICAL_ALIGNMENT = 'vertical_alignment';

export class Label extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
        this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT));
    }

    draw(g: Graphics) {
        const ctx = g.ctx;
        if (!this.transparent) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        const lines = this.text.split('\n');

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        // Canvas does not do multiline string. So
        // we manually calculate each line position.
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';

        // TODO should horizontal center not be line by line?
        let maxWidth = 0;
        for (const line of lines) {
            const textWidth = ctx.measureText(line).width;
            maxWidth = Math.max(0, textWidth);
        }

        let x = this.x;
        if (this.horizAlignment === 1) { // CENTER
            x = this.x + (this.width - maxWidth) / 2;
        } else if (this.horizAlignment === 2) { // RIGHT
            x = this.x + (this.width - maxWidth);
        }

        const textHeight = lines.length * this.font.height
            + ((lines.length - 1) * this.font.height * 0.2);

        let y = this.y;
        if (this.vertAlignment === 1) { // MIDDLE
            y += ((this.height - textHeight) / 2);
        } else if (this.vertAlignment === 2) { // BOTTOM
            y += this.height - textHeight;
        }

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y);
            y += this.font.height * 1.2; // Roughly
        }
    }

    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get horizAlignment(): number { return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT); }
    get vertAlignment(): number { return this.properties.getValue(PROP_VERTICAL_ALIGNMENT); }
}
