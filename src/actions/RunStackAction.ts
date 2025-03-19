import { RunStackEvent } from "../events";
import { StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PATH = "path";
const PROP_CONFIRM_MESSAGE = "confirm_message";

export class RunStackAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PATH, ""));
    this.properties.add(new StringProperty(PROP_CONFIRM_MESSAGE, ""));
  }

  execute(widget: Widget): void {
    if (this.confirmMessage) {
      const dialogHandler = widget.display.getDialogHandler();
      if (
        !dialogHandler.openConfirmDialog("Confirm Dialog", this.confirmMessage)
      ) {
        return;
      }
    }

    const resolvedPath = widget.display.resolvePath(this.path);

    const event: RunStackEvent = {
      path: resolvedPath,
    };
    widget.display.fireEvent("runstack", event);
  }

  get path(): string {
    return this.properties.getValue(PROP_PATH);
  }
  get confirmMessage(): string {
    return this.properties.getValue(PROP_CONFIRM_MESSAGE);
  }

  toString() {
    return `Run ${this.path}`;
  }
}
