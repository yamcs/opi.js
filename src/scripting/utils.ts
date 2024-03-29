import { Widget } from "../Widget";
import { ScriptEngine } from "./ScriptEngine";
import { TableWrapper } from "./TableWrapper";
import { WidgetWrapper } from "./WidgetWrapper";
import { XYGraphWrapper } from "./XYGraphWrapper";

export function wrapWidget(widget: Widget, scriptEngine: ScriptEngine) {
  // Avoid importing specific widgets, because it result in a circular warning
  switch (widget.widgetType) {
    case "Table":
      return new TableWrapper(widget as any, scriptEngine);
    case "XY Graph":
      return new XYGraphWrapper(widget as any);
    default:
      return new WidgetWrapper(widget);
  }
}
