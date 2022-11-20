import { StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_HYPERLINK = "hyperlink";

export class OpenWebpageAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_HYPERLINK, "http://"));
  }

  execute(widget: Widget) {
    if (this.hyperlink) {
      window.location.href = this.hyperlink;
    }
  }

  get hyperlink(): string {
    return this.properties.getValue(PROP_HYPERLINK);
  }

  toString() {
    return `Open Webpage ${this.hyperlink}`;
  }
}
