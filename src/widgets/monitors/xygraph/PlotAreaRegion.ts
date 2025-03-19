import { OpiGrabEvent, OpiMouseEvent } from "../../../EventHandler";
import { HitRegionSpecification } from "../../../HitRegionSpecification";
import { Bounds } from "../../../positioning";
import { ZoomCommand } from "./CommandBuffer";
import { XYGraph } from "./XYGraph";

export class PlotAreaRegion implements HitRegionSpecification {
  id: string;
  cursor?: string;
  selection?: Bounds;

  private grabStart?: OpiMouseEvent;
  private prevGrabEvent?: OpiGrabEvent;
  private grabZoomCommand?: ZoomCommand;

  constructor(
    id: string,
    private widget: XYGraph,
  ) {
    this.id = id;
  }

  tooltip() {
    return this.widget.tooltip;
  }

  mouseDown(evt: OpiMouseEvent) {
    const { widget } = this;
    switch (widget.toolbar?.currentTool) {
      case "rubberband-zoom":
      case "horizontal-zoom":
      case "vertical-zoom":
        this.grabStart = evt;
        break;
      case "panning":
        this.grabZoomCommand = new ZoomCommand(
          widget.getXAxes(),
          widget.getYAxes(),
        );
        break;
    }
  }

  grab(evt: OpiGrabEvent) {
    switch (this.widget.toolbar?.currentTool) {
      case "rubberband-zoom":
      case "horizontal-zoom":
      case "vertical-zoom":
        if (this.grabStart) {
          this.selection = {
            ...this.grabStart.point,
            width: evt.dx,
            height: evt.dy,
          };
          this.widget.requestRepaint();
        }
        break;
      case "panning":
        this.pan(evt);
        this.prevGrabEvent = evt;
        this.widget.requestRepaint();
        break;
    }
  }

  grabEnd() {
    const { grabZoomCommand, selection, widget } = this;
    switch (widget.toolbar?.currentTool) {
      case "rubberband-zoom":
        if (selection) {
          const rubberbandZoomCommand = new ZoomCommand(
            widget.getXAxes(),
            widget.getYAxes(),
          );
          this.rangeZoomXAxes(selection);
          this.rangeZoomYAxes(selection);
          rubberbandZoomCommand.saveState();
          widget.toolbar.addCommand(rubberbandZoomCommand);
        }
        break;
      case "horizontal-zoom":
        if (selection) {
          const horizontalZoomCommand = new ZoomCommand(
            widget.getXAxes(),
            widget.getYAxes(),
          );
          this.rangeZoomXAxes(selection);
          horizontalZoomCommand.saveState();
          widget.toolbar.addCommand(horizontalZoomCommand);
        }
        break;
      case "vertical-zoom":
        if (selection) {
          const verticalZoomCommand = new ZoomCommand(
            widget.getXAxes(),
            widget.getYAxes(),
          );
          this.rangeZoomYAxes(selection);
          verticalZoomCommand.saveState();
          widget.toolbar.addCommand(verticalZoomCommand);
        }
        break;
      case "panning":
        if (grabZoomCommand) {
          grabZoomCommand.saveState();
          widget.toolbar.addCommand(grabZoomCommand);
        }
        break;
    }
    this.selection = undefined;
    this.prevGrabEvent = undefined;
    this.grabZoomCommand = undefined;
    this.widget.requestRepaint();
  }

  click(evt: OpiMouseEvent) {
    const { widget } = this;
    switch (widget.toolbar?.currentTool) {
      case "zoom-in":
        const zoomInCommand = new ZoomCommand(
          widget.getXAxes(),
          widget.getYAxes(),
        );
        for (const axis of widget.getAxes()) {
          const pos = axis.isHorizontal() ? evt.point.x : evt.point.y;
          const center = axis.linearScale!.getPositionValue(pos);
          axis.applyZoom(center, 0.1);
        }
        zoomInCommand.saveState();
        widget.toolbar.addCommand(zoomInCommand);
        break;
      case "zoom-out":
        const zoomOutCommand = new ZoomCommand(
          widget.getXAxes(),
          widget.getYAxes(),
        );
        for (const axis of widget.getAxes()) {
          const pos = axis.isHorizontal() ? evt.point.x : evt.point.y;
          const center = axis.linearScale!.getPositionValue(pos);
          axis.applyZoom(center, -0.1);
        }
        zoomOutCommand.saveState();
        widget.toolbar.addCommand(zoomOutCommand);
        break;
    }
  }

  private rangeZoomXAxes(selection: Bounds) {
    for (const axis of this.widget.getXAxes()) {
      let v1 = axis.linearScale!.getPositionValue(selection.x);
      let v2 = axis.linearScale!.getPositionValue(
        selection.x + selection.width,
      );
      if (v1 > v2) {
        const swap = v1;
        v1 = v2;
        v2 = swap;
      }
      const range = axis.linearScale!.getMinMax();
      v1 = Math.max(range.start, v1);
      v2 = Math.min(range.stop, v2);

      axis.effectiveMinimum = v1;
      axis.effectiveMaximum = v2;
    }
  }

  private rangeZoomYAxes(selection: Bounds) {
    for (const axis of this.widget.getYAxes()) {
      let v1 = axis.linearScale!.getPositionValue(selection.y);
      let v2 = axis.linearScale!.getPositionValue(
        selection.y + selection.height,
      );
      if (v1 > v2) {
        const swap = v1;
        v1 = v2;
        v2 = swap;
      }
      const range = axis.linearScale!.getMinMax();
      v1 = Math.max(range.start, v1);
      v2 = Math.min(range.stop, v2);

      axis.effectiveMinimum = v1;
      axis.effectiveMaximum = v2;
    }
  }

  private pan(evt: OpiGrabEvent) {
    const { prevGrabEvent, widget } = this;
    if (prevGrabEvent) {
      const relx = prevGrabEvent.dx - evt.dx;
      if (relx !== 0) {
        for (const axis of widget.getXAxes()) {
          const linearScale = axis.linearScale!;
          const range = linearScale.getMinMax();
          const startPos = linearScale.getValuePosition(range.start) + relx;
          const stopPos = linearScale.getValuePosition(range.stop) + relx;
          axis.effectiveMinimum = linearScale.getPositionValue(startPos);
          axis.effectiveMaximum = linearScale.getPositionValue(stopPos);
        }
      }
      const rely = prevGrabEvent.dy - evt.dy;
      if (rely !== 0) {
        for (const axis of widget.getYAxes()) {
          const linearScale = axis.linearScale!;
          const range = linearScale.getMinMax();
          const startPos = linearScale.getValuePosition(range.start) + rely;
          const stopPos = linearScale.getValuePosition(range.stop) + rely;
          axis.effectiveMinimum = linearScale.getPositionValue(startPos);
          axis.effectiveMaximum = linearScale.getPositionValue(stopPos);
        }
      }
    }
  }
}
