import { StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PATH = "path";

export class OpenFileAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PATH, ""));
  }

  execute(widget: Widget) {
    throw new Error("Unsupported action OPEN_FILE");
  }

  get path(): string {
    return this.properties.getValue(PROP_PATH);
  }

  toString() {
    return `Open ${this.path}`;
  }
}
