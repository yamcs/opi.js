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
const PROP_DATA_TYPE = "data_type";
const PROP_EFFECT_3D = "effect_3d";
const PROP_FONT = "font";
const PROP_OFF_COLOR = "off_color";
const PROP_OFF_LABEL = "off_label";
const PROP_OFF_STATE = "off_state";
const PROP_ON_COLOR = "on_color";
const PROP_ON_LABEL = "on_label";
const PROP_ON_STATE = "on_state";
const PROP_PUSH_ACTION_INDEX = "push_action_index";
const PROP_RELEASE_ACTION_INDEX = "released_action_index"; // with 'd'
const PROP_SHOW_LED = "show_led";
const PROP_SHOW_BOOLEAN_LABEL = "show_boolean_label";
const PROP_SQUARE_BUTTON = "square_button";
const PROP_TOGGLE_BUTTON = "toggle_button";

export class BooleanButton extends Widget {
  private hovered = false;
  private manualToggleState = false; // Without PV

  private areaRegion?: HitRegionSpecification;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new IntProperty(PROP_BIT));
    this.properties.add(new IntProperty(PROP_DATA_TYPE));
    this.properties.add(new BooleanProperty(PROP_SQUARE_BUTTON));
    this.properties.add(new BooleanProperty(PROP_SHOW_LED));
    this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
    this.properties.add(new ColorProperty(PROP_ON_COLOR));
    this.properties.add(new StringProperty(PROP_ON_LABEL));
    this.properties.add(new StringProperty(PROP_ON_STATE));
    this.properties.add(new ColorProperty(PROP_OFF_COLOR));
    this.properties.add(new StringProperty(PROP_OFF_LABEL));
    this.properties.add(new StringProperty(PROP_OFF_STATE));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new BooleanProperty(PROP_TOGGLE_BUTTON));
    this.properties.add(new IntProperty(PROP_PUSH_ACTION_INDEX));
    this.properties.add(new IntProperty(PROP_RELEASE_ACTION_INDEX));
    this.properties.add(new BooleanProperty(PROP_SHOW_BOOLEAN_LABEL));
  }

  init() {
    this.areaRegion = {
      id: `${this.wuid}-area`,
      mouseDown: () => {
        if (this.toggleButton) {
          this.booleanValue ? this.toggleOff() : this.toggleOn();
        } else {
          this.toggleOn();
        }
        this.requestRepaint();
      },
      mouseEnter: () => {
        this.hovered = true;
        this.requestRepaint();
      },
      mouseUp: () => {
        if (this.booleanValue && !this.toggleButton) {
          this.toggleOff();
          this.requestRepaint();
        }
      },
      mouseOut: () => {
        if (this.booleanValue && !this.toggleButton) {
          this.toggleOff();
        }
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
      if (this.dataType === 0) {
        // Bit
        if (this.bit < 0) {
          this.display.pvEngine.setValue(new Date(), this.pv.name, 1);
        } else {
          const value = this.pv.value | (1 << this.bit);
          this.display.pvEngine.setValue(new Date(), this.pv.name, value);
        }
      } else {
        this.display.pvEngine.setValue(new Date(), this.pv.name, this.onState);
      }
    }
    this.executeActionByIndex(this.pushActionIndex);
  }

  private toggleOff() {
    this.manualToggleState = false;
    if (this.pv && this.pv.writable) {
      if (this.dataType === 0) {
        // Bit
        if (this.bit < 0) {
          this.display.pvEngine.setValue(new Date(), this.pv.name, 0);
        } else {
          const value = this.pv.value & ~(1 << this.bit);
          this.display.pvEngine.setValue(new Date(), this.pv.name, value);
        }
      } else {
        this.display.pvEngine.setValue(new Date(), this.pv.name, this.offState);
      }
    }
    if (this.releaseActionIndex !== undefined) {
      this.executeActionByIndex(this.releaseActionIndex);
    }
  }

  get booleanValue() {
    if (this.pv && this.pv.value !== undefined) {
      if (this.dataType === 0) {
        // Bit
        if (this.bit < 0) {
          return Boolean(this.pv?.toNumber());
        } else {
          return ((this.pv?.value >> this.bit) & 1) > 0;
        }
      } else if (this.dataType === 1) {
        // Enum
        return this.pv.toString() === this.onState;
      } else {
        return false;
      }
    } else {
      return this.manualToggleState;
    }
  }

  draw(g: Graphics) {
    const toggled = this.booleanValue;

    if (this.squareButton) {
      this.drawSquare(g, toggled);
    } else {
      this.drawEllipse(g, toggled);
    }

    // Foreground
    if (this.width > this.height) {
      this.drawHorizontal(g, toggled);
    } else {
      this.drawVertical(g, toggled);
    }

    if (this.showBooleanLabel) {
      g.fillText({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        font: this.font,
        color: this.foregroundColor,
        align: "center",
        baseline: "middle",
        text: toggled ? this.onLabel : this.offLabel,
      });
    }
  }

  private drawSquare(g: Graphics, toggled: boolean) {
    g.fillRect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: Color.DARK_GRAY,
    });

    const area = g.addHitRegion(this.areaRegion!);
    area.addRect(this.x, this.y, this.width, this.height);

    const lineWidth = 2 * this.scale;
    const tlColor = toggled ? Color.DARK_GRAY : Color.WHITE;
    const brColor = toggled ? Color.WHITE : Color.DARK_GRAY;
    if (this.effect3d) {
      g.fillPath({
        color: tlColor,
        path: new Path(this.x, this.y)
          .lineTo(this.x, this.y + this.height)
          .lineTo(this.x + lineWidth, this.y + this.height - lineWidth)
          .lineTo(this.x + lineWidth, this.y + lineWidth)
          .lineTo(this.x + this.width - lineWidth, this.y + lineWidth)
          .lineTo(this.x + this.width, this.y)
          .closePath(),
      });

      g.fillPath({
        color: brColor,
        path: new Path(this.x, this.y + this.height)
          .lineTo(this.x + this.width, this.y + this.height)
          .lineTo(this.x + this.width, this.y)
          .lineTo(this.x + this.width - lineWidth, this.y + lineWidth)
          .lineTo(
            this.x + this.width - lineWidth,
            this.y + this.height - lineWidth,
          )
          .lineTo(this.x + lineWidth, this.y + this.height - lineWidth)
          .closePath(),
      });
    }

    let color = this.backgroundColor;
    if (this.hovered) {
      color = this.backgroundColor.mixWith(Color.WHITE, 0.5);
    }
    g.fillRect({
      x: this.x + lineWidth,
      y: this.y + lineWidth,
      width: this.width - lineWidth - lineWidth,
      height: this.height - lineWidth - lineWidth,
      color,
    });
  }

  private drawEllipse(g: Graphics, toggled: boolean) {
    const { scale } = this;
    if (this.effect3d) {
      const a = this.width / 2;
      const b = this.height / 2;
      const w = Math.sqrt(a * a + b * b);
      const x1 = this.x + a + (b - a - w) / 2 - 1 * scale;
      const y1 = this.y + b - (b - a + w) / 2 - 1 * scale;
      const x2 = this.x + a + (b - a + w) / 2 + 5 * scale;
      const y2 = this.y + b - (b - a - w) / 2 + 5 * scale;

      const gradient = g.createLinearGradient(x1, y1, x2, y2);
      if (toggled) {
        gradient.addColorStop(0, Color.DARK_GRAY.toString());
        gradient.addColorStop(1, Color.WHITE.toString());
      } else {
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, Color.DARK_GRAY.toString());
      }
      g.ctx.fillStyle = gradient;
    } else if (toggled) {
      g.ctx.fillStyle = Color.WHITE.toString();
    } else {
      g.ctx.fillStyle = Color.DARK_GRAY.toString();
    }

    const x = this.x + this.width / 2;
    const y = this.y + this.height / 2;
    const rx = this.width / 2;
    const ry = this.height / 2;
    g.ctx.beginPath();
    g.ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    g.ctx.fill();

    const area = g.addHitRegion(this.areaRegion!);
    area.addEllipse(x, y, rx, ry, 0, 0, 2 * Math.PI);

    if (this.hovered) {
      g.ctx.fillStyle = this.backgroundColor
        .mixWith(Color.WHITE, 0.5)
        .toString();
    } else {
      g.ctx.fillStyle = this.backgroundColor.toString();
    }
    g.ctx.beginPath();
    g.ctx.ellipse(x, y, rx - scale * 2, ry - scale * 2, 0, 0, 2 * Math.PI);
    g.ctx.fill();
  }

  private drawHorizontal(g: Graphics, toggled: boolean) {
    const { scale } = this;
    if (this.showLed) {
      let diameter: number;
      if (this.squareButton) {
        diameter = Math.floor((0.3 * (this.width + this.height)) / 2);
        if (diameter > Math.min(this.width, this.height)) {
          diameter = Math.min(this.width, this.height) - 2 * scale;
        }
      } else {
        diameter = Math.floor((0.25 * (this.width + this.height)) / 2);
        if (diameter > Math.min(this.width, this.height)) {
          diameter = Math.min(this.width, this.height) - 8 * scale;
        }
      }
      const ledArea: Bounds = {
        x: Math.floor(this.x + this.width * 0.79999 - diameter / 2),
        y: Math.floor(this.y + this.height / 2 - diameter / 2),
        width: diameter,
        height: diameter,
      };

      const cx = ledArea.x + ledArea.width / 2;
      const cy = ledArea.y + ledArea.height / 2;
      const rx = ledArea.width / 2;
      const ry = ledArea.height / 2;
      const ledColor = toggled ? this.onColor : this.offColor;

      g.fillEllipse({ cx, cy, rx, ry, color: ledColor });

      if (this.effect3d) {
        const gradient = g.createLinearGradient(
          ledArea.x,
          ledArea.y,
          ledArea.x + ledArea.width,
          ledArea.y + ledArea.height,
        );
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, ledColor.withAlpha(0).toString());
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        g.ctx.fillStyle = gradient;
        g.ctx.fill();
      }
    }
  }

  private drawVertical(g: Graphics, toggled: boolean) {
    const { scale } = this;
    if (this.showLed) {
      let diameter: number;
      if (this.squareButton) {
        diameter = Math.floor((0.3 * (this.width + this.height)) / 2);
        if (diameter > Math.min(this.width, this.height)) {
          diameter = Math.min(this.width, this.height) - 2 * scale;
        }
      } else {
        diameter = Math.floor((0.25 * (this.width + this.height)) / 2);
        if (diameter > Math.min(this.width, this.height)) {
          diameter = Math.min(this.width, this.height) - 8 * scale;
        }
      }
      const ledArea: Bounds = {
        x: Math.floor(this.x + this.width / 2 - diameter / 2),
        y: Math.floor(this.y + (1 - 0.79999) * this.height - diameter / 2),
        width: diameter,
        height: diameter,
      };

      const ledColor = toggled ? this.onColor : this.offColor;
      const cx = ledArea.x + ledArea.width / 2;
      const cy = ledArea.y + ledArea.height / 2;
      const rx = ledArea.width / 2;
      const ry = ledArea.height / 2;
      g.fillEllipse({ cx, cy, rx, ry, color: ledColor });

      if (this.effect3d) {
        const gradient = g.createLinearGradient(
          ledArea.x,
          ledArea.y,
          ledArea.x + ledArea.width,
          ledArea.y + ledArea.height,
        );
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, ledColor.withAlpha(0).toString());
        g.ctx.beginPath();
        g.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        g.ctx.fillStyle = gradient;
        g.ctx.fill();
      }
    }
  }

  get bit(): number {
    return this.properties.getValue(PROP_BIT);
  }
  get dataType(): number {
    return this.properties.getValue(PROP_DATA_TYPE);
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
  get squareButton(): boolean {
    return this.properties.getValue(PROP_SQUARE_BUTTON);
  }
  get showLed(): boolean {
    return this.properties.getValue(PROP_SHOW_LED);
  }
  get showBooleanLabel(): boolean {
    return this.properties.getValue(PROP_SHOW_BOOLEAN_LABEL);
  }
  get effect3d(): boolean {
    return this.properties.getValue(PROP_EFFECT_3D);
  }
  get onColor(): Color {
    return this.properties.getValue(PROP_ON_COLOR);
  }
  get onLabel(): string {
    return this.properties.getValue(PROP_ON_LABEL);
  }
  get onState(): string {
    return this.properties.getValue(PROP_ON_STATE);
  }
  get offColor(): Color {
    return this.properties.getValue(PROP_OFF_COLOR);
  }
  get offLabel(): string {
    return this.properties.getValue(PROP_OFF_LABEL);
  }
  get offState(): string {
    return this.properties.getValue(PROP_OFF_STATE);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
}
