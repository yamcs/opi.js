import { Graphics } from '../../Graphics';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { Connection } from './Connection';

export class DisplayWidget extends AbstractContainerWidget {

    parseNode(node: XMLNode) {
        super.parseNode(node);

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getStringAttribute('typeId');
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
    }
}
