import { Graphics } from "../../Graphics";
import { XMLNode } from "../../XMLNode";
import { AbstractContainerWidget } from "./AbstractContainerWidget";

export class GroupingContainer extends AbstractContainerWidget {
  async parseNode(node: XMLNode) {
    await super.parseNode(node);

    for (const widgetNode of node.getNodes("widget")) {
      const kind = widgetNode.getString("widget_type");
      const widget = this.display.createWidget(kind, this);
      if (widget) {
        await widget.parseNode(widgetNode);
        this.widgets.push(widget);
      }
    }
  }

  // This widget covers the entire area with the background color regardless
  // of the border style. Unlike for example a Rectangle.
  // (difference easy to see with a Group Box border style).
  beforeDrawBorder(g: Graphics) {
    if (!this.transparent) {
      g.fillRect({
        x: this.holderX,
        y: this.holderY,
        width: this.holderWidth,
        height: this.holderHeight,
        color: this.backgroundColor,
      });
    }
  }

  draw(g: Graphics) {
    const offscreen = g.createChild(this.width, this.height);
    for (const widget of this.widgets.filter((w) => w.visible)) {
      widget.drawHolder(offscreen);
      widget.draw(offscreen);
      widget.drawDecoration(offscreen);
    }
    for (const widget of this.widgets.filter((w) => w.visible)) {
      widget.drawOverlay(offscreen);
    }

    g.copy(offscreen, this.x, this.y);
  }
}
