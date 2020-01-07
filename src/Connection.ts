import { Color } from './Color';
import { Display } from './Display';
import { Point } from './Point';
import * as utils from './utils';
import { Widget } from './Widget';

export class Connection {

  private name: string;
  private lineColor: Color;
  private lineWidth: number;
  private router: number;

  private sourceWidget: Widget;
  private sourceTerm: string;

  private targetWidget: Widget;
  private targetTerm: string;

  private points: Point[] = [];

  constructor(protected node: Element, protected display: Display) {
    this.name = utils.parseStringChild(node, 'name');

    const lineColorNode = utils.findChild(node, 'line_color');
    this.lineColor = utils.parseColorChild(lineColorNode);
    this.lineWidth = utils.parseIntChild(node, 'line_width');

    const srcWuid = utils.parseStringChild(node, 'src_wuid');
    this.sourceWidget = display.findWidget(srcWuid)!;
    this.sourceTerm = utils.parseStringChild(node, 'src_term');

    const tgtWuid = utils.parseStringChild(node, 'tgt_wuid');
    this.targetWidget = display.findWidget(tgtWuid)!;
    this.targetTerm = utils.parseStringChild(node, 'tgt_term');

    this.router = utils.parseIntChild(node, 'router');

    const pointsNode = utils.findChild(node, 'points');
    for (const pointNode of utils.findChildren(pointsNode, 'point')) {
      this.points.push({
        x: utils.parseIntAttribute(pointNode, 'x'),
        y: utils.parseIntAttribute(pointNode, 'y'),
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length) { // Only present if the user has manually repositioned a mid-point.
      this.drawPath(ctx);
    } else if (this.router === 0) {
      this.drawManhattanConnection(ctx);
    } else if (this.router === 1) {
      this.drawDirectConnection(ctx);
    }
  }

  drawPath(ctx: CanvasRenderingContext2D) {
    const from = this.getPosition(this.sourceWidget, this.sourceTerm);
    const to = this.getPosition(this.targetWidget, this.targetTerm);

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

  drawManhattanConnection(ctx: CanvasRenderingContext2D) {
    // TODO
    this.drawDirectConnection(ctx);
  }

  drawDirectConnection(ctx: CanvasRenderingContext2D) {
    const from = this.getPosition(this.sourceWidget, this.sourceTerm);
    const x1 = from.x;
    const y1 = from.y;

    const to = this.getPosition(this.targetWidget, this.targetTerm);
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
}