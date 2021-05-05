import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { Bounds } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, StringListProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ENABLED = 'enabled';
const PROP_FONT = 'font';
const PROP_HORIZONTAL = 'horizontal';
const PROP_ITEMS = 'items';
const PROP_ITEMS_FROM_PV = 'items_from_pv';
const PROP_SELECTED_COLOR = 'selected_color';

export class ChoiceButton extends Widget {

    private pushedItem?: number;

    private itemRegions: HitRegionSpecification[] = [];

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new BooleanProperty(PROP_ENABLED));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL));
        this.properties.add(new StringListProperty(PROP_ITEMS, []));
        this.properties.add(new BooleanProperty(PROP_ITEMS_FROM_PV));
        this.properties.add(new ColorProperty(PROP_SELECTED_COLOR));
    }

    init() {
        for (let i = 0; i < this.items.length; i++) {
            this.itemRegions.push({
                id: `${this.wuid}-item-${i}`,
                cursor: 'pointer',
                mouseDown: () => {
                    this.pushedItem = i;
                    this.requestRepaint();
                },
                mouseOut: () => {
                    this.pushedItem = undefined;
                    this.requestRepaint();
                },
                mouseUp: () => {
                    this.pushedItem = undefined;
                    this.requestRepaint();
                },
                click: () => {
                    this.writeValue(this.items[i]);
                    this.requestRepaint();
                },
            });
        }
    }

    draw(g: Graphics) {
        if (this.horizontal) {
            this.drawHorizontal(g);
        } else {
            this.drawVertical(g);
        }
    }

    private drawHorizontal(g: Graphics) {
        const avgWidth = this.area.width / this.items.length;
        let startX = this.area.x;
        for (let i = 0; i < this.items.length; i++) {
            const buttonBounds: Bounds = {
                x: startX,
                y: this.area.y,
                width: avgWidth,
                height: this.area.height,
            };
            startX += avgWidth;
            this.drawButton(g, buttonBounds, i);
        }
    }

    private drawVertical(g: Graphics) {
        const avgHeight = this.area.height / this.items.length;
        let startY = this.area.y;
        for (let i = 0; i < this.items.length; i++) {
            const buttonBounds: Bounds = {
                x: Math.round(this.area.x),
                y: Math.round(startY),
                width: Math.round(this.area.width),
                height: Math.round(avgHeight),
            };
            startY += avgHeight;
            this.drawButton(g, buttonBounds, i);
        }
    }

    private drawButton(g: Graphics, area: Bounds, itemIndex: number) {
        const selected = this.pv?.value === this.items[itemIndex];
        const pushed = selected || itemIndex === this.pushedItem;
        g.fillRect({
            ...area,
            color: selected ? this.selectedColor : this.backgroundColor,
        });

        const hitRegion = g.addHitRegion(this.itemRegions[itemIndex]);
        hitRegion.addRect(area.x, area.y, area.width, area.height);

        const top = area.y + 0.5;
        const left = area.x + 0.5;
        const bottom = area.y + area.height - 1 + 0.5;
        const right = area.x + area.width - 1 + 0.5;

        g.strokePath({
            lineWidth: 1,
            color: pushed ? Color.BUTTON_LIGHTEST : Color.BLACK,
            path: new Path(right, bottom)
                .lineTo(right, top)
                .moveTo(right, bottom)
                .lineTo(left, bottom),
        });

        g.strokePath({
            lineWidth: 1,
            color: pushed ? this.backgroundColor : Color.BUTTON_DARKER,
            path: new Path(right - 1, bottom - 1)
                .lineTo(right - 1, top + 1)
                .moveTo(right - 1, bottom - 1)
                .lineTo(left + 1, bottom - 1),
        });

        g.strokePath({
            lineWidth: 1,
            color: pushed ? Color.BLACK : Color.BUTTON_LIGHTEST,
            path: new Path(left, top)
                .lineTo(right - 1, top)
                .moveTo(left, top)
                .lineTo(left, bottom - 1),
        });

        g.strokePath({
            lineWidth: 1,
            color: pushed ? Color.BUTTON_DARKER : this.backgroundColor,
            path: new Path(left + 1, top + 1)
                .lineTo(right - 1 - 1, top + 1)
                .moveTo(left + 1, top + 1)
                .lineTo(left + 1, bottom - 1 - 1),
        });

        g.fillText({
            x: area.x + (area.width / 2),
            y: area.y + (area.height / 2),
            text: this.items[itemIndex],
            align: 'center',
            baseline: 'middle',
            color: this.foregroundColor,
            font: this.font,
        });
    }

    private writeValue(item: string) {
        if (this.pv && this.pv.writable) {
            this.display.pvEngine.setValue(new Date(), this.pv.name, item);
        }
    }

    get enabled(): boolean { return this.properties.getValue(PROP_ENABLED); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get horizontal(): boolean { return this.properties.getValue(PROP_HORIZONTAL); }
    get items(): string[] { return this.properties.getValue(PROP_ITEMS); }
    get itemsFromPV(): boolean { return this.properties.getValue(PROP_ITEMS_FROM_PV); }
    get selectedColor(): Color { return this.properties.getValue(PROP_SELECTED_COLOR); }
}
