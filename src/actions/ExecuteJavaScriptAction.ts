import { BooleanProperty, StringProperty } from "../properties";
import { ScriptEngine } from "../scripting/ScriptEngine";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PATH = "path";
const PROP_EMBEDDED = "embedded";
const PROP_SCRIPT_TEXT = "scriptText";

export class ExecuteJavaScriptAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PATH, ""));
    this.properties.add(new BooleanProperty(PROP_EMBEDDED, false));
    this.properties.add(new StringProperty(PROP_SCRIPT_TEXT, ""));
  }

  execute(widget: Widget) {
    if (this.embedded) {
      const engine = new ScriptEngine(widget, this.scriptText);
      engine.run();
    } else {
      const scriptLoader = widget.display.getScriptLoader();
      scriptLoader.load(this.path).then((text) => {
        if (text) {
          const engine = new ScriptEngine(widget.display.instance!, text);
          engine.run();
        }
      });
    }
  }

  get path(): string {
    return this.properties.getValue(PROP_PATH);
  }
  get embedded(): boolean {
    return this.properties.getValue(PROP_EMBEDDED);
  }
  get scriptText(): string {
    return this.properties.getValue(PROP_SCRIPT_TEXT);
  }

  toString() {
    return "Execute JavaScript";
  }
}
