import { Color } from "../../Color";
import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics } from "../../Graphics";
import {
  BooleanProperty,
  FontProperty,
  IntProperty,
  StringTableProperty,
} from "../../properties";
import { SpreadSheetTable } from "../../scripting/SpreadSheetTable";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "./AbstractContainerWidget";

const PROP_COLUMNS_COUNT = "columns_count";
const PROP_COLUMN_HEADERS = "column_headers";
const PROP_COLUMN_HEADER_VISIBLE = "column_header_visible";
const PROP_DEFAULT_CONTENT = "default_content";
const PROP_FONT = "font";

export class Table extends Widget {
  private tableWrapper?: HTMLDivElement;
  private table?: HTMLTableElement;
  spreadsheet: SpreadSheetTable;

  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new IntProperty(PROP_COLUMNS_COUNT));
    this.properties.add(new StringTableProperty(PROP_COLUMN_HEADERS));
    this.properties.add(new BooleanProperty(PROP_COLUMN_HEADER_VISIBLE));
    this.properties.add(new StringTableProperty(PROP_DEFAULT_CONTENT));
    this.properties.add(new FontProperty(PROP_FONT));
    this.spreadsheet = new SpreadSheetTable(this);
  }

  init() {
    this.tableWrapper = document.createElement("div");
    this.tableWrapper.style.display = "none";
    this.tableWrapper.style.overflow = "auto";
    this.table = document.createElement("table");
    this.table.style.tableLayout = "fixed";
    this.table.style.borderSpacing = "0";
    this.table.style.borderCollapse = "collapse";
    this.tableWrapper.appendChild(this.table);
    this.display.rootPanel.appendChild(this.tableWrapper);

    this.table.addEventListener("click", (evt) => {
      const el = evt.target! as HTMLElement;
      if (el.tagName === "TD") {
        const rowEl = el.parentElement as HTMLTableRowElement;
        if (rowEl.rowIndex > 0) {
          this.spreadsheet.setSelectedRowIndex(rowEl.rowIndex - 1);
        }
      } else {
        this.spreadsheet.setSelectedRowIndex(undefined);
      }
      this.requestRepaint();
    });

    this.spreadsheet.setContent(this.defaultContent);
  }

  draw(g: Graphics) {
    if (this.tableWrapper) {
      const { x, y, width, height } = this.display.measureAbsoluteArea(this);
      this.tableWrapper.style.backgroundColor = "white";
      this.tableWrapper.style.position = "absolute";
      this.tableWrapper.style.display = "block";
      this.tableWrapper.style.left = `${x}px`;
      this.tableWrapper.style.top = `${y}px`;
      this.tableWrapper.style.width = `${width}px`;
      this.tableWrapper.style.height = `${height}px`;
      this.tableWrapper.style.border = "1px solid rgba(0, 0, 0, 0.1)";
      this.table!.style.font = this.font.getFontString();
      if (this.spreadsheet.dirty) {
        this.generateTableContent();
        this.spreadsheet.dirty = false;
      }
    }
  }

  private generateTableContent() {
    const rowCount = this.table!.rows.length;
    for (let i = rowCount - 1; i >= 0; i--) {
      this.table!.deleteRow(i);
    }

    if (this.columnHeaderVisible) {
      const rowEl = this.table!.insertRow();
      for (let i = 0; i < this.columnsCount; i++) {
        const header = this.columnHeaders[i];
        const cell = rowEl.insertCell();
        cell.style.color = "#aaa";
        cell.style.textAlign = "left";

        // Sometimes, no headers are specified.
        // Other times only some fields for each header may be specified.
        if (header?.length >= 2 && header[1] !== "") {
          cell.style.width = Number(header[1]) * this.scale + "px";
        }
        cell.style.overflow = "hidden";
        cell.style.padding = `${4 * this.scale}px`;
        cell.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
        if (i !== 0) {
          cell.style.borderLeft = "1px solid rgba(0, 0, 0, 0.1)";
        }
        let headerText = "";
        if (header?.length >= 1) {
          headerText = header[0];
        }
        const newText = document.createTextNode(headerText);
        cell.appendChild(newText);
      }

      // Filler
      rowEl.insertCell();
    }

    const rows = this.spreadsheet.getCells();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const selected = i === this.spreadsheet.selectedRowIndex;
      const rowEl = this.table!.insertRow();
      for (let j = 0; j < this.columnsCount; j++) {
        const cell = rowEl.insertCell();
        cell.style.textAlign = "left";
        cell.style.overflow = "hidden";
        cell.style.wordWrap = "break-word";
        cell.style.textOverflow = "ellipsis";
        cell.style.padding = `${4 * this.scale}px`;
        if (j !== 0) {
          cell.style.borderLeft = "1px solid rgba(0, 0, 0, 0.1)";
        }
        if (row[j] !== undefined) {
          const backgroundColor = selected
            ? Color.BLUE
            : row[j].backgroundColor;
          if (backgroundColor) {
            cell.style.backgroundColor = backgroundColor.toString();
          }
          const foregroundColor = selected
            ? Color.WHITE
            : row[j].foregroundColor;
          if (foregroundColor) {
            cell.style.color = foregroundColor.toString();
          }
          const newText = document.createTextNode(row[j].text || "");
          cell.appendChild(newText);
        }
      }

      // Filler
      rowEl.insertCell();
    }
  }

  hide() {
    if (this.tableWrapper) {
      this.tableWrapper.style.display = "none";
    }
  }

  destroy() {
    if (this.tableWrapper) {
      this.display.rootPanel.removeChild(this.tableWrapper);
      this.tableWrapper = undefined;
      this.table = undefined;
    }
  }

  get columnsCount(): number {
    return this.properties.getValue(PROP_COLUMNS_COUNT);
  }
  get columnHeaders(): string[][] {
    return this.properties.getValue(PROP_COLUMN_HEADERS);
  }
  get columnHeaderVisible(): boolean {
    return this.properties.getValue(PROP_COLUMN_HEADER_VISIBLE);
  }
  get defaultContent(): string[][] {
    return this.properties.getValue(PROP_DEFAULT_CONTENT);
  }
  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
}
