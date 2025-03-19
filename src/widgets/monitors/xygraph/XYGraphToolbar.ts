import { Color } from "../../../Color";
import { Graphics, Path } from "../../../Graphics";
import { HitRegionSpecification } from "../../../HitRegionSpecification";
import { Bounds, Point } from "../../../positioning";
import { Command, CommandBuffer, ZoomCommand } from "./CommandBuffer";
import { XYGraph } from "./XYGraph";

const BUTTON_COLOR = new Color(236, 236, 236);
const SEPARATOR_COLOR = new Color(130, 130, 130);

class Button {
  readonly imageElement = new Image();
  readonly disabledImageElement = new Image();
  readonly loadPromise: Promise<void>;
  readonly disabledLoadPromise: Promise<void>;
  toggleButton = false;
  toolButton = false;
  pushed = false;
  disabled = false;
  region: HitRegionSpecification;

  constructor(
    toolbar: XYGraphToolbar,
    private imageFile: string,
    private disabledImageFile: string,
    tooltip: string,
    private action: () => void,
  ) {
    this.loadPromise = new Promise<void>((resolve, reject) => {
      this.imageElement.onload = () => resolve();
    });
    this.disabledLoadPromise = new Promise<void>((resolve, reject) => {
      this.disabledImageElement.onload = () => resolve();
    });
    this.region = {
      id: `${toolbar.xyGraph.wuid}-${imageFile}`,
      mouseDown: () => {
        if (!this.toggleButton) {
          this.pushed = true;
          toolbar.xyGraph.requestRepaint();
        }
      },
      mouseOut: () => {
        if (!this.toggleButton) {
          this.pushed = false;
        }
        toolbar.xyGraph.requestRepaint();
      },
      mouseUp: () => {
        if (!this.toggleButton) {
          this.pushed = false;
          toolbar.xyGraph.requestRepaint();
        }
      },
      click: () => {
        if (this.toggleButton) {
          this.pushed = !this.pushed;
          if (this.toolButton) {
            toolbar.toggleTool(this);
          }
        }
        this.action();
        toolbar.updateState();
      },
      tooltip: () => tooltip,
    };
  }

  loadImage(prefix: string) {
    this.imageElement.src = prefix + this.imageFile;
    this.disabledImageElement.src = prefix + this.disabledImageFile;
  }
}

export class XYGraphToolbar {
  private buttons: Button[] = [];

  private showLegend: Button;
  private autoScale: Button;
  private rubberbandZoom: Button;
  private horizontalZoom: Button;
  private verticalZoom: Button;
  private zoomIn: Button;
  private zoomOut: Button;
  private panning: Button;
  private mouseArrow: Button;
  private undo: Button;
  private redo: Button;
  private camera: Button;

  private imagesLoaded = false;
  currentTool:
    | "rubberband-zoom"
    | "horizontal-zoom"
    | "vertical-zoom"
    | "zoom-in"
    | "zoom-out"
    | "panning"
    | "default" = "default";
  private commandBuffer = new CommandBuffer();

