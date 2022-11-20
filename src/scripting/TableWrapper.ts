import { Table } from "../widgets/others/Table";
import { SpreadSheetTable } from "./SpreadSheetTable";
import { WidgetWrapper } from "./WidgetWrapper";

export class TableWrapper extends WidgetWrapper {
  private table: Table;
  private spreadSheetTable: SpreadSheetTable;

  constructor(widget: Table) {
    super(widget);
    this.table = widget;
    this.spreadSheetTable = this.table.spreadsheet;
  }

  getTable() {
    return this.spreadSheetTable;
  }
}
