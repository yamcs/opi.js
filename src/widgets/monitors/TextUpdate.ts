import { Display } from '../../Display';
import { OpenPVEvent } from '../../events';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { shrink } from '../../positioning';
import { FontProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_FONT = 'font';
const PROP_HORIZONTAL_ALIGNMENT = 'horizontal_alignment';
const PROP_VERTICAL_ALIGNMENT = 'vertical_alignment';

export class TextUpdate extends Widget {

    private areaRegion?: HitRegionSpecification;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
        this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            click: () => {
                const event: OpenPVEvent = { pvName: this.pvName! };
                this.display.fireEvent('openpv', event);
            },
            cursor: 'pointer',
        };
    }

    draw(g: Graphics) {
        const ctx = g.ctx;
        if (!this.transparent) {
            g.fillRect({
                ... this.area,
                color: this.backgroundColor,
            });
        } else if (this.backgroundAlarmSensitive && this.alarm) {
            g.fillRect({
                ... this.area,
                color: this.alarmSensitiveBackgroundColor,
            });
        }

        if (this.pv && this.pv.navigable) {
            const area = g.addHitRegion(this.areaRegion!);
            area.addRect(this.x, this.y, this.width, this.height);
        }

        ctx.fillStyle = this.alarmSensitiveForegroundColor.toString();
        ctx.font = this.font.getFontString();

        const textBounds = shrink(this.area, 2, 2);

        let x = textBounds.x;
        if (this.horizAlignment === 0) { // LEFT
            ctx.textAlign = 'start';
        } else if (this.horizAlignment === 1) { // CENTER
            x += textBounds.width / 2;
            ctx.textAlign = 'center';
        } else if (this.horizAlignment === 2) { // RIGHT
            x += textBounds.width;
            ctx.textAlign = 'end';
        }

        let y = textBounds.y;
        if (this.vertAlignment === 0) { // TOP
            ctx.textBaseline = 'top';
        } else if (this.vertAlignment === 1) { // MIDDLE
            y = y + (textBounds.height / 2);
            ctx.textBaseline = 'middle';
        } else if (this.vertAlignment === 2) { // BOTTOM
            y = y + textBounds.height;
            ctx.textBaseline = 'bottom';
        }

        let text = this.text;
        if (this.pv && this.pv.value !== undefined) {
            text = String(this.pv.value);
        }

        ctx.fillText(text, x, y);
    }

    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get horizAlignment(): number { return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT); }
    get vertAlignment(): number { return this.properties.getValue(PROP_VERTICAL_ALIGNMENT); }
}
