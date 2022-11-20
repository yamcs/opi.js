import { Display } from "./Display";
import { HitCanvas } from "./HitCanvas";
import { HitRegionSpecification } from "./HitRegionSpecification";
import { Point } from "./positioning";

/**
 * Swallows any click event wherever they may originate.
 * Usually there's 0 or 1 when the user ends the grab,
 * depending on where the mouse is released.
 */
const clickBlocker = (e: MouseEvent) => {
  // Remove ourself. This to prevent capturing unrelated events.
  document.removeEventListener(
    "click",
    clickBlocker,
    true /* Must be same as when created */
  );

  e.preventDefault();
  e.stopPropagation();
  return false;
};

function isLeftPressed(e: MouseEvent) {
  return (e.buttons & 1) === 1 || (e.buttons === undefined && e.which == 1);
}

/**
 * Minimum movement required before a viewport is in "grab" mode.
 * This allows to distinguish grab from regular clicks.
 */
const snap = 5;

function measureDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Compare by id instead of references. HitRegions are allowed to be generated
// on each draw, whereas the "id" could be something more long-term.
function regionMatches(
  region1?: HitRegionSpecification,
  region2?: HitRegionSpecification
) {
  return region1 && region2 && region1.id === region2.id;
}

export interface OpiMouseEvent {
  clientX: number;
  clientY: number;
  point: Point;
}

export interface OpiGrabEvent extends OpiMouseEvent {
  dx: number;
  dy: number;
}

export class EventHandler {
  private grabbing = false;
  private grabTarget?: HitRegionSpecification;
  private grabPoint?: { x: number; y: number }; // Relative to canvas

  // Global handlers attached only during a grab action.
  // Purpose is to support the user doing grab actions while leaving our canvas.
  private documentMouseMoveListener = (e: MouseEvent) =>
    this.onDocumentMouseMove(e);
  private documentMouseUpListener = (e: MouseEvent) =>
    this.onDocumentMouseUp(e);

  private prevEnteredRegion?: HitRegionSpecification;

  constructor(
    private display: Display,
    private canvas: HTMLCanvasElement,
    private hitCanvas: HitCanvas
  ) {
    canvas.addEventListener("click", (e) => this.onCanvasClick(e), false);
    canvas.addEventListener(
      "mousedown",
      (e) => this.onCanvasMouseDown(e),
      false
    );
    canvas.addEventListener("mouseup", (e) => this.onCanvasMouseUp(e), false);
    canvas.addEventListener("mouseout", (e) => this.onCanvasMouseOut(e), false);
    canvas.addEventListener(
      "mousemove",
      (e) => this.onCanvasMouseMove(e),
      false
    );
  }

  private toPoint(event: MouseEvent): Point {
    const bbox = this.canvas.getBoundingClientRect();
    return { x: event.clientX - bbox.left, y: event.clientY - bbox.top };
  }

  private onCanvasClick(event: MouseEvent) {
    this.display.clearSelection();

    const point = this.toPoint(event);
    if (this.display.editMode) {
      this.selectSingleWidget(point.x, point.y);
    } else {
      const region = this.hitCanvas.getActiveRegion(point.x, point.y);
      if (region && region.click) {
        region.click({
          clientX: event.clientX,
          clientY: event.clientY,
          point,
        });
      }
    }
  }

  private onCanvasMouseDown(event: MouseEvent) {
    if (this.display.editMode) {
      return;
    }
    document.removeEventListener(
      "click",
      clickBlocker,
      true /* Must be same as when created */
    );

    if (isLeftPressed(event)) {
      const point = this.toPoint(event);

      const region = this.hitCanvas.getActiveRegion(point.x, point.y);
      if (region && region.mouseDown) {
        region.mouseDown({
          clientX: event.clientX,
          clientY: event.clientY,
          point,
        });
      }

      if (region && region.grab) {
        this.grabPoint = { ...point };
        this.grabTarget = region;
        // Actual grab initialisation is subject to snap (see mousemove)
      }

      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }

  private onCanvasMouseUp(event: MouseEvent) {
    if (this.display.editMode) {
      return;
    }

    const point = this.toPoint(event);
    const region = this.hitCanvas.getActiveRegion(point.x, point.y);
    if (region && region.mouseUp) {
      region.mouseUp();
    }
  }

  private onCanvasMouseOut(event: MouseEvent) {
    if (this.prevEnteredRegion && this.prevEnteredRegion.mouseOut) {
      this.prevEnteredRegion.mouseOut();
    }
    this.prevEnteredRegion = undefined;

    event.preventDefault();
    event.stopPropagation();
  }

  private onCanvasMouseMove(domEvent: MouseEvent) {
    const point = this.toPoint(domEvent);
    const region = this.hitCanvas.getActiveRegion(point.x, point.y);

    if (this.prevEnteredRegion && this.prevEnteredRegion.mouseOut) {
      if (!regionMatches(this.prevEnteredRegion, region)) {
        this.prevEnteredRegion.mouseOut();
      }
    }

    if (region && region.mouseEnter) {
      if (!regionMatches(this.prevEnteredRegion, region)) {
        region.mouseEnter();
      }
    }

    this.prevEnteredRegion = region;

    const cursor = region && region.cursor ? region.cursor : "auto";
    if (cursor != this.canvas.style.cursor) {
      this.canvas.style.cursor = cursor;
    }

    if (!this.grabbing && region && region.tooltip) {
      this.display.setTooltip(region.tooltip());
    } else {
      this.display.setTooltip(undefined);
    }

    if (this.grabPoint && !this.grabbing && isLeftPressed(domEvent)) {
      const distance = measureDistance(
        this.grabPoint.x,
        this.grabPoint.y,
        point.x,
        point.y
      );
      if (Math.abs(distance) > snap) {
        this.initiateGrab();
        // Prevent stutter on first move
        if (snap > 0 && this.grabPoint) {
          this.grabPoint = point;
        }
      }
    }

    if (this.grabbing && this.grabTarget && isLeftPressed(domEvent)) {
      this.grabTarget.grab!({
        clientX: domEvent.clientX,
        clientY: domEvent.clientY,
        point,
        dx: point.x - this.grabPoint!.x,
        dy: point.y - this.grabPoint!.y,
      });
    }
  }

  private initiateGrab() {
    document.addEventListener("click", clickBlocker, true /* capture ! */);
    document.addEventListener("mouseup", this.documentMouseUpListener);
    document.addEventListener("mousemove", this.documentMouseMoveListener);
    this.grabbing = true;
  }

  private onDocumentMouseUp(event: MouseEvent) {
    if (this.grabbing) {
      document.removeEventListener("mouseup", this.documentMouseUpListener);
      document.removeEventListener("mousemove", this.documentMouseMoveListener);
      const grabTarget = this.grabTarget;
      this.grabbing = false;
      this.grabPoint = undefined;
      this.grabTarget = undefined;
      if (grabTarget?.grabEnd) {
        grabTarget.grabEnd();
      }
    }
  }

  private onDocumentMouseMove(event: MouseEvent) {
    this.onCanvasMouseMove(event);
  }

  private selectSingleWidget(x: number, y: number) {
    const instance = this.display.instance;
    if (instance) {
      for (const widget of instance.widgets.slice().reverse()) {
        const x1 = widget.holderX;
        const y1 = widget.holderY;
        const x2 = widget.holderX + widget.holderWidth;
        const y2 = widget.holderY + widget.holderHeight;
        if (x1 < x && x < x2 && y1 < y && y < y2) {
          this.display.selection = [widget.wuid];
          return false;
        }
      }
    }
  }
}
