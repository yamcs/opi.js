import { RunCommandEvent } from "../events";
import { StringMapProperty, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_COMMAND = "command";
const PROP_ARGS = "args";
const PROP_CONFIRM_MESSAGE = "confirm_message";

export class RunCommandAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_COMMAND, ""));
    this.properties.add(new StringMapProperty(PROP_ARGS, {}));
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

    // Expand any macros in the command or arguments
    const expandedCommand = widget.expandMacro(this.command);
    const expandedArgs: { [key: string]: string } = {};
    for (const item in this.args) {
      expandedArgs[item] = widget.expandMacro(this.args[item]);
    }

    const event: RunCommandEvent = {
      command: expandedCommand,
      args: expandedArgs,
    };
    widget.display.fireEvent("runcommand", event);
  }

  get command(): string {
    return this.properties.getValue(PROP_COMMAND);
  }
  get args(): { [key: string]: string } {
    return this.properties.getValue(PROP_ARGS);
  }
  get confirmMessage(): string {
    return this.properties.getValue(PROP_CONFIRM_MESSAGE);
  }

  toString() {
    return `Run ${this.command}`;
  }
}
