import { Action } from "../../actions/Action";
import { Color } from "../../Color";
import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import {
  BooleanProperty,
  FontProperty,
  IntProperty,
  StringProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_FONT = "font";
const PROP_PUSH_ACTION_INDEX = "push_action_index";
const PROP_RELEASE_ACTION_INDEX = "release_action_index";
const PROP_TOGGLE_BUTTON = "toggle_button";
const PROP_IMAGE = "image";

export class ActionButton extends Widget {
  private areaRegion?: HitRegionSpecification;

  private pushed = false;

  private imageElement?: HTMLImageElement;
  private imageLoaded = false;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new BooleanProperty(PROP_TOGGLE_BUTTON));
    this.properties.add(new IntProperty(PROP_PUSH_ACTION_INDEX));
    this.properties.add(new IntProperty(PROP_RELEASE_ACTION_INDEX));
    this.properties.add(new StringProperty(PROP_IMAGE));
  }

  init() {
    if (this.image) {
      this.imageElement = new Image();
      this.imageElement.onload = () => {
        this.imageLoaded = true;
        this.requestRepaint();
      };
      this.imageElement.src = this.resolvePath(this.image);
    }

    this.areaRegion = {
      id: `${this.wuid}-area`,
      mouseDown: () => {
        if (this.enabled && !this.toggleButton) {
          this.pushed = true;
          this.requestRepaint();
        }
      },
      mouseOut: () => {
        if (this.enabled) {
          this.pushed = false;
        }
        this.requestRepaint();
      },
      mouseUp: () => {
        if (this.enabled && !this.toggleButton) {
          this.pushed = false;
          this.requestRepaint();
        }
      },
      click: () => {
        if (this.enabled) {
          this.executeActionByIndex(
            this.pushed ? this.releaseActionIndex! : this.pushActionIndex,
          );
          if (this.toggleButton) {
            this.pushed = !this.pushed;
          }
        }
      },
      tooltip: () => this.tooltip,
      cursor: "pointer",
    };
  }

  draw(g: Graphics) {
    const ctx = g.ctx;
    const { scale } = this;

    g.fillRect({
      ...this.area,
      color: this.backgroundColor,
    });

    const hitRegion = g.addHitRegion(this.areaRegion!);
    hitRegion.addRect(this.x, this.y, this.width, this.height);

    const lineWidth = 1 * scale;

    const top = this.holderY + lineWidth / 2;
    const left = this.holderX + lineWidth / 2;
    const bottom = this.holderY + this.holderHeight - lineWidth + lineWidth / 2;
    const right = this.holderX + this.holderWidth - lineWidth + lineWidth / 2;

    g.strokePath({
      lineWidth,
      color: this.pushed ? Color.BUTTON_LIGHTEST : Color.BLACK,
      path: new Path(right, bottom)
        .lineTo(right, top)
        .moveTo(right, bottom)
        .lineTo(left, bottom),
    });

    g.strokePath({
      lineWidth,
      color: this.pushed ? this.backgroundColor : Color.BUTTON_DARKER,
      path: new Path(right - lineWidth, bottom - lineWidth)
        .lineTo(right - lineWidth, top + lineWidth)
        .moveTo(right - lineWidth, bottom - lineWidth)
        .lineTo(left + lineWidth, bottom - lineWidth),
    });

    g.strokePath({
      lineWidth,
      color: this.pushed ? Color.BLACK : Color.BUTTON_LIGHTEST,
      path: new Path(left, top)
        .lineTo(right - lineWidth, top)
        .moveTo(left, top)
        .lineTo(left, bottom - lineWidth),
    });

    g.strokePath({
      lineWidth,
      color: this.pushed ? Color.BUTTON_DARKER : this.backgroundColor,
      path: new Path(left + lineWidth, top + lineWidth)
        .lineTo(right - lineWidth - lineWidth, top + lineWidth)
        .moveTo(left + lineWidth, top + lineWidth)
        .lineTo(left + lineWidth, bottom - lineWidth - lineWidth),
    });

    const lines = this.text.split("\n");

    ctx.fillStyle = this.foregroundColor.toString();
    ctx.font = this.font.getFontString();

    // Calculate available space in height and width
    let x;
    let y;
    if (this.imageElement && this.imageLoaded) {
      const textWidth = ctx.measureText(lines[0]).width;
      const textHeight = this.font.height;

      const naturalHeight = this.imageElement.naturalHeight * scale;
      const naturalWidth = this.imageElement.naturalWidth * scale;

      const hratio = (this.height - naturalHeight) / textHeight;
      const wratio = (this.width - naturalWidth) / textWidth;
      const magicSpacer = 5 * scale;
      if (wratio > hratio) {
        // Text right of icon
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        x = this.x + (this.width - textWidth) / 2 + magicSpacer;
        y = this.y + this.height / 2;

        const imageX = this.x + (this.width - textWidth) / 2 - naturalWidth;
        const imageY = this.y + (this.height - naturalHeight) / 2;
        ctx.drawImage(
          this.imageElement,
          imageX,
          imageY,
          naturalWidth,
          naturalHeight,
        );
      } else {
        // Text under icon
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const contentHeight = textHeight + naturalHeight;
        x = this.x + this.width / 2;
        y = this.y + (this.height - contentHeight) / 2 + naturalHeight;
        const imageX = this.x + (this.width - naturalWidth) / 2;
        const imageY = this.y + (this.height - contentHeight) / 2;
        ctx.drawImage(
          this.imageElement,
          imageX,
          imageY,
          naturalWidth,
          naturalHeight,
        );
      }

      if (this.pushed) {
        x += 1 * scale;
        y += 1 * scale;
      }

      if (this.enabled) {
        ctx.fillStyle = this.foregroundColor.toString();
        ctx.fillText(lines[0], x, y);
      } else {
        ctx.fillStyle = Color.BUTTON_LIGHTEST.toString();
        ctx.fillText(lines[0], x + 1 * scale, y + 1 * scale);
        ctx.fillStyle = Color.BUTTON_DARKER.toString();
        ctx.fillText(lines[0], x, y);
      }
    } else {
      ctx.textAlign = "start";
      ctx.textBaseline = "top";

      let maxWidth = 0;
      for (const line of lines) {
        const textWidth = ctx.measureText(line).width;
        maxWidth = Math.max(maxWidth, textWidth);
      }

      x = this.x + (this.width - maxWidth) / 2;

      const textHeight =
        lines.length * this.font.height +
        (lines.length - 1) * this.font.height * 0.2;
      y = this.y + (this.height - textHeight) / 2;

      for (const line of lines) {
        let textX = x;
        let textY = y;
        if (this.pushed) {
          textX += 1 * scale;
          textY += 1 * scale;
        }

        if (this.enabled) {
          ctx.fillStyle = this.foregroundColor.toString();
          ctx.fillText(line, textX, textY);
        } else {
          ctx.fillStyle = Color.BUTTON_LIGHTEST.toString();
          ctx.fillText(line, textX + 1 * scale, textY + 1 * scale);
          ctx.fillStyle = Color.BUTTON_DARKER.toString();
          ctx.fillText(line, textX, textY);
        }

        y += this.font.height * 1.2; // Roughly
      }
    }
  }

  // Override because hookFirstActionToClick is not used
  // for this type of widget. Instead use pushActionIndex and
  // releaseActionIndex.
  getHookedActions() {
    const { actions: actionSet } = this;
    if (actionSet.hookAllActionsToClick) {
      return actionSet.actions as Action[];
    }
    if (this.pushed) {
      const idx = this.releaseActionIndex!;
      const action = actionSet.getAction(idx)!;
      return [action];
    } else {
      const idx = this.pushActionIndex;
      const action = actionSet.getAction(idx)!;
      return [action];
    }
  }

  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get image(): string {
    return this.properties.getValue(PROP_IMAGE);
  }
  get toggleButton(): boolean {
    return this.properties.getValue(PROP_TOGGLE_BUTTON);
  }
  get pushActionIndex(): number {
    return this.properties.getValue(PROP_PUSH_ACTION_INDEX);
  }
  get releaseActionIndex(): number {
    return this.properties.getValue(PROP_RELEASE_ACTION_INDEX);
  }

  // Some widget instances don't seem to have this property and use a specific default.
  get backgroundColor(): Color {
    const prop = this.properties.getProperty("background_color");
    if (prop && prop.value !== Color.TRANSPARENT) {
      return prop.value;
    } else {
      return Color.BUTTON;
    }
  }
}
