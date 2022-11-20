import { XYGraph } from "../widgets/monitors/xygraph/XYGraph";
import { WidgetWrapper } from "./WidgetWrapper";

export class XYGraphWrapper extends WidgetWrapper {
  private xyGraph: XYGraph;

  constructor(widget: XYGraph) {
    super(widget);
    this.xyGraph = widget;
  }

  clearGraph() {
    this.xyGraph.clearGraph();
  }

  getXBuffer(index: number) {
    const trace = this.xyGraph.getTrace(index);
    return trace.snapshot().map((sample) => sample.x);
  }

  getYBuffer(index: number) {
    const trace = this.xyGraph.getTrace(index);
    return trace.snapshot().map((sample) => sample.y);
  }
}