  constructor(readonly xyGraph: XYGraph) {
    this.showLegend = this.createToggleButton(
      "ShowLegend.png",
      "Show Legend",
      () => {
        xyGraph.properties.setValue("show_legend", this.showLegend.pushed);
      },
    );

    // Initial state
    this.showLegend.pushed = xyGraph.showLegend;

    // Note: the property may also be updated without the use of the toolbar.
    xyGraph.addPropertyListener("show_legend", (newValue) => {
      this.showLegend.pushed = newValue;
    });

    this.autoScale = this.createButton(
      "AutoScale.png",
      "AutoScale.png",
      "Perform Auto Scale",
      () => {
        const autoScaleCommand = new ZoomCommand(
          xyGraph.getXAxes(),
          xyGraph.getYAxes(),
        );
        xyGraph.performAutoScale();
        autoScaleCommand.saveState();
        this.addCommand(autoScaleCommand);
      },
    );
    this.rubberbandZoom = this.createToolButton(
      "RubberbandZoom.png",
      "Rubberband Zoom",
      () => {
        if (this.rubberbandZoom.pushed) {
          this.currentTool = "rubberband-zoom";
          xyGraph.setCursor("crosshair");
          xyGraph.autoScaleAllowed = false;
        } else {
          this.currentTool = "default";
          xyGraph.setCursor(undefined);
          xyGraph.autoScaleAllowed = true;
        }
      },
    );
    this.horizontalZoom = this.createToolButton(
      "HorizontalZoom.png",
      "Horizontal Zoom",
      () => {
        if (this.horizontalZoom.pushed) {
          this.currentTool = "horizontal-zoom";
          xyGraph.setCursor("col-resize");
          xyGraph.autoScaleAllowed = false;
        } else {
          this.currentTool = "default";
          xyGraph.setCursor(undefined);
          xyGraph.autoScaleAllowed = true;
        }
      },
    );
    this.verticalZoom = this.createToolButton(
      "VerticalZoom.png",
      "Vertical Zoom",
      () => {
        if (this.verticalZoom.pushed) {
          this.currentTool = "vertical-zoom";
          xyGraph.setCursor("row-resize");
          xyGraph.autoScaleAllowed = false;
        } else {
          this.currentTool = "default";
          xyGraph.setCursor(undefined);
          xyGraph.autoScaleAllowed = true;
        }
      },
    );
    this.zoomIn = this.createToolButton("ZoomIn.png", "Zoom In", () => {
      if (this.zoomIn.pushed) {
        this.currentTool = "zoom-in";
        xyGraph.setCursor("zoom-in");
        xyGraph.autoScaleAllowed = false;
      } else {
        this.currentTool = "default";
        xyGraph.setCursor(undefined);
        xyGraph.autoScaleAllowed = true;
      }
    });
    this.zoomOut = this.createToolButton("ZoomOut.png", "Zoom Out", () => {
      if (this.zoomOut.pushed) {
        this.currentTool = "zoom-out";
        xyGraph.setCursor("zoom-out");
        xyGraph.autoScaleAllowed = false;
      } else {
        this.currentTool = "default";
        xyGraph.setCursor(undefined);
        xyGraph.autoScaleAllowed = true;
      }
    });
    this.panning = this.createToolButton("Panning.png", "Panning", () => {
      if (this.panning.pushed) {
        this.currentTool = "panning";
        xyGraph.setCursor("grab");
        xyGraph.autoScaleAllowed = false;
      } else {
        this.currentTool = "default";
        xyGraph.setCursor(undefined);
        xyGraph.autoScaleAllowed = true;
      }
    });
    this.mouseArrow = this.createToolButton("MouseArrow.png", "None", () => {
      this.currentTool = "default";
      xyGraph.setCursor(undefined);
      xyGraph.autoScaleAllowed = true;
    });
    this.undo = this.createButton("Undo.png", "Undo_Gray.png", "Undo", () => {
      this.commandBuffer.undo();
    });
    this.undo.disabled = true;

    this.redo = this.createButton("Redo.png", "Redo_Gray.png", "Redo", () => {
      this.commandBuffer.redo();
    });
    this.redo.disabled = true;

    this.camera = this.createButton(
      "camera.png",
      "camera.png",
      "Save Snapshot to PNG File",
      () => {
        const a = document.createElement("a");
        try {
          a.href = xyGraph.toDataURL();
          a.download = `${xyGraph.name}_export.png`;
          document.body.appendChild(a);
          a.click();
        } finally {
          document.body.removeChild(a);
        }
      },
    );

    this.toggleTool(this.mouseArrow);

    const loadPromises = this.buttons
      .map((button) => button.loadPromise)
      .concat(this.buttons.map((button) => button.disabledLoadPromise));
    Promise.all(loadPromises).finally(() => {
      this.imagesLoaded = true;
      xyGraph.requestRepaint();
    });

    for (const button of this.buttons) {
      button.loadImage(xyGraph.display.imagesPrefix);
    }
  }

  updateState() {
    this.undo.disabled = !this.commandBuffer.canUndo();
    this.redo.disabled = !this.commandBuffer.canRedo();
    this.xyGraph.requestRepaint();
  }

  addCommand(command: Command) {
    this.commandBuffer.add(command);
    this.updateState();
  }

  toggleTool(button: Button) {
    const wasPushed = button.pushed; // Save
    for (const button of this.buttons) {
      if (button.toolButton) {
        button.pushed = false;
      }
    }
    if (wasPushed) {
      // Restore
      button.pushed = true;
    } else {
      // Default to Mouse Arrow
      this.mouseArrow.pushed = true;
    }
    this.xyGraph.requestRepaint();
  }

  private createToolButton(
    imageFile: string,
    tooltip: string,
    action: () => void,
  ) {
    const button = this.createToggleButton(imageFile, tooltip, action);
    button.toolButton = true;
    return button;
  }

