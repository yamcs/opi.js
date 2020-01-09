import { Color } from '../../Color';
import { Connection } from '../../Connection';
import * as constants from '../../constants';
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

    readonly kind = constants.TYPE_DISPLAY;

    constructor(display: Display) {
        super(display, false);
        this.addProperty(new FloatProperty(PROP_WIDTH));
        this.addProperty(new FloatProperty(PROP_HEIGHT));
        this.addProperty(new ColorProperty(PROP_BACKGROUND_COLOR));
        this.addProperty(new ColorProperty(PROP_FOREGROUND_COLOR));
    }

    parseNode(node: XMLNode) {
        this.readPropertyValues(node);

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getStringAttribute('typeId');
            const widget = this.display.createWidget(kind);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
        for (const connectionNode of node.getNodes('connection')) {
            this.connections.push(new Connection(connectionNode, this.display));
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

    get backgroundColor(): Color { return this.getPropertyValue(PROP_BACKGROUND_COLOR); }
    get foregroundColor(): Color { return this.getPropertyValue(PROP_FOREGROUND_COLOR); }
    get preferredWidth(): number { return this.getPropertyValue(PROP_WIDTH); }
    get preferredHeight(): number { return this.getPropertyValue(PROP_HEIGHT); }
}
