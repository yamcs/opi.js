import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { Bounds } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_BIT = 'bit';
const PROP_ENABLED = 'enabled';
const PROP_FONT = 'font';
const PROP_LABEL = 'label';
const PROP_SELECTED_COLOR = 'selected_color';

const BOX_SIZE = 16;
const BOX_BORDER_COLOR = new Color(130, 130, 130);
const BOX_BACKGROUND_MIX_COLOR = new Color(94, 151, 230);
const GAP = 4;

export class CheckBox extends Widget {

    private hovered = false;
    private manualToggleState = false; // Without PV

    private areaRegion?: HitRegionSpecification;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_BIT));
        this.properties.add(new BooleanProperty(PROP_ENABLED));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new StringProperty(PROP_LABEL));
        this.properties.add(new ColorProperty(PROP_SELECTED_COLOR));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            mouseDown: () => {
                this.booleanValue ? this.toggleOff() : this.toggleOn();
                this.requestRepaint();
            },
            mouseEnter: () => {
                this.hovered = true;
                this.requestRepaint();
            },
            mouseOut: () => {
                this.hovered = false;
                this.requestRepaint();
            },
            cursor: 'pointer'
        };
    }

    private toggleOn() {
        this.manualToggleState = true;
        if (this.pv && this.pv.writable) {
            if (this.bit < 0) {
                this.display.pvEngine.setValue(new Date(), this.pv.name, 1);
            } else {
                const value = this.pv.value | (1 << this.bit);
                this.display.pvEngine.setValue(new Date(), this.pv.name, value);
            }
        }
    }

    private toggleOff() {
        this.manualToggleState = false;
        if (this.pv && this.pv.writable) {
            if (this.bit < 0) {
                this.display.pvEngine.setValue(new Date(), this.pv.name, 0);
            } else {
                const value = this.pv.value & ~(1 << this.bit);
                this.display.pvEngine.setValue(new Date(), this.pv.name, value);
            }
        }
    }

    get booleanValue() {
        if (this.pv && this.pv.value !== undefined) {
            if (this.bit < 0) {
                return Boolean(this.pv?.toNumber());
            } else {
                return ((this.pv?.value >> this.bit) & 1) > 0;
            }
        } else {
            return this.manualToggleState;
        }
    }

    draw(g: Graphics) {
        const area = g.addHitRegion(this.areaRegion!);
        area.addRect(this.x, this.y, this.width, this.height);

        const toggled = this.booleanValue;

        let backgroundColor = this.backgroundColor;
        if (this.hovered) {
            backgroundColor = backgroundColor.mixWith(BOX_BACKGROUND_MIX_COLOR, 0.7);
        }

        const box: Bounds = {
            x: this.x,
            y: this.y + (this.height / 2) - (BOX_SIZE / 2),
            width: BOX_SIZE,
            height: BOX_SIZE,
        };
        const gradient = g.createLinearGradient(box.x, box.y + 1, box.x, box.y + box.height);
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, backgroundColor.toString());
        g.fillRect({
            ...box,
            rx: 2,
            ry: 2,
            gradient,
        });
        g.strokeRect({
            x: box.x + 0.5,
            y: box.y + 0.5,
            width: box.width - 1,
            height: box.height - 1,
            rx: 2,
            ry: 2,
            color: BOX_BORDER_COLOR,
        });

        if (toggled) {
            g.strokePath({
                lineWidth: 3,
                color: this.selectedColor,
                path: new Path(box.x + 3, box.y + Math.floor(BOX_SIZE * 0.45))
                    .lineTo(box.x + Math.floor(BOX_SIZE * 0.45), box.y + BOX_SIZE * 3 / 4 - 1)
                    .lineTo(box.x + BOX_SIZE - 2, box.y + 3)
            });
        }

        if (this.enabled) {
            g.fillText({
                x: box.x + box.width + GAP,
                y: box.y + box.height / 2,
                align: 'left',
                baseline: 'middle',
                color: this.foregroundColor,
                font: this.font,
                text: this.label,
            });
        } else {
            g.fillText({
                x: box.x + box.width + GAP + 1,
                y: box.y + box.height / 2 + 1,
                align: 'left',
                baseline: 'middle',
                color: Color.BUTTON_LIGHTEST,
                font: this.font,
                text: this.label,
            });
            g.fillText({
                x: box.x + box.width + GAP,
                y: box.y + box.height / 2,
                align: 'left',
                baseline: 'middle',
                color: Color.BUTTON_DARKER,
                font: this.font,
                text: this.label,
            });
        }
    }

    get bit(): number { return this.properties.getValue(PROP_BIT); }
    get enabled(): boolean { return this.properties.getValue(PROP_ENABLED); }
    get selectedColor(): Color { return this.properties.getValue(PROP_SELECTED_COLOR); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get label(): string { return this.properties.getValue(PROP_LABEL); }
}
