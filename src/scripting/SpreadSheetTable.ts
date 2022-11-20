import { Color } from "../Color";
import { Table } from "../widgets/others/Table";

interface Cell {
  text?: string;
  backgroundColor?: Color;
  foregroundColor?: Color;
}

export class SpreadSheetTable {
  private columnCount = 0;
  private cells: Cell[][] = [];
  selectedRowIndex?: number;
  dirty = false;
  modifiedListeners: Array<() => void> = [];
  selectionChangedListeners: Array<() => void> = [];

  constructor(private table: Table) {}

  isEmpty() {
    return !this.cells.length;
  }

  refresh() {
    this.dirty = true;
  }

  getCells() {
    return this.cells;
  }

  getContent() {
    const content = [];
    for (const row of this.cells) {
      content.push(row.map((cell) => cell.text || ""));
    }
    return content;
  }

  setContent(content: string[][]) {
    this.cells.length = 0;
    for (let i = 0; i < content.length; i++) {
      if (i === 0) {
        this.columnCount = content[i].length;
      }
      this.cells.push(
        content[i].map((text) => {
          return { text };
        })
      );
    }
    this.dirty = true;
  }

  getColumnCount() {
    return this.columnCount;
  }

  getRowCount() {
    return this.cells.length;
  }

  setSelectedRowIndex(index?: number) {
    this.selectedRowIndex = index;
    this.selectionChangedListeners.forEach((l) => l());
    this.dirty = true;
  }

  getSelection() {
    if (this.selectedRowIndex === undefined) {
      return [];
    }

    const row = this.cells[this.selectedRowIndex];
    return [[...row.map((c) => c.text ?? null)]];
  }

  getCellText(row: number, col: number) {
    const rowContent = this.cells[row];
    if (rowContent) {
      return rowContent[col]?.text ?? null;
    } else {
      return null;
    }
  }

  setColumnsCount(count: number) {
    if (count < this.columnCount) {
      for (const row of this.cells) {
        row.length = count;
      }
    }
    if (count > this.columnCount) {
      const newColumns = count - this.columnCount;
      for (const row of this.cells) {
        for (let i = 0; i < newColumns; i++) {
          row.push({ text: "" });
        }
      }
    }
    this.columnCount = count;
    this.dirty = true;
  }

  addModifiedListener(listener: () => void) {
    this.modifiedListeners.push(listener);
  }

  addSelectionChangedListener(listener: () => void) {
    this.selectionChangedListeners.push(listener);
  }

  appendRow() {
    const row: Cell[] = [];
    for (let i = 0; i < this.columnCount; i++) {
      row[i] = { text: "" };
    }
    this.cells.push(row);
    this.dirty = true;
    return this.cells.length - 1;
  }

  deleteRow(index: number) {
    this.cells.splice(index, 1);
    this.dirty = true;
  }

  deleteColumn(index: number) {
    for (const row of this.cells) {
      row.splice(index, 1);
    }
    this.columnCount--;
    this.dirty = true;
  }

  insertRow(index: number) {
    const row: Cell[] = [];
    for (let i = 0; i < this.columnCount; i++) {
      row.push({ text: "" });
    }
    this.cells.splice(index, 0, row);
    this.dirty = true;
  }

  insertColumn(index: number) {
    for (const row of this.cells) {
      row.splice(index, 0, { text: "" });
    }
    this.columnCount++;
    this.dirty = true;
  }

  private getCell(row: number, col: number): Cell {
    this.cells[row] = this.cells[row] ?? [];
    const cell = this.cells[row][col] ?? {};
    this.cells[row][col] = cell;
    return cell;
  }

  setCellText(row: number, col: number, text: string) {
    const cell = this.getCell(row, col);
    cell.text = text;
    this.dirty = true;
  }

  setRowBackground(row: number, color: Color) {
    const rowCells = this.cells[row];
    for (const cell of rowCells) {
      cell.backgroundColor = color;
    }
    this.dirty = true;
  }

  setRowForeground(row: number, color: Color) {
    const rowCells = this.cells[row];
    for (const cell of rowCells) {
      cell.foregroundColor = color;
    }
    this.dirty = true;
  }

  setCellBackground(row: number, col: number, color: Color) {
    const cell = this.getCell(row, col);
    cell.backgroundColor = color;
    this.dirty = true;
  }

  setCellForeground(row: number, col: number, color: Color) {
    const cell = this.getCell(row, col);
    cell.foregroundColor = color;
    this.dirty = true;
  }

  setColumnCellEditorData(col: number, data: any) {}
}
