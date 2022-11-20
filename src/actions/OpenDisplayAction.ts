import { OpenDisplayEvent } from "../events";
import { MacroSet } from "../macros";
import { IntProperty, MacrosProperty, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_MACROS = "macros";
const PROP_MODE = "mode";
const PROP_PATH = "path";

export class OpenDisplayAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PATH, ""));
    this.properties.add(new MacrosProperty(PROP_MACROS));
    this.properties.add(new IntProperty(PROP_MODE, 0));
  }

  execute(widget: Widget) {
    const event: OpenDisplayEvent = {
      path: this.path,
      replace: this.mode === 0,
    };
    widget.display.fireEvent("opendisplay", event);
  }

  get macros(): MacroSet {
    return this.properties.getValue(PROP_MACROS);
  }
  get path(): string {
    return this.properties.getValue(PROP_PATH);
  }
  get mode(): number {
    return this.properties.getValue(PROP_MODE);
  }

  toString() {
    return `Open ${this.path}`;
  }
}
