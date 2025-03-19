import { Display } from "../Display";
import { ScriptEngine } from "./ScriptEngine";
import { wrapWidget } from "./utils";

export class DisplayWrapper {
  constructor(
    private display: Display,
    private scriptEngine: ScriptEngine,
  ) {}

  isActive() {
    return true;
  }

  getWidget(name: string) {
    const widget = this.display.findWidgetByName(name);
    if (widget) {
      return wrapWidget(widget, this.scriptEngine);
    }
  }
}
