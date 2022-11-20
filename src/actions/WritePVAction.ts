import { IntProperty, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PV_NAME = "pv_name";
const PROP_VALUE = "value";
const PROP_TIMEOUT = "timeout";
const PROP_CONFIRM_MESSAGE = "confirm_message";

export class WritePVAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PV_NAME, "$(pv_name)"));
    this.properties.add(new StringProperty(PROP_VALUE, ""));
    this.properties.add(new IntProperty(PROP_TIMEOUT, 10));
    this.properties.add(new StringProperty(PROP_CONFIRM_MESSAGE, ""));
  }

  execute(widget: Widget) {
    if (this.pvName) {
      const pvName = widget.expandMacro(this.pvName);
      widget.display.pvEngine.createPV(pvName);
      widget.display.pvEngine.setValue(new Date(), pvName, this.value);
    }
  }

  get pvName(): string {
    return this.properties.getValue(PROP_PV_NAME);
  }
  get value(): string {
    return this.properties.getValue(PROP_VALUE);
  }
  get timeout(): number {
    return this.properties.getValue(PROP_TIMEOUT);
  }
  get confirmMessage(): string {
    return this.properties.getValue(PROP_CONFIRM_MESSAGE);
  }

  toString() {
    return `Write ${this.value} to ${this.pvName}`;
  }
}
