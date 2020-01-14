import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { HitRegion } from '../../HitRegion';
import { BooleanProperty, IntProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';

const MARGIN = 10;
const GAP = 2;

const PROP_MINIMUM_TAB_HEIGHT = 'minimum_tab_height';
const PROP_ACTIVE_TAB = 'active_tab';
const PROP_HORIZONTAL_TABS = 'horizontal_tabs';
const PROP_TAB_COUNT = 'tab_count';

interface Tab {
    title: string;
    backgroundColor: Color;
    foregroundColor: Color;
    enabled: boolean;
    font: Font;
    headerRegion: HitRegion;
    // iconPath: string;
}


export class TabbedContainer extends AbstractContainerWidget {

    private tabs: Tab[] = [];

    constructor(display: Display) {
        super(display);
        this.properties.add(new IntProperty('minimum_tab_height'));
        this.properties.add(new IntProperty('active_tab'));
        this.properties.add(new BooleanProperty('horizontal_tabs'));
        this.properties.add(new IntProperty('tab_count'));
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);
        for (let i = 0; i < this.tabCount; i++) {
            this.tabs.push({
                title: node.getString(`tab_${i}_title`),
                backgroundColor: node.getColor(`tab_${i}_background_color`),
                foregroundColor: node.getColor(`tab_${i}_foreground_color`),
                enabled: node.getBoolean(`tab_${i}_enabled`),
                font: node.getFont(`tab_${i}_font`),
                headerRegion: {
                    id: `${this.wuid}-header-${i}`,
                    click: () => {
                        this.properties.setValue(PROP_ACTIVE_TAB, i);
                        this.requestRepaint();
                    },
                    cursor: 'pointer'
                }
            });
        }
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        if (this.horizontalTabs) {
            this.drawHorizontalTabs(g, hitCanvas);
        } else {
            this.drawVerticalTabs(g, hitCanvas);
        }
    }

    private drawHorizontalTabs(g: Graphics, hitCanvas: HitCanvas) {
    }

    private drawVerticalTabs(g: Graphics, hitCanvas: HitCanvas) {
        let tabWidth = 0;
        for (const tab of this.tabs) {
            const fm = g.measureText(tab.title, tab.font);
            if (fm.width > tabWidth) {
                tabWidth = fm.width;
            }
        }

        let y = this.y;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            let rectX;
            let rectY;
            let rectWidth;
            let rectHeight;
            let rectFill;
            if (this.activeTab === i) {
                rectX = this.x;
                rectY = y;
                rectWidth = tabWidth;
                rectHeight = this.minimumTabHeight + MARGIN + GAP;
                rectFill = tab.backgroundColor;
            } else {
                rectX = this.x + 2;
                rectY = y + GAP;
                rectWidth = tabWidth - 2;
                rectHeight = this.minimumTabHeight + MARGIN - GAP;
                rectFill = this.darken(tab.backgroundColor);
            }
            g.fillRect({
                x: rectX,
                y: rectY,
                width: rectWidth,
                height: rectHeight,
                color: rectFill,
            });

            hitCanvas.beginHitRegion(tab.headerRegion);
            hitCanvas.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

            const gradient = g.ctx.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY);
            gradient.addColorStop(0, Color.WHITE.toString());
            gradient.addColorStop(1, Color.WHITE.withAlpha(0).toString());
            g.fillRect({
                x: rectX,
                y: rectY,
                width: rectWidth,
                height: rectHeight,
                gradient,
            });

            g.fillText({
                x: rectX + (rectWidth / 2),
                y: rectY + (rectHeight / 2),
                baseline: 'middle',
                align: 'center',
                font: tab.font,
                color: tab.foregroundColor,
                text: tab.title,
            });

            y += this.minimumTabHeight + MARGIN - 1;

            if (this.activeTab === i) {
                g.fillRect({
                    x: this.x + tabWidth - 1,
                    y: this.y,
                    width: this.width - tabWidth,
                    height: this.height - 1,
                    color: tab.backgroundColor,
                });
            }
        }
    }

    private darken(color: Color) {
        const r = Math.max(0, color.red - 30);
        const g = Math.max(0, color.green - 30);
        const b = Math.max(0, color.blue - 30);
        return new Color(r, g, b);
    }

    get minimumTabHeight(): number { return this.properties.getValue(PROP_MINIMUM_TAB_HEIGHT); }
    get activeTab(): number { return this.properties.getValue(PROP_ACTIVE_TAB); }
    get tabCount(): number { return this.properties.getValue(PROP_TAB_COUNT); }
    get horizontalTabs(): boolean { return this.properties.getValue(PROP_HORIZONTAL_TABS); }
}
