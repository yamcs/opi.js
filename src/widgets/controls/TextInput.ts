import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import {
  BooleanProperty,
  FontProperty,
  IntProperty,
  StringProperty,
} from "../../properties";
import { formatValue } from '../../utils';
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_CONFIRM_MESSAGE = "confirm_message";
const PROP_FONT = "font";
const PROP_FORMAT_TYPE = "format_type";
const PROP_HORIZONTAL_ALIGNMENT = "horizontal_alignment";
const PROP_MULTILINE_INPUT = "multiline_input";
const PROP_PASSWORD_INPUT = "password_input";
const PROP_PRECISION = "precision";
const PROP_PRECISION_FROM_PV = "precision_from_pv";
const PROP_TEXT = "text";
const PROP_VERTICAL_ALIGNMENT = "vertical_alignment";

export class TextInput extends Widget {
  private areaRegion?: HitRegionSpecification;

  private inputEl?: HTMLInputElement | HTMLTextAreaElement;
  private editing = false;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new StringProperty(PROP_CONFIRM_MESSAGE));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new IntProperty(PROP_FORMAT_TYPE));
    this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
    this.properties.add(new BooleanProperty(PROP_MULTILINE_INPUT));
    this.properties.add(new BooleanProperty(PROP_PASSWORD_INPUT, false));
    this.properties.add(new IntProperty(PROP_PRECISION));
    this.properties.add(new BooleanProperty(PROP_PRECISION_FROM_PV));
    this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT, 1));
  }

  init() {
    if (this.text) {
      this.value = this.text;
    }
    this.areaRegion = {
      id: `${this.wuid}-area`,
      click: () => {
        if (this.pv && !this.pv.writable) {
          return;
        }
        this.editing = true;
        const bounds = this.display.measureAbsoluteArea(this);

        // Cover alarm-sensitive border
        bounds.x -= 2 * this.scale;
        bounds.y -= 2 * this.scale;
        bounds.width += 2 * this.scale;
        bounds.height += 2 * this.scale;
        this.inputEl!.value = this.pv?.value ?? this.value ?? "";
        this.inputEl!.style.display = "block";
        this.inputEl!.style.position = "absolute";
        this.inputEl!.style.boxSizing = "border-box";
        this.inputEl!.style.left = `${bounds.x}px`;
        this.inputEl!.style.top = `${bounds.y}px`;
        this.inputEl!.style.width = `${bounds.width}px`;
        this.inputEl!.style.height = `${bounds.height}px`;
        this.inputEl!.autocomplete = "off";
        if (this.multilineInput) {
          const multiInputEl = this.inputEl as HTMLTextAreaElement;
          multiInputEl.style.resize = "none";
        } else {
          const singleInputEl = this.inputEl as HTMLInputElement;
          if (this.passwordInput) {
            singleInputEl.type = "password";
          }
        }

        this.inputEl!.focus();
        this.inputEl!.select();
      },
      tooltip: () => this.tooltip,
      cursor: "text",
    };

    this.inputEl = document.createElement(
      this.multilineInput ? "textarea" : "input"
    );
    this.inputEl!.style.display = "none";
    this.inputEl!.addEventListener("keyup", (evt: any) => {
      if (evt.key === "Enter") {
        if (!this.multilineInput || evt.ctrlKey) {
          // Multiline input requires ctrl+key to confirm
          const value = this.inputEl?.value || "";
          if (!this.confirmMessage || confirm(this.confirmMessage)) {
            this.value = value;
            if (this.pv) {
              this.display.pvEngine.setValue(new Date(), this.pv.name, value);
            }
            this.inputEl!.style.display = "none";
            this.editing = false;
            this.requestRepaint();
          } else {
            this.cancelInput();
          }
        }
      } else if (evt.key === "Escape") {
        this.cancelInput();
      }
    });
    this.inputEl.addEventListener("blur", (evt) => {
      this.cancelInput();
    });
    this.display.rootPanel.appendChild(this.inputEl);
  }

  private cancelInput() {
    this.inputEl!.style.display = "none";
    this.editing = false;
    this.requestRepaint();
  }

  draw(g: Graphics) {
    if (this.editing) {
      return;
    }

    const area = g.addHitRegion(this.areaRegion!);
    area.addRect(this.x, this.y, this.width, this.height);

    const ctx = g.ctx;
    if (!this.transparent) {
      g.fillRect({
        ...this.area,
        color: this.backgroundColor,
      });
    } else if (this.backgroundAlarmSensitive && this.alarm) {
      g.fillRect({
        ...this.area,
        color: this.alarmSensitiveBackgroundColor,
      });
    }

    // Draw text first to a temporary canvas, for clip reasons
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = this.area.width;
    tmpCanvas.height = this.area.height;
    const offscreenCtx = tmpCanvas.getContext("2d")!;

    offscreenCtx.fillStyle = this.alarmSensitiveForegroundColor.toString();
    offscreenCtx.font = this.font.getFontString();

    let x = this.x;
    if (this.horizAlignment === 0) {
      // LEFT
      offscreenCtx.textAlign = "start";
    } else if (this.horizAlignment === 1) {
      // CENTER
      x += this.width / 2;
      offscreenCtx.textAlign = "center";
    } else if (this.horizAlignment === 2) {
      // RIGHT
      x += this.width;
      offscreenCtx.textAlign = "end";
    }

    let y = this.y;
    if (this.vertAlignment === 0) {
      // TOP
      offscreenCtx.textBaseline = "top";
    } else if (this.vertAlignment === 1) {
      // MIDDLE
      y = y + this.height / 2;
      offscreenCtx.textBaseline = "middle";
    } else if (this.vertAlignment === 2) {
      // BOTTOM
      y = y + this.height;
      offscreenCtx.textBaseline = "bottom";
    }

    let text = this.text;
    if (this.pv && this.pv.value !== undefined) {
      let precision = this.precisionFromPV
        ? this.pv.precision
        : this.precision;
      if (precision === -1) { // Use PV precision if available
        precision = this.pv.precision ?? -1;
      }
      text = formatValue(this.pv.value, this.formatType, precision);
    }

    offscreenCtx.fillText(text, x - this.area.x, y - this.area.y);
    ctx.drawImage(tmpCanvas, this.area.x, this.area.y);
  }

  hide() {
    this.editing = false;
    if (this.inputEl) {
      this.inputEl.style.display = "none";
    }
  }

  destroy() {
    if (this.inputEl) {
      this.display.rootPanel.removeChild(this.inputEl);
      this.inputEl = undefined;
    }
  }

  get value() {
    return this.text;
  }

  set value(value: any) {
    this.properties.setValue(PROP_TEXT, value);
    this.requestRepaint();
  }

  get confirmMessage(): string {
    return this.properties.getValue(PROP_CONFIRM_MESSAGE);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get formatType(): number {
    return this.properties.getValue(PROP_FORMAT_TYPE);
  }
  get horizAlignment(): number {
    return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT);
  }
  get multilineInput(): boolean {
    return this.properties.getValue(PROP_MULTILINE_INPUT);
  }
  get passwordInput(): boolean {
    return this.properties.getValue(PROP_PASSWORD_INPUT);
  }
  get precision(): number {
    return this.properties.getValue(PROP_PRECISION);
  }
  get precisionFromPV(): boolean {
    return this.properties.getValue(PROP_PRECISION_FROM_PV);
  }
  get vertAlignment(): number {
    return this.properties.getValue(PROP_VERTICAL_ALIGNMENT);
  }
}
