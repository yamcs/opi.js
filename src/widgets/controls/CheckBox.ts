import { Color } from "../../Color";
import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import { Bounds } from "../../positioning";
import {
  BooleanProperty,
  ColorProperty,
  FontProperty,
  IntProperty,
  StringProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_BIT = "bit";
const PROP_ENABLED = "enabled";
const PROP_FONT = "font";
const PROP_LABEL = "label";
const PROP_SELECTED_COLOR = "selected_color";

const BOX_SIZE = 16;
const BOX_BORDER_COLOR = new Color(130, 130, 130);
const BOX_BACKGROUND_MIX_COLOR = new Color(94, 151, 230);
const GAP = 4;

export class CheckBox extends Widget {
  private hovered = false;
  private manualToggleState = false; // Without PV

  private areaRegion?: HitRegionSpecification;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new IntProperty(PROP_BIT));
    this.properties.add(new BooleanProperty(PROP_ENABLED));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new StringProperty(PROP_LABEL));
    this.properties.add(
      new ColorProperty(PROP_SELECTED_COLOR, new Color(64, 64, 64)),
    );
  }

  init() {
    this.areaRegion = {
      id: `${this.wuid}-area`,
      mouseDown: () => {
        if (this.enabled) {
          this.booleanValue ? this.toggleOff() : this.toggleOn();
          this.requestRepaint();
        }
      },
      mouseEnter: () => {
        this.hovered = true;
        this.requestRepaint();
      },
      mouseOut: () => {
        this.hovered = false;
        this.requestRepaint();
      },
      tooltip: () => this.tooltip,
      cursor: "pointer",
    };
  }

  private toggleOn() {
    this.manualToggleState = true;
    if (this.pv && this.pv.writable) {
      if (this.bit < 0) {
        this.display.pvEngine.setValue(new Date(), this.pv.name, 1);
      } else {
        const value = this.pv.value | (1 << this.bit);
        this.display.pvEngine.setValue(new Date(), this.pv.name, value);
      }
    }
  }

  private toggleOff() {
    this.manualToggleState = false;
    if (this.pv && this.pv.writable) {
      if (this.bit < 0) {
        this.display.pvEngine.setValue(new Date(), this.pv.name, 0);
      } else {
        const value = this.pv.value & ~(1 << this.bit);
        this.display.pvEngine.setValue(new Date(), this.pv.name, value);
      }
    }
  }

  get booleanValue() {
    if (this.pv && this.pv.value !== undefined) {
      if (this.bit < 0) {
        return Boolean(this.pv?.toNumber());
      } else {
        return ((this.pv?.value >> this.bit) & 1) > 0;
      }
    } else {
      return this.manualToggleState;
    }
  }

  draw(g: Graphics) {
    const area = g.addHitRegion(this.areaRegion!);
    area.addRect(this.x, this.y, this.width, this.height);

    const toggled = this.booleanValue;
    const { boxSize, gap, scale } = this;

    let backgroundColor = this.backgroundColor;
    if (this.hovered) {
      backgroundColor = backgroundColor.mixWith(BOX_BACKGROUND_MIX_COLOR, 0.7);
    }

    const box: Bounds = {
      x: this.x,
      y: this.y + this.height / 2 - boxSize / 2,
      width: boxSize,
      height: boxSize,
    };
    const gradient = g.createLinearGradient(
      box.x,
      box.y + 1 * scale,
      box.x,
      box.y + box.height,
    );
    gradient.addColorStop(0, Color.WHITE.toString());
    gradient.addColorStop(1, backgroundColor.toString());
    g.fillRect({
      ...box,
      rx: 2 * scale,
      ry: 2 * scale,
      gradient,
    });
    g.strokeRect({
      x: box.x + 0.5 * scale,
      y: box.y + 0.5 * scale,
      width: box.width - 1 * scale,
      height: box.height - 1 * scale,
      rx: 2 * scale,
      ry: 2 * scale,
      color: BOX_BORDER_COLOR,
    });

    if (toggled) {
      g.strokePath({
        lineWidth: 3 * scale,
        color: this.selectedColor,
        path: new Path(box.x + 3 * scale, box.y + Math.floor(boxSize * 0.45))
          .lineTo(
            box.x + Math.floor(boxSize * 0.45),
            box.y + (boxSize * 3) / 4 - 1 * scale,
          )
          .lineTo(box.x + boxSize - 2 * scale, box.y + 3 * scale),
      });
    }

    if (this.enabled) {
      g.fillText({
        x: box.x + box.width + gap,
        y: box.y + box.height / 2,
        align: "left",
        baseline: "middle",
        color: this.foregroundColor,
        font: this.font,
        text: this.label,
      });
    } else {
      g.fillText({
        x: box.x + box.width + gap + 1 * scale,
        y: box.y + box.height / 2 + 1 * scale,
        align: "left",
        baseline: "middle",
        color: Color.BUTTON_LIGHTEST,
        font: this.font,
        text: this.label,
      });
      g.fillText({
        x: box.x + box.width + gap,
        y: box.y + box.height / 2,
        align: "left",
        baseline: "middle",
        color: Color.BUTTON_DARKER,
        font: this.font,
        text: this.label,
      });
    }
  }

  get boxSize() {
    return this.scale * BOX_SIZE;
  }

  get gap() {
    return this.scale * GAP;
  }

  get bit(): number {
    return this.properties.getValue(PROP_BIT);
  }
  get enabled(): boolean {
    return this.properties.getValue(PROP_ENABLED);
  }
  get selectedColor(): Color {
    return this.properties.getValue(PROP_SELECTED_COLOR);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get label(): string {
    return this.properties.getValue(PROP_LABEL);
  }
}
