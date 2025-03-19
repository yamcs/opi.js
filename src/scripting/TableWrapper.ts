import { Table } from "../widgets/others/Table";
import { ScriptEngine } from "./ScriptEngine";
import { SpreadSheetTableWrapper } from "./SpreadSheetTableWrapper";
import { WidgetWrapper } from "./WidgetWrapper";

export class TableWrapper extends WidgetWrapper {
  private table: Table;
  private spreadSheetTable: SpreadSheetTableWrapper;

  constructor(widget: Table, scriptEngine: ScriptEngine) {
    super(widget);
    this.table = widget;
    this.spreadSheetTable = new SpreadSheetTableWrapper(
      this.table.spreadsheet,
      scriptEngine,
    );
  }

  getTable() {
    return this.spreadSheetTable;
  }
}