  private createToggleButton(
    imageFile: string,
    tooltip: string,
    action: () => void,
  ) {
    const button = this.createButton(imageFile, imageFile, tooltip, action);
    button.toggleButton = true;
    return button;
  }

  private createButton(
    imageFile: string,
    disabledImageFile: string,
    tooltip: string,
    action: () => void,
  ) {
    const button = new Button(
      this,
      imageFile,
      disabledImageFile,
      tooltip,
      action,
    );
    this.buttons.push(button);
    return button;
  }

  draw(g: Graphics, area: Bounds) {
    const { buttonSize } = this;
    const pos = { x: area.x, y: area.y };

    this.drawButton(g, pos.x, pos.y, this.showLegend);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.autoScale);
    pos.x += buttonSize;

    this.maybeWrap(pos, area, buttonSize / 2);
    this.drawSeparator(g, pos.x, pos.y);
    pos.x += buttonSize / 2;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.rubberbandZoom);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.horizontalZoom);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.verticalZoom);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.zoomIn);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.zoomOut);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.panning);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.mouseArrow);
    pos.x += buttonSize;

    this.maybeWrap(pos, area, buttonSize / 2);
    this.drawSeparator(g, pos.x, pos.y);
    pos.x += buttonSize / 2;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.undo);
    pos.x += buttonSize;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.redo);
    pos.x += buttonSize;

    this.maybeWrap(pos, area, buttonSize / 2);
    this.drawSeparator(g, pos.x, pos.y);
    pos.x += buttonSize / 2;

    this.maybeWrap(pos, area);
    this.drawButton(g, pos.x, pos.y, this.camera);
    pos.x += buttonSize;

    return pos.y + buttonSize - area.y;
  }

  private maybeWrap(pos: Point, area: Bounds, size?: number) {
    size = size ?? this.buttonSize;
    if (pos.x + size > area.x + area.width) {
      pos.x = area.x;
      pos.y += this.buttonSize;
    }
  }

  private drawSeparator(g: Graphics, x: number, y: number) {
    const { buttonSize } = this;
    const lineWidth = 1 * this.scale;
    const pathX = Math.round(x + buttonSize / 4) - lineWidth / 2;
    g.strokePath({
      path: new Path(pathX, y).lineTo(pathX, y + buttonSize),
      color: SEPARATOR_COLOR,
      lineWidth,
    });
  }

  private drawButton(g: Graphics, x: number, y: number, button: Button) {
    const { buttonSize, scale } = this;
    g.fillRect({
      x,
      y,
      width: buttonSize,
      height: buttonSize,
      color: BUTTON_COLOR,
    });

    if (this.xyGraph.enabled && !button.disabled) {
      g.addHitRegion(button.region).addRect(x, y, buttonSize, buttonSize);
    }

    const lineWidth = 1 * scale;
    const top = Math.round(y + lineWidth / 2) - 0.5;
    const left = Math.round(x + lineWidth / 2) - 0.5;
    const bottom = Math.round(y + buttonSize - lineWidth + lineWidth / 2) - 0.5;
    const right = Math.round(x + buttonSize - lineWidth + lineWidth / 2) - 0.5;
    g.strokePath({
      color: button.pushed ? Color.WHITE : Color.BLACK,
      path: new Path(right, bottom)
        .lineTo(right, top)
        .moveTo(right, bottom)
        .lineTo(left, bottom),
      lineWidth,
    });
    g.strokePath({
      color: button.pushed ? Color.BLACK : Color.WHITE,
      path: new Path(left, top)
        .lineTo(right - lineWidth, top)
        .moveTo(left, top)
        .lineTo(left, bottom - lineWidth),
      lineWidth,
    });
    if (this.imagesLoaded) {
      const imageEl = button.disabled
        ? button.disabledImageElement
        : button.imageElement;
      const naturalHeight = imageEl.naturalHeight * scale;
      const naturalWidth = imageEl.naturalWidth * scale;
      const imageX = Math.round(x + (buttonSize - naturalWidth) / 2);
      const imageY = Math.round(y + (buttonSize - naturalHeight) / 2);
      g.ctx.drawImage(imageEl, imageX, imageY, naturalWidth, naturalHeight);
    }
  }

  get scale() {
    return this.xyGraph.scale;
  }

  get buttonSize() {
    return 25 * this.scale;
  }
}
