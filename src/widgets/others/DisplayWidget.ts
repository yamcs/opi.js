import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { Bounds } from '../../positioning';
import { AutoScaleWidgetsProperty } from '../../properties';
import { AutoScaleWidgets } from '../../scale';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { Connection } from './Connection';

const PROP_AUTO_SCALE_WIDGETS = 'auto_scale_widgets';

export class DisplayWidget extends AbstractContainerWidget {

    constructor(display: Display, parent?: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new AutoScaleWidgetsProperty(PROP_AUTO_SCALE_WIDGETS));
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
        for (const connectionNode of node.getNodes('connection')) {
            const connection = new Connection(this.display);
            connection.parseNode(connectionNode);
            this.connections.push(connection);
        }
    }

    draw(g: Graphics) {
        for (const widget of this.widgets) {
            widget.drawHolder(g);
            widget.draw(g);
            widget.drawDecoration(g);
        }
        for (const connection of this.connections) {
            connection.draw(g);
        }
        for (const widget of this.widgets) {
            widget.drawOverlay(g);
        }
    }

    measureContentBounds(): Bounds {
        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;
        for (const widget of this.widgets) {
            x1 = Math.min(x1, widget.holderX);
            y1 = Math.min(y1, widget.holderY);
            x2 = Math.max(x2, widget.holderX + widget.holderWidth);
            y2 = Math.max(y2, widget.holderY + widget.holderHeight);
        }
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }

    get autoScaleWidgets(): AutoScaleWidgets {
        return this.properties.getValue(PROP_AUTO_SCALE_WIDGETS);
    }
}
