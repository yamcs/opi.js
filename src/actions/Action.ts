import { PropertySet, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { XMLNode } from "../XMLNode";

const PROP_DESCRIPTION = "description";

export abstract class Action {
  properties: PropertySet;

  constructor() {
    this.properties = new PropertySet(null, [
      new StringProperty(PROP_DESCRIPTION, ""),
    ]);
  }

  parseNode(node: XMLNode) {
    this.properties.loadXMLValues(node);
  }

  abstract execute(widget: Widget): void;

  get description(): string {
    return this.properties.getValue(PROP_DESCRIPTION);
  }
}
