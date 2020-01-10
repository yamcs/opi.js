import { Color } from '../../Color';
import { Connection } from '../../Connection';
import { Display } from '../../Display';
import { HitCanvas } from '../../HitCanvas';
import { ColorProperty, FloatProperty } from '../../properties';
import { XMLNode } from '../../XMLParser';
import { AbstractContainerWidget } from './AbstractContainerWidget';

const PROP_BACKGROUND_COLOR = 'background_color';
const PROP_FOREGROUND_COLOR = 'foreground_color';
const PROP_HEIGHT = 'height';
const PROP_WIDTH = 'width';

export class DisplayWidget extends AbstractContainerWidget {

    constructor(display: Display) {
        super(display);
        this.properties.clear();
        this.properties.add(new FloatProperty(PROP_WIDTH));
        this.properties.add(new FloatProperty(PROP_HEIGHT));
        this.properties.add(new ColorProperty(PROP_BACKGROUND_COLOR));
        this.properties.add(new ColorProperty(PROP_FOREGROUND_COLOR));
    }

    parseNode(node: XMLNode) {
        this.properties.loadXMLValues(node);

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getStringAttribute('typeId');
            const widget = this.display.createWidget(kind);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
        for (const connectionNode of node.getNodes('connection')) {
            const connection = new Connection(this.display);
            connection.parseNode(connectionNode);
            this.connections.push(connection);
        }
    }

    draw(ctx: CanvasRenderingContext2D, hitCanvas: HitCanvas) {
        for (const widget of this.widgets) {
            widget.drawHolder(ctx, hitCanvas);
            widget.draw(ctx, hitCanvas);
        }
        for (const connection of this.connections) {
            connection.draw(ctx);
        }
    }

    get backgroundColor(): Color { return this.properties.getValue(PROP_BACKGROUND_COLOR); }
    get foregroundColor(): Color { return this.properties.getValue(PROP_FOREGROUND_COLOR); }
    get preferredWidth(): number { return this.properties.getValue(PROP_WIDTH); }
    get preferredHeight(): number { return this.properties.getValue(PROP_HEIGHT); }
}
