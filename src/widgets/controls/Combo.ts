import { Color } from "../../Color";
import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { HitRegionSpecification } from "../../HitRegionSpecification";
import { Point, shrink } from "../../positioning";
import {
  BooleanProperty,
  FontProperty,
  StringListProperty,
} from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_ENABLED = "enabled";
const PROP_FONT = "font";
const PROP_ITEMS = "items";
const PROP_ITEMS_FROM_PV = "items_from_pv";

const SELECTOR_WIDTH = 8;

const BORDER_COLOR = new Color(0, 0, 0, 0.1);

export class Combo extends Widget {
  private areaRegion?: HitRegionSpecification;
  private selectEl?: HTMLSelectElement;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new BooleanProperty(PROP_ENABLED));
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new StringListProperty(PROP_ITEMS, []));
    this.properties.add(new BooleanProperty(PROP_ITEMS_FROM_PV));
  }

  init() {
    this.areaRegion = {
      id: `${this.wuid}-area`,
      tooltip: () => this.tooltip,
    };

    this.selectEl = document.createElement("select");
    this.selectEl.style.display = "block";
    this.selectEl.style.position = "absolute";
    this.selectEl.style.boxSizing = "border-box";

    // Hide the select, but allow it still to be 'clickable', so
    // that the browser will display the option menu upon widget click.
    this.selectEl.style.opacity = "0";

    this.selectEl.addEventListener("change", () => {
      this.writeValue(this.selectEl?.value ?? "");
    });

    const emptyOptionEl = document.createElement("option");
    emptyOptionEl.disabled = true;
    emptyOptionEl.value = "";
    emptyOptionEl.defaultSelected = true;
    emptyOptionEl.text = " -- select an option -- ";
    this.selectEl.add(emptyOptionEl);

    for (let i = 0; i < this.items.length; i++) {
      const optionEl = document.createElement("option");
      optionEl.value = this.items[i];
      optionEl.text = this.items[i];
      this.selectEl.add(optionEl);
    }

    this.display.rootPanel.appendChild(this.selectEl);
  }

  draw(g: Graphics) {
    let bounds = this.display.measureAbsoluteArea(this);

    this.selectEl!.style.display = "block";
    this.selectEl!.style.left = `${bounds.x}px`;
    this.selectEl!.style.top = `${bounds.y}px`;
    this.selectEl!.style.width = `${bounds.width}px`;
    this.selectEl!.style.height = `${bounds.height}px`;

    bounds = shrink(this.bounds, 2 * this.scale);
    g.fillRect({
      ...bounds,
      color: this.backgroundColor,
    });
    g.strokeRect({
      ...bounds,
      color: BORDER_COLOR,
      crispen: true,
    });

    const area = g.addHitRegion(this.areaRegion!);
    area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

    if (this.pv?.value) {
      for (const item of this.items) {
        let match = item === this.pv.value;

        // Local PVs convert strings that look like
        // numbers to string, so we have some special
        // handling in case the items look like numbers.
        if (!match) {
          try {
            match = parseFloat(item) === this.pv.value;
          } catch {
            // Ignore
          }
        }

        if (match) {
          g.fillText({
            x: 5 * this.scale + bounds.x,
            y: bounds.y + bounds.height / 2,
            align: "left",
            baseline: "middle",
            color: this.foregroundColor,
            font: this.font,
            text: this.pv?.value,
          });
        }
      }
    }

    const { selectorWidth } = this;
    const size = Math.min(bounds.height, selectorWidth / 2);
    const head: Point = {
      x:
        bounds.x +
        bounds.width -
        selectorWidth -
        5 * this.scale +
        selectorWidth / 2,
      y: bounds.y + (bounds.height - size) / 2 + size,
    };
    g.fillPath({
      color: this.foregroundColor,
      path: new Path(head.x, head.y)
        .lineTo(head.x - size, head.y - size)
        .lineTo(head.x + size, head.y - size)
        .closePath(),
    });
  }

  private writeValue(item: string) {
    if (this.pv && this.pv.writable) {
      this.display.pvEngine.setValue(new Date(), this.pv.name, item);
    }
  }

  hide() {
    if (this.selectEl) {
      this.selectEl.style.display = "none";
    }
  }

  destroy() {
    if (this.selectEl) {
      this.display.rootPanel.removeChild(this.selectEl);
      this.selectEl = undefined;
    }
  }

  get selectorWidth() {
    return this.scale * SELECTOR_WIDTH;
  }

  get enabled(): boolean {
    return this.properties.getValue(PROP_ENABLED);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get items(): string[] {
    return this.properties.getValue(PROP_ITEMS);
  }
  get itemsFromPV(): boolean {
    return this.properties.getValue(PROP_ITEMS_FROM_PV);
  }
}
