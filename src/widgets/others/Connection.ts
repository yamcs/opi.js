import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics, Path } from '../../Graphics';
import { Point } from '../../positioning';
import { BooleanProperty, ColorProperty, IntProperty, PointsProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLNode';

const PROP_ARROW_LENGTH = 'arrow_length';
const PROP_ARROWS = 'arrows';
const PROP_FILL_ARROW = 'fill_arrow';
const PROP_NAME = 'name';
const PROP_LINE_COLOR = 'line_color';
const PROP_LINE_STYLE = 'line_style';
const PROP_LINE_WIDTH = 'line_width';
const PROP_SRC_WUID = 'src_wuid';
const PROP_SRC_TERM = 'src_term';
const PROP_TGT_WUID = 'tgt_wuid';
const PROP_TGT_TERM = 'tgt_term';
const PROP_ROUTER = 'router';
const PROP_POINTS = 'points';
const PROP_WUID = 'wuid';

const DIRECTION_LEFT = 'LEFT';
const DIRECTION_UP = 'UP';
const DIRECTION_DOWN = 'DOWN';
const DIRECTION_RIGHT = 'RIGHT';

const MINDIST = 20;
const TOL = 0.1;
const TOLxTOL = 0.01;

interface RoutePoint extends Point {
  x: number;
  y: number;
  direction: string;
}

export class Connection extends Widget {

  private sourceWidget?: Widget;
  private targetWidget?: Widget;

  constructor(display: Display) {
    super(display);
    this.properties.clear();
    this.properties.add(new IntProperty(PROP_ARROW_LENGTH));
    this.properties.add(new IntProperty(PROP_ARROWS));
    this.properties.add(new BooleanProperty(PROP_FILL_ARROW));
    this.properties.add(new StringProperty(PROP_NAME));
    this.properties.add(new ColorProperty(PROP_LINE_COLOR));
    this.properties.add(new IntProperty(PROP_LINE_STYLE));
    this.properties.add(new IntProperty(PROP_LINE_WIDTH));
    this.properties.add(new StringProperty(PROP_SRC_WUID));
    this.properties.add(new StringProperty(PROP_SRC_TERM));
    this.properties.add(new StringProperty(PROP_TGT_WUID));
    this.properties.add(new StringProperty(PROP_TGT_TERM));
    this.properties.add(new IntProperty(PROP_ROUTER));
    this.properties.add(new PointsProperty(PROP_POINTS));
    this.properties.add(new StringProperty(PROP_WUID));
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

  draw(g: Graphics) {
    if (!this.sourceWidget || !this.targetWidget) {
      return;
    }

    if (this.points.length) { // Only present if the user has manually repositioned a mid-point.
      this.drawPath(g);
    } else if (this.router === 0) {
      this.drawManhattanConnection(g);
    } else if (this.router === 1) {
      this.drawDirectConnection(g);
    }
  }

  private drawPath(g: Graphics) {
    const from = this.getPosition(this.sourceWidget!, this.sourceTerm);
    const to = this.getPosition(this.targetWidget!, this.targetTerm);

    const path = Path.fromPoints([from, ... this.points, to])
      .translate(0.5, 0.5);

    g.strokePath({
      path,
      lineWidth: this.lineWidth,
      color: this.lineColor,
      dash: this.getDashArray(),
    });
  }

  private drawManhattanConnection(g: Graphics) {
    const source = this.getManhattanAnchor(this.sourceWidget!, this.sourceTerm);
    const target = this.getManhattanAnchor(this.targetWidget!, this.targetTerm);

    const points = this.route(source, target);
    const path = Path.fromPoints(points);

    if (this.lineWidth) {
      g.strokePath({
        lineWidth: this.lineWidth,
        color: this.lineColor,
        path,
        dash: this.getDashArray(),
      });
    }
  }

  private getDashArray() {
    if (this.lineWidth) {
      if (this.lineStyle === 0) { // Solid
        return [];
      } else if (this.lineStyle === 1) { // Dash
        return [6, 2];
      } else if (this.lineStyle === 2) { // Dot
        return [2, 2];
      } else if (this.lineStyle === 3) { // Dash Dot
        return [6, 2, 2, 2];
      } else if (this.lineStyle === 4) { // Dash Dot Dot
        return [6, 2, 2, 2, 2, 2];
      } else {
        console.warn(`Unsupported connection line style ${this.lineStyle}`);
      }
    }
  }

  private drawDirectConnection(g: Graphics) {
    const from = this.getPosition(this.sourceWidget!, this.sourceTerm);
    const to = this.getPosition(this.targetWidget!, this.targetTerm);
    if (this.lineWidth) {
      g.strokePath({
        path: new Path(from.x, from.y).lineTo(to.x, to.y),
        lineWidth: this.lineWidth,
        color: this.lineColor,
        dash: this.getDashArray(),
      });
    }
  }

  // Gets the direction that a connector should have when connecting
  // to a particular anchor.
  private getManhattanAnchor(widget: Widget, term: string): RoutePoint {
    let direction;
    switch (term) {
      case 'TOP':
      case 'TOP_LEFT':
      case 'TOP_RIGHT':
        direction = DIRECTION_UP;
        break;
      case 'BOTTOM':
      case 'BOTTOM_LEFT':
      case 'BOTTOM_RIGHT':
        direction = DIRECTION_DOWN;
        break;
      case 'LEFT':
        direction = DIRECTION_LEFT;
        break;
      case 'RIGHT':
        direction = DIRECTION_RIGHT;
        break;
      default:
    }

    const bounds = widget.bounds;
    const position = this.getPosition(widget, term);

    const distanceLeft = position.x - bounds.x;
    const distanceRight = bounds.x + bounds.width - position.x;
    const distanceTop = position.y - bounds.y;
    const distanceBottom = bounds.y + bounds.height - position.y;
    if (Math.min(distanceLeft, distanceRight) < Math.min(distanceTop, distanceBottom)) {
      direction = distanceLeft < distanceRight ? DIRECTION_LEFT : DIRECTION_RIGHT;
    } else {
      direction = distanceTop < distanceBottom ? DIRECTION_UP : DIRECTION_DOWN;
    }

    return {
      x: position.x,
      y: position.y,
      direction,
    };
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
        const idx = parseInt(term, 10);
        const points = widget.properties.getProperty('points');
        if (points) {
          return (points.value as Point[])[idx];
        } else {
          throw Error(`Unexpected term ${term}`);
        }
    }
  }

  private route(from: RoutePoint, to: RoutePoint): Point[] {
    let xDiff = from.x - to.x;
    let yDiff = from.y - to.y;
    let point: Point = { x: 0, y: 0 };
    let dir;
    let pos;
    let path: Point[] = [];

    if (((xDiff * xDiff) < TOLxTOL) && ((yDiff * yDiff) < TOLxTOL)) {
      return [{ x: to.x, y: to.y }];
    }

    if (from.direction === DIRECTION_LEFT) {
      if ((xDiff > 0) && ((yDiff * yDiff) < TOL) && (to.direction === DIRECTION_RIGHT)) {
        point = to;
        dir = to.direction;
      }
      else {
        if (xDiff < 0) {
          point = { x: from.x - MINDIST, y: from.y };
        }
        else if (((yDiff > 0) && (to.direction === DIRECTION_DOWN)) || ((yDiff < 0) && (to.direction === DIRECTION_UP))) {
          point = { x: to.x, y: from.y };
        }
        else if (from.direction === to.direction) {
          pos = Math.min(from.x, to.x) - MINDIST;
          point = { x: pos, y: from.y };
        }
        else {
          point = { x: from.x - (xDiff / 2), y: from.y };
        }

        if (yDiff > 0) {
          dir = DIRECTION_UP;
        }
        else {
          dir = DIRECTION_DOWN;
        }
      }
    }
    else if (from.direction === DIRECTION_RIGHT) {
      if ((xDiff < 0) && ((yDiff * yDiff) < TOL) && (to.direction === DIRECTION_LEFT)) {
        point = to;
        dir = to.direction;
      }
      else {
        if (xDiff > 0) {
          point = { x: from.x + MINDIST, y: from.y };
        }
        else if (((yDiff > 0) && (to.direction === DIRECTION_DOWN)) || ((yDiff < 0) && (to.direction === DIRECTION_UP))) {
          point = { x: to.x, y: from.y };
        }
        else if (from.direction === to.direction) {
          pos = Math.max(from.x, to.x) + MINDIST;
          point = { x: pos, y: from.y };
        }
        else {
          point = { x: from.x - (xDiff / 2), y: from.y };
        }

        if (yDiff > 0) {
          dir = DIRECTION_UP;
        }
        else {
          dir = DIRECTION_DOWN;
        }
      }
    }
    else if (from.direction === DIRECTION_DOWN) {
      if (((xDiff * xDiff) < TOL) && (yDiff < 0) && (to.direction === DIRECTION_UP)) {
        point = to;
        dir = to.direction;
      }
      else {
        if (yDiff > 0) {
          point = { x: from.x, y: from.y + MINDIST };
        }
        else if (((xDiff > 0) && (to.direction === DIRECTION_RIGHT)) || ((xDiff < 0) && (to.direction === DIRECTION_LEFT))) {
          point = { x: from.x, y: to.y };
        }
        else if (from.direction === to.direction) {
          pos = Math.max(from.y, to.y) + MINDIST;
          point = { x: from.x, y: pos };
        }
        else {
          point = { x: from.x, y: from.y - (yDiff / 2) };
        }

        if (xDiff > 0) {
          dir = DIRECTION_LEFT;
        }
        else {
          dir = DIRECTION_RIGHT;
        }
      }
    }
    else if (from.direction === DIRECTION_UP) {
      if (((xDiff * xDiff) < TOL) && (yDiff > 0) && (to.direction === DIRECTION_DOWN)) {
        point = to;
        dir = to.direction;
      }
      else {
        if (yDiff < 0) {
          point = { x: from.x, y: from.y - MINDIST };
        }
        else if (((xDiff > 0) && (to.direction === DIRECTION_RIGHT)) || ((xDiff < 0) && (to.direction === DIRECTION_LEFT))) {
          point = { x: from.x, y: to.y };
        }
        else if (from.direction === to.direction) {
          pos = Math.min(from.y, to.y) - MINDIST;
          point = { x: from.x, y: pos };
        }
        else {
          point = { x: from.x, y: from.y - (yDiff / 2) };
        }

        if (xDiff > 0) {
          dir = DIRECTION_LEFT;
        }
        else {
          dir = DIRECTION_RIGHT;
        }
      }
    }

    const fromAnchor: RoutePoint = { ...point, direction: dir as any };
    path = path.concat(this.route(fromAnchor, to));
    path.push(from);
    return path;
  }

  get name(): string { return this.properties.getValue(PROP_NAME); }
  get arrows(): number { return this.properties.getValue(PROP_ARROWS); }
  get fillArrow(): boolean { return this.properties.getValue(PROP_FILL_ARROW); }
  get arrowLength(): number { return this.properties.getValue(PROP_ARROW_LENGTH); }
  get lineColor(): Color { return this.properties.getValue(PROP_LINE_COLOR); }
  get lineStyle(): number { return this.properties.getValue(PROP_LINE_STYLE); }
  get lineWidth(): number { return this.properties.getValue(PROP_LINE_WIDTH); }
  get router(): number { return this.properties.getValue(PROP_ROUTER); }
  get sourceTerm(): string { return this.properties.getValue(PROP_SRC_TERM); }
  get sourceWuid(): string { return this.properties.getValue(PROP_SRC_WUID); }
  get targetTerm(): string { return this.properties.getValue(PROP_TGT_TERM); }
  get targetWuid(): string { return this.properties.getValue(PROP_TGT_WUID); }
  get points(): Point[] { return this.properties.getValue(PROP_POINTS); }
}
