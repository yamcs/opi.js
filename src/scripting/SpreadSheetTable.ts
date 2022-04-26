import { Color } from '../Color';
import { Table } from '../widgets/others/Table';

interface Cell {
    text?: string;
    backgroundColor?: Color;
    foregroundColor?: Color;
}

export class SpreadSheetTable {

    private cells: Cell[][] = [];
    dirty = false;

    constructor(private table: Table) {
    }

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
            content.push(row.map(cell => cell.text || ''));
        }
        return content;
    }

    setContent(content: string[][]) {
        this.cells.length = 0;
        for (let i = 0; i < content.length; i++) {
            this.cells.push(content[i].map(text => {
                return { text };
            }));
        }
        this.dirty = true;
    }

    getRowCount() {
        return this.cells.length;
    }

    getCellText(row: number, col: number) {
        const rowContent = this.cells[row];
        if (rowContent) {
            return rowContent[col]?.text ?? null;
        } else {
            return null;
        }
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

    setColumnCellEditorData(col: number, data: any) {
    }
}
