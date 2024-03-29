import { RunProcedureEvent } from "../events";
import { StringMapProperty, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PROCEDURE = "procedure";
const PROP_ARGS = "args";
const PROP_CONFIRM_MESSAGE = "confirm_message";

export class RunProcedureAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PROCEDURE, ""));
    this.properties.add(new StringMapProperty(PROP_ARGS, {}));
    this.properties.add(new StringProperty(PROP_CONFIRM_MESSAGE, ""));
  }

  execute(widget: Widget): void {
    if (this.confirmMessage) {
      const dialogHandler = widget.display.getDialogHandler();
      if (!dialogHandler.openConfirmDialog("Confirm Dialog", this.confirmMessage)) {
        return;
      }
    }
    const event: RunProcedureEvent = {
      procedure: this.procedure,
      args: this.args,
    };
    widget.display.fireEvent("runprocedure", event);
  }

  get procedure(): string {
    return this.properties.getValue(PROP_PROCEDURE);
  }
  get args(): { [key: string]: string } {
    return this.properties.getValue(PROP_ARGS);
  }
  get confirmMessage(): string {
    return this.properties.getValue(PROP_CONFIRM_MESSAGE);
  }

  toString() {
    return `Run ${this.procedure}`;
  }
}
