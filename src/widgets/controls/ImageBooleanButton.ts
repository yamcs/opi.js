import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import { shrink } from "../../positioning";
import {
  BooleanProperty,
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
const PROP_OFF_IMAGE = "off_image";
const PROP_OFF_LABEL = "off_label";
const PROP_OFF_STATE = "off_state";
const PROP_ON_IMAGE = "on_image";
const PROP_ON_LABEL = "on_label";
const PROP_ON_STATE = "on_state";
const PROP_PUSH_ACTION_INDEX = "push_action_index";
const PROP_RELEASE_ACTION_INDEX = "released_action_index"; // with 'd'
const PROP_SHOW_BOOLEAN_LABEL = "show_boolean_label";
const PROP_TOGGLE_BUTTON = "toggle_button";

export class ImageBooleanButton extends Widget {
  private onImageElement?: HTMLImageElement;
  private onImageLoaded = false;

  private offImageElement?: HTMLImageElement;
  private offImageLoaded = false;

  private manualToggleState = false; // Without PV

  private areaRegion?: HitRegionSpecification;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new IntProperty(PROP_BIT));
    this.properties.add(new IntProperty(PROP_DATA_TYPE));
    this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
    this.properties.add(new StringProperty(PROP_ON_IMAGE));
    this.properties.add(new StringProperty(PROP_ON_LABEL));
    this.properties.add(new StringProperty(PROP_ON_STATE));
    this.properties.add(new StringProperty(PROP_OFF_IMAGE));
    this.properties.add(new StringProperty(PROP_OFF_LABEL));
    this.properties.add(new StringProperty(PROP_OFF_STATE));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new BooleanProperty(PROP_TOGGLE_BUTTON));
    this.properties.add(new IntProperty(PROP_PUSH_ACTION_INDEX));
    this.properties.add(new IntProperty(PROP_RELEASE_ACTION_INDEX));
    this.properties.add(new BooleanProperty(PROP_SHOW_BOOLEAN_LABEL));
  }

  init() {
    this.onImageElement = new Image();
    this.onImageElement.onload = () => {
      this.onImageLoaded = true;
      this.requestRepaint();
    };
    this.offImageElement = new Image();
    this.offImageElement.onload = () => {
      this.offImageLoaded = true;
      this.requestRepaint();
    };

    if (this.onImage) {
      this.onImageElement.src = this.resolvePath(this.onImage);
    }
    if (this.offImage) {
      this.offImageElement.src = this.resolvePath(this.offImage);
    }

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
      mouseUp: () => {
        if (this.booleanValue && !this.toggleButton) {
          this.toggleOff();
          this.requestRepaint();
        }
      },
      mouseOut: () => {
        if (this.booleanValue && !this.toggleButton) {
          this.toggleOff();
          this.requestRepaint();
        }
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
    let bounds = this.bounds;
    if (this.borderAlarmSensitive) {
      bounds = shrink(bounds, 2 * this.scale, 2 * this.scale);
    }

    const toggled = this.booleanValue;
    if (toggled) {
      if (this.onImageLoaded) {
        g.ctx.drawImage(
          this.onImageElement!,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height
        );
      }
    } else {
      if (this.offImageLoaded) {
        g.ctx.drawImage(
          this.offImageElement!,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height
        );
      }
    }

    const area = g.addHitRegion(this.areaRegion!);
    area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

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
  get showBooleanLabel(): boolean {
    return this.properties.getValue(PROP_SHOW_BOOLEAN_LABEL);
  }
  get effect3d(): boolean {
    return this.properties.getValue(PROP_EFFECT_3D);
  }
  get onImage(): string {
    return this.properties.getValue(PROP_ON_IMAGE);
  }
  get onLabel(): string {
    return this.properties.getValue(PROP_ON_LABEL);
  }
  get onState(): string {
    return this.properties.getValue(PROP_ON_STATE);
  }
  get offImage(): string {
    return this.properties.getValue(PROP_OFF_IMAGE);
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
