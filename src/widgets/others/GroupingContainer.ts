import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';

export class GroupingContainer extends AbstractContainerWidget {

    parseNode(node: XMLNode) {
        super.parseNode(node);

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getStringAttribute('typeId');
            const widget = this.display.createWidget(kind);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        if (!this.transparent) {
            g.ctx.fillStyle = this.backgroundColor.toString();
            g.ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        const tmpHitCanvas = hitCanvas.createChild(this.width, this.height);
        const tmpCanvas = this.drawOffscreen(tmpHitCanvas);
        g.ctx.drawImage(tmpCanvas, this.x, this.y);
        tmpHitCanvas.transferToParent(this.x, this.y, this.width, this.height);
    }

    private drawOffscreen(hitCanvas: HitCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const g = new Graphics(canvas);
        for (const widget of this.widgets) {
            widget.drawHolder(g, hitCanvas);
            widget.draw(g, hitCanvas);
            widget.drawDecoration(g);
        }

        return canvas;
    }
}
