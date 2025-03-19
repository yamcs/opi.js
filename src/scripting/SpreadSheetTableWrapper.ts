import { Color } from "../Color";
import { ScriptEngine } from "./ScriptEngine";
import { SpreadSheetTable } from "./SpreadSheetTable";

export class SpreadSheetTableWrapper {
  constructor(
    private spreadsheet: SpreadSheetTable,
    private scriptEngine: ScriptEngine,
  ) {}

  addModifiedListener(listener: any) {}

  addSelectionChangedListener(listener: any) {
    this.spreadsheet.addSelectionChangedListener(() => {
      this.scriptEngine.schedule(() => {
        const callback = listener["selectionChanged"];
        callback(this.spreadsheet.getSelection());
      });
    });
  }

  appendRow() {
    return this.spreadsheet.appendRow();
  }

  deleteColumn(index: number) {
    this.spreadsheet.deleteColumn(index);
  }

  deleteRow(index: number) {
    this.spreadsheet.deleteRow(index);
  }

  getCellText(row: number, col: number) {
    return this.spreadsheet.getCellText(row, col);
  }

  getColumnCount() {
    return this.spreadsheet.getColumnCount();
  }

  getContent() {
    return this.spreadsheet.getContent();
  }

  getRowCount() {
    return this.spreadsheet.getRowCount();
  }

  getSelection() {
    return this.spreadsheet.getSelection();
  }

  insertColumn(index: number) {
    this.spreadsheet.insertColumn(index);
  }

  insertRow(index: number) {
    this.spreadsheet.insertRow(index);
  }

  isEmpty() {
    return this.spreadsheet.isEmpty();
  }

  refresh() {
    this.spreadsheet.refresh();
  }

  setCellBackground(row: number, col: number, color: Color) {
    this.spreadsheet.setCellBackground(row, col, color);
  }

  setCellForeground(row: number, col: number, color: Color) {
    this.spreadsheet.setCellForeground(row, col, color);
  }

  setCellText(row: number, col: number, text: string) {
    this.spreadsheet.setCellText(row, col, text);
  }

  setColumnCellEditorData(col: number, data: any) {
    this.spreadsheet.setColumnCellEditorData(col, data);
  }

  setColumnsCount(count: number) {
    this.spreadsheet.setColumnsCount(count);
  }

  setContent(content: string[][]) {
    this.spreadsheet.setContent(content);
  }

  setRowBackground(row: number, color: Color) {
    this.spreadsheet.setRowBackground(row, color);
  }

  setRowForeground(row: number, color: Color) {
    this.spreadsheet.setRowForeground(row, color);
  }

  revealRow(index: number) {
    // Do nothing for now.
    // Method added to not crash if it is used.
  }
}
