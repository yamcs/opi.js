import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { Bounds, Point, shrink } from '../../positioning';
import { BooleanProperty, FontProperty, StringListProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ENABLED = 'enabled';
const PROP_FONT = 'font';
const PROP_ITEMS = 'items';
const PROP_ITEMS_FROM_PV = 'items_from_pv';

const SELECTOR_WIDTH = 8;

const BORDER_COLOR = new Color(240, 240, 240);

export class Combo extends Widget {

    private listVisible = false;
    private hoveredItem?: number;

    private areaRegion?: HitRegionSpecification;
    private itemRegions: HitRegionSpecification[] = [];

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new BooleanProperty(PROP_ENABLED));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new StringListProperty(PROP_ITEMS, []));
        this.properties.add(new BooleanProperty(PROP_ITEMS_FROM_PV));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            click: () => {
                const wasVisible = this.listVisible;
                this.display.closeMenu();
                if (this.items.length && !wasVisible) {
                    this.listVisible = true;
                    this.hoveredItem = 0;
                    this.requestRepaint();
                }
            }
        };
        for (let i = 0; i < this.items.length; i++) {
            this.itemRegions.push({
                id: `${this.wuid}-item-${i}`,
                click: () => {
                    this.writeValue(this.items[i]);
                    this.listVisible = false;
                    this.hoveredItem = undefined;
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
        let bounds = shrink(this.bounds, 2 * this.scale);
        g.fillRect({
            ...bounds,
            color: this.backgroundColor,
        });
        g.strokeRect({
            ...bounds,
            color: BORDER_COLOR,
            crispen: true,
        });

        const area = g.addHitRegion(this.areaRegion!);
        area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

        if (this.pv?.value && this.items.indexOf(this.pv.value) !== -1) {
            g.fillText({
                x: (5 * this.scale) + bounds.x,
                y: bounds.y + (bounds.height / 2),
                align: 'left',
                baseline: 'middle',
                color: this.foregroundColor,
                font: this.font,
                text: this.pv?.value,
            });
        }

        const { selectorWidth } = this;
        const size = Math.min(bounds.height, selectorWidth / 2);
        const head: Point = {
            x: bounds.x + bounds.width - selectorWidth - (5 * this.scale) + (selectorWidth / 2),
            y: bounds.y + ((bounds.height - size) / 2) + size,
        };
        g.fillPath({
            color: this.foregroundColor,
            path: new Path(head.x, head.y)
                .lineTo(head.x - size, head.y - size)
                .lineTo(head.x + size, head.y - size)
                .closePath(),
        });
    }

    closeMenu() {
        this.listVisible = false;
        this.requestRepaint();
    }

    drawOverlay(g: Graphics) {
        if (!this.listVisible || !this.items.length) {
            return;
        }

        let textWidth = 0;
        let textHeight = 0;
        for (const item of this.items) {
            const fm = g.measureText(item, this.font);
            textWidth = Math.max(textWidth, fm.width);
            textHeight = Math.max(textHeight, fm.height);
        }

        const { scale } = this;
        const padding = 5 * scale;
        const itemHeight = padding + textHeight + padding;
        const box: Bounds = {
            x: this.bounds.x + (5 * scale),
            y: this.bounds.y + this.bounds.height - (5 * scale),
            width: padding + textWidth + padding,
            height: itemHeight * this.items.length + (2 * scale) + (2 * scale),
        };
        g.fillRect({
            ...box,
            color: this.backgroundColor,
        });
        for (let i = 0; i < this.items.length; i++) {
            const itemBounds = {
                x: box.x,
                y: box.y + (2 * scale) + (i * itemHeight),
                width: box.width,
                height: itemHeight,
            };

            const itemArea = g.addHitRegion(this.itemRegions[i]);
            itemArea.addRect(itemBounds.x, itemBounds.y, itemBounds.width, itemBounds.height);

            if (i === this.hoveredItem) {
                g.fillRect({
                    ...itemBounds,
                    color: Color.LIGHT_BLUE,
                });
            }
        }

        g.strokeRect({
            ...box,
            color: BORDER_COLOR,
            lineWidth: 1 * scale,
            crispen: true,
        });

        for (let i = 0; i < this.items.length; i++) {
            g.fillText({
                x: box.x + padding,
                y: box.y + (2 * scale) + (i * itemHeight) + (itemHeight / 2),
                font: this.font,
                color: this.foregroundColor,
                align: 'left',
                baseline: 'middle',
                text: this.items[i],
            });
        }
    }

    private writeValue(item: string) {
        if (this.pv && this.pv.writable) {
            this.display.pvEngine.setValue(new Date(), this.pv.name, item);
        }
    }

    get selectorWidth() {
        return this.scale * SELECTOR_WIDTH;
    }

    get enabled(): boolean { return this.properties.getValue(PROP_ENABLED); }
    get font(): Font {
        return this.properties.getValue(PROP_FONT).scale(this.scale);
    }
    get items(): string[] { return this.properties.getValue(PROP_ITEMS); }
    get itemsFromPV(): boolean { return this.properties.getValue(PROP_ITEMS_FROM_PV); }
}
