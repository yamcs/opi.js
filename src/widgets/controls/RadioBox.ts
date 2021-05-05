import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
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

const RADIO_RADIUS = 7;
const DOT_RADIUS = 2;
const GAP = 4;
const RADIO_BORDER_COLOR = new Color(120, 120, 120);
const HOVER_MIX_COLOR = new Color(94, 151, 230);

export class RadioBox extends Widget {

    private hoveredItem?: number;

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
                click: () => {
                    this.writeValue(this.items[i]);
                    this.requestRepaint();
                },
                mouseEnter: () => {
                    this.hoveredItem = i;
                    this.requestRepaint();
                },
                mouseOut: () => {
                    this.hoveredItem = undefined;
                    this.requestRepaint();
                }
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
            const radioBounds: Bounds = {
                x: startX,
                y: this.area.y,
                width: avgWidth,
                height: this.area.height,
            };
            startX += avgWidth;
            this.drawRadio(g, radioBounds, i);
        }
    }

    private drawVertical(g: Graphics) {
        const avgHeight = this.area.height / this.items.length;
        let startY = this.area.y;
        for (let i = 0; i < this.items.length; i++) {
            const radioBounds: Bounds = {
                x: this.area.x,
                y: startY,
                width: this.area.width,
                height: avgHeight,
            };
            startY += avgHeight;
            this.drawRadio(g, radioBounds, i);
        }
    }

    private drawRadio(g: Graphics, area: Bounds, itemIndex: number) {
        let backgroundColor = this.backgroundColor;
        if (itemIndex === this.hoveredItem) {
            backgroundColor = backgroundColor.mixWith(HOVER_MIX_COLOR, 0.7);
        }

        const gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, backgroundColor.toString());
        g.fillEllipse({
            cx: area.x + RADIO_RADIUS,
            cy: area.y + (area.height / 2),
            rx: RADIO_RADIUS,
            ry: RADIO_RADIUS,
            gradient,
        });
        g.strokeEllipse({
            cx: area.x + RADIO_RADIUS,
            cy: area.y + (area.height / 2),
            rx: RADIO_RADIUS,
            ry: RADIO_RADIUS,
            color: RADIO_BORDER_COLOR,
            lineWidth: 1,
        });

        if (this.pv?.value === this.items[itemIndex]) {
            g.fillEllipse({
                cx: area.x + RADIO_RADIUS,
                cy: area.y + (area.height / 2),
                rx: DOT_RADIUS + 0.5,
                ry: DOT_RADIUS + 0.5,
                color: this.selectedColor,
            });
        }

        const hitArea = g.addHitRegion(this.itemRegions[itemIndex]);
        hitArea.addRect(area.x, area.y, area.width, area.height);

        g.fillText({
            x: area.x + RADIO_RADIUS + RADIO_RADIUS + GAP,
            y: area.y + (area.height / 2),
            text: this.items[itemIndex],
            align: 'left',
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
