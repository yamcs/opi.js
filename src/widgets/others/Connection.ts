import { Color } from '../../Color';
import { Display } from '../../Display';
import { Point } from '../../positioning';
import { ColorProperty, IntProperty, PointsProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLNode';

export const PROP_NAME = 'name';
export const PROP_LINE_COLOR = 'line_color';
export const PROP_LINE_WIDTH = 'line_width';
export const PROP_SRC_WUID = 'src_wuid';
export const PROP_SRC_TERM = 'src_term';
export const PROP_TGT_WUID = 'tgt_wuid';
export const PROP_TGT_TERM = 'tgt_term';
export const PROP_ROUTER = 'router';
export const PROP_POINTS = 'points';

export class Connection extends Widget {

  private sourceWidget?: Widget;
  private targetWidget?: Widget;

  constructor(display: Display) {
    super(display);
    this.properties.clear();
    this.properties.add(new StringProperty('name'));
    this.properties.add(new ColorProperty('line_color'));
    this.properties.add(new IntProperty('line_width'));
    this.properties.add(new StringProperty('src_wuid'));
    this.properties.add(new StringProperty('src_term'));
    this.properties.add(new StringProperty('tgt_wuid'));
    this.properties.add(new StringProperty('tgt_term'));
    this.properties.add(new IntProperty('router'));
    this.properties.add(new PointsProperty('points'));
  }

  parseNode(node: XMLNode) {
    this.properties.loadXMLValues(node);

    this.sourceWidget = this.display.findWidget(this.sourceWuid);
    if (!this.sourceWidget) {
      console.warn(`Can't find source widget ${this.sourceWuid}`);
    }

    this.targetWidget = this.display.findWidget(this.targetWuid);
    if (!this.targetWidget) {
      console.warn(`Can't find target widget ${this.targetWuid}`);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.sourceWidget || !this.targetWidget) {
      return;
    }

    if (this.points.length) { // Only present if the user has manually repositioned a mid-point.
      this.drawPath(ctx);
    } else if (this.router === 0) {
      this.drawManhattanConnection(ctx);
    } else if (this.router === 1) {
      this.drawDirectConnection(ctx);
    }
  }

  private drawPath(ctx: CanvasRenderingContext2D) {
    const from = this.getPosition(this.sourceWidget!, this.sourceTerm);
    const to = this.getPosition(this.targetWidget!, this.targetTerm);

    ctx.beginPath();
    ctx.moveTo(from.x + 0.5, from.y + 0.5);
    for (const point of this.points) {
      ctx.lineTo(point.x + 0.5, point.y + 0.5);
    }
    ctx.lineTo(to.x + 0.5, to.y + 0.5);

    ctx.strokeStyle = this.lineColor.toString();
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }

  private drawManhattanConnection(ctx: CanvasRenderingContext2D) {
    // TODO
    this.drawDirectConnection(ctx);
  }

  private drawDirectConnection(ctx: CanvasRenderingContext2D) {
    const from = this.getPosition(this.sourceWidget!, this.sourceTerm);
    const x1 = from.x;
    const y1 = from.y;

    const to = this.getPosition(this.targetWidget!, this.targetTerm);
    const x2 = to.x;
    const y2 = to.y;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lineColor.toString();
    ctx.stroke();
  }

  private getPosition(widget: Widget, term: string): Point {
    switch (term) {
      case 'LEFT':
        return {
          x: widget.holderX,
          y: widget.holderY + (widget.holderHeight / 2),
        };
      case 'TOP':
        return {
          x: widget.holderX + (widget.holderWidth / 2),
          y: widget.holderY,
        };
      case 'RIGHT':
        return {
          x: widget.holderX + widget.holderWidth,
          y: widget.holderY + (widget.holderHeight / 2),
        };
      case 'BOTTOM':
        return {
          x: widget.holderX + (widget.holderWidth / 2),
          y: widget.holderY + widget.holderHeight,
        };
      case 'TOP_LEFT':
        return {
          x: widget.holderX,
          y: widget.holderY,
        };
      case 'TOP_RIGHT':
        return {
          x: widget.holderX + widget.holderWidth,
          y: widget.holderY,
        };
      case 'BOTTOM_LEFT':
        return {
          x: widget.holderX,
          y: widget.holderY + widget.holderHeight,
        };
      case 'BOTTOM_RIGHT':
        return {
          x: widget.holderX + widget.holderWidth,
          y: widget.holderY + widget.holderHeight,
        };
      default:
        throw Error(`Unexpected term ${term}`);
    }
  }

  get name(): string { return this.properties.getValue(PROP_NAME); }
  get lineColor(): Color { return this.properties.getValue(PROP_LINE_COLOR); }
  get lineWidth(): number { return this.properties.getValue(PROP_LINE_WIDTH); }
  get router(): number { return this.properties.getValue(PROP_ROUTER); }
  get sourceTerm(): string { return this.properties.getValue(PROP_SRC_TERM); }
  get sourceWuid(): string { return this.properties.getValue(PROP_SRC_WUID); }
  get targetTerm(): string { return this.properties.getValue(PROP_TGT_TERM); }
  get targetWuid(): string { return this.properties.getValue(PROP_TGT_WUID); }
  get points(): Point[] { return this.properties.getValue(PROP_POINTS); }
}
