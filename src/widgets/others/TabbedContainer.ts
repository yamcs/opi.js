import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitRegionSpecification } from '../../HitRegionSpecification';
import { Point } from '../../positioning';
import { BooleanProperty, ColorProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';

const PROP_MINIMUM_TAB_HEIGHT = 'minimum_tab_height';
const PROP_ACTIVE_TAB = 'active_tab';
const PROP_HORIZONTAL_TABS = 'horizontal_tabs';
const PROP_TAB_COUNT = 'tab_count';

class Tab {
    headerRegion: HitRegionSpecification;

    constructor(private widget: TabbedContainer, private i: number) {
        this.headerRegion = {
            id: `${widget.wuid}-header-${i}`,
            click: () => {
                if (widget.activeTab !== i) {
                    widget.properties.setValue(PROP_ACTIVE_TAB, i);
                    widget.requestRepaint();
                }
            },
            cursor: 'pointer'
        };
    }

    get scale() { return this.widget.scale; }
    private getValue(propertySufix: string) {
        return this.widget.properties.getValue(`tab_${this.i}_${propertySufix}`);
    }

    get title(): string { return this.getValue('title'); }
    get backgroundColor(): Color { return this.getValue('background_color'); }
    get foregroundColor(): Color { return this.getValue('foreground_color'); }
    get enabled(): boolean { return this.getValue('enabled'); }
    get font(): Font { return this.getValue('font').scale(this.scale); }
}

export class TabbedContainer extends AbstractContainerWidget {

    private tabs: Tab[] = [];

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_MINIMUM_TAB_HEIGHT));
        this.properties.add(new IntProperty(PROP_ACTIVE_TAB));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL_TABS));
        this.properties.add(new IntProperty(PROP_TAB_COUNT));

        this.properties.addGenerator(() => {
            this.tabs = [];
            const tabCount = this.properties.getValue(PROP_TAB_COUNT) as number;
            const moreProperties = [];
            for (let i = 0; i < tabCount; i++) {
                this.tabs.push(new Tab(this, i));
                moreProperties.push(...[
                    new StringProperty(`tab_${i}_title`),
                    new ColorProperty(`tab_${i}_background_color`),
                    new ColorProperty(`tab_${i}_foreground_color`),
                    new BooleanProperty(`tab_${i}_enabled`),
                    new FontProperty(`tab_${i}_font`),
                ]);
            }
            return moreProperties;
        });
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);

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

    measureTabOffset(g: Graphics): Point {
        if (this.horizontalTabs) {
            return { x: 0, y: this.measureLabelHeight(g) };
        } else {
            return { x: this.measureLabelWidth(g), y: 0 };
        }
    }

    private measureLabelHeight(g: Graphics) {
        const { scale } = this;
        const lineWidth = 1 * scale;
        let h = this.minimumTabHeight;
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const fm = g.measureText(tab.title, tab.font);
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
            const fm = g.measureText(tab.title, tab.font);
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
            const fm = g.measureText(tab.title, tab.font);
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
                font: tab.font,
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
                inactiveWidget.hide();
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
            const fm = g.measureText(tab.title, tab.font);
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
                font: tab.font,
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

    get margin() { return this.scale * 10; }
    get gap() { return this.scale * 2; }
    get minimumTabWidth() { return this.scale * 20; }

    get minimumTabHeight(): number {
        return this.scale * this.properties.getValue(PROP_MINIMUM_TAB_HEIGHT);
    }
    get activeTab(): number { return this.properties.getValue(PROP_ACTIVE_TAB); }
    get tabCount(): number { return this.properties.getValue(PROP_TAB_COUNT); }
    get horizontalTabs(): boolean { return this.properties.getValue(PROP_HORIZONTAL_TABS); }
}
