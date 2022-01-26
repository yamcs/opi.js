import { Graphics } from '../../Graphics';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';

export class GroupingContainer extends AbstractContainerWidget {

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
        if (!this.transparent) {
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }

        const offscreen = g.createChild(this.width, this.height);
        for (const widget of this.widgets.filter(w => w.visible)) {
            widget.drawHolder(offscreen);
            widget.draw(offscreen);
            widget.drawDecoration(offscreen);
        }
        for (const widget of this.widgets.filter(w => w.visible)) {
            widget.drawOverlay(offscreen);
        }

        g.copy(offscreen, this.x, this.y);
    }
}
