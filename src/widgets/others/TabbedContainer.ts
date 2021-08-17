import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { BooleanProperty, IntProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';

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
    headerRegion: HitRegionSpecification;
    // iconPath: string;
}

export class TabbedContainer extends AbstractContainerWidget {

    private tabs: Tab[] = [];

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
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
                        if (this.activeTab !== i) {
                            this.properties.setValue(PROP_ACTIVE_TAB, i);
                            this.requestRepaint();
                        }
                    },
                    cursor: 'pointer'
                }
            });
        }

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getString('widget_type');
            const widget = this.display.createWidget(kind, this);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
    }

    draw(g: Graphics) {
        if (this.horizontalTabs) {
            this.drawHorizontalTabs(g);
        } else {
            this.drawVerticalTabs(g);
        }
    }

    private measureLabelHeight(g: Graphics) {
        const { scale } = this;
        const lineWidth = 1 * scale;
        let h = this.minimumTabHeight;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const font = tab.font.scale(scale);
            const fm = g.measureText(tab.title, font);
            const labelHeight = fm.height + lineWidth;
            if (labelHeight > h) {
                h = labelHeight;
            }
        }
        return h + this.margin;
    }

    private measureLabelWidth(g: Graphics) {
        const { scale } = this;
        const lineWidth = 1 * scale;
        let w = this.minimumTabWidth;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const font = tab.font.scale(scale);
            const fm = g.measureText(tab.title, font);
            const labelWidth = fm.width + lineWidth;
            if (labelWidth > w) {
                w = labelWidth;
            }
        }
        return w + this.margin;
    }

    private drawHorizontalTabs(g: Graphics) {
        const { margin, gap, scale } = this;
        const labelHeight = this.measureLabelHeight(g);
        const lineWidth = 1 * scale;
        let x = this.x;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const font = tab.font.scale(scale);
            const fm = g.measureText(tab.title, font);
            let rectX;
            let rectY;
            let rectWidth;
            let rectHeight;
            let rectFill;
            if (this.activeTab === i) {
                rectX = x;
                rectY = this.y;
                rectWidth = (fm.width + lineWidth) + margin + gap;
                rectHeight = labelHeight;
                rectFill = tab.backgroundColor;
            } else {
                rectX = x + gap;
                rectY = this.y + (2 * scale);
                rectWidth = (fm.width + lineWidth) + margin - gap;
                rectHeight = labelHeight - (2 * scale);
                rectFill = this.darken(tab.backgroundColor);
            }
            g.fillRect({
                x: rectX,
                y: rectY,
                width: rectWidth,
                height: rectHeight,
                color: rectFill,
            });

            const hitRegion = g.addHitRegion(tab.headerRegion);
            hitRegion.addRect(rectX, rectY, rectWidth, rectHeight);

            const gradient = g.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
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
                font: font,
                color: tab.foregroundColor,
                text: tab.title,
            });

            x += fm.width + lineWidth + margin - (1 * scale);

            if (this.activeTab === i) {
                const contentX = this.x;
                const contentY = this.y + labelHeight;
                const contentWidth = this.width;
                const contentHeight = this.height - labelHeight;
                g.fillRect({
                    x: contentX,
                    y: contentY,
                    width: contentWidth,
                    height: contentHeight,
                    color: tab.backgroundColor,
                });

                const activeWidget = this.widgets[i];

                const offscreen = g.createChild(contentWidth, contentHeight);
                activeWidget.drawHolder(offscreen);
                activeWidget.draw(offscreen);
                activeWidget.drawDecoration(offscreen);
                activeWidget.drawOverlay(offscreen);
                g.copy(offscreen, contentX, contentY);
            } else {
                const inactiveWidget = this.widgets[i];
                inactiveWidget.destroy();
            }
        }
    }

    private drawVerticalTabs(g: Graphics) {
        const { margin, gap, scale } = this;
        const tabWidth = this.measureLabelWidth(g);
        const lineWidth = 1 * scale;
        let y = this.y;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const font = tab.font.scale(scale);
            const fm = g.measureText(tab.title, font);
            const labelHeight = Math.max(fm.height + lineWidth + lineWidth, this.minimumTabHeight);
            let rectX;
            let rectY;
            let rectWidth;
            let rectHeight;
            let rectFill;
            if (this.activeTab === i) {
                rectX = this.x;
                rectY = y;
                rectWidth = tabWidth;
                rectHeight = labelHeight + margin + gap;
                rectFill = tab.backgroundColor;
            } else {
                rectX = this.x + (2 * scale);
                rectY = y + gap;
                rectWidth = tabWidth - (2 * scale);
                rectHeight = labelHeight + margin - gap;
                rectFill = this.darken(tab.backgroundColor);
            }
            g.fillRect({
                x: rectX,
                y: rectY,
                width: rectWidth,
                height: rectHeight,
                color: rectFill,
            });

            const hitRegion = g.addHitRegion(tab.headerRegion);
            hitRegion.addRect(rectX, rectY, rectWidth, rectHeight);

            const gradient = g.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY);
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
                font,
                color: tab.foregroundColor,
                text: tab.title,
            });

            y += labelHeight + margin - (1 * scale);

            if (this.activeTab === i) {
                const contentX = this.x + tabWidth - (1 * scale);
                const contentY = this.y;
                const contentWidth = this.width - tabWidth;
                const contentHeight = this.height - (1 * scale);
                g.fillRect({
                    x: contentX,
                    y: contentY,
                    width: contentWidth,
                    height: contentHeight,
                    color: tab.backgroundColor,
                });

                const activeWidget = this.widgets[i];

                const offscreen = g.createChild(contentWidth, contentHeight);
                activeWidget.drawHolder(offscreen);
                activeWidget.draw(offscreen);
                activeWidget.drawDecoration(offscreen);
                activeWidget.drawOverlay(offscreen);
                g.copy(offscreen, contentX, contentY);
            } else {
                const inactiveWidget = this.widgets[i];
                inactiveWidget.destroy();
            }
        }
    }

    private darken(color: Color) {
        const r = Math.max(0, color.red - 30);
        const g = Math.max(0, color.green - 30);
        const b = Math.max(0, color.blue - 30);
        return new Color(r, g, b);
    }

    get margin() {
        return this.scale * 10;
    }

    get gap() {
        return this.scale * 2;
    }

    get minimumTabWidth(): number {
        return this.scale * 20;
    }

    get minimumTabHeight(): number {
        return this.scale * this.properties.getValue(PROP_MINIMUM_TAB_HEIGHT);
    }
    get activeTab(): number { return this.properties.getValue(PROP_ACTIVE_TAB); }
    get tabCount(): number { return this.properties.getValue(PROP_TAB_COUNT); }
    get horizontalTabs(): boolean { return this.properties.getValue(PROP_HORIZONTAL_TABS); }
}
