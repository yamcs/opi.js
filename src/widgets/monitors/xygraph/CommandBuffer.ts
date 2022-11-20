import { Axis } from "./Axis";

export interface Command {
  undo(): void;
  redo(): void;
}

interface Range {
  min: number;
  max: number;
}

export class ZoomCommand implements Command {
  private beforeXRanges: Range[] = [];
  private beforeYRanges: Range[] = [];
  private afterXRanges: Range[] = [];
  private afterYRanges: Range[] = [];

  constructor(private xAxis: Axis[], private yAxis: Axis[]) {
    for (const axis of xAxis) {
      this.beforeXRanges.push({
        min: axis.effectiveMinimum,
        max: axis.effectiveMaximum,
      });
    }
    for (const axis of yAxis) {
      this.beforeYRanges.push({
        min: axis.effectiveMinimum,
        max: axis.effectiveMaximum,
      });
    }
  }

  saveState() {
    for (const axis of this.xAxis) {
      this.afterXRanges.push({
        min: axis.effectiveMinimum,
        max: axis.effectiveMaximum,
      });
    }
    for (const axis of this.yAxis) {
      this.afterYRanges.push({
        min: axis.effectiveMinimum,
        max: axis.effectiveMaximum,
      });
    }
  }

  undo() {
    for (let i = 0; i < this.xAxis.length; i++) {
      const axis = this.xAxis[i];
      const range = this.beforeXRanges[i];
      axis.effectiveMinimum = range.min;
      axis.effectiveMaximum = range.max;
    }
    for (let i = 0; i < this.yAxis.length; i++) {
      const axis = this.yAxis[i];
      const range = this.beforeYRanges[i];
      axis.effectiveMinimum = range.min;
      axis.effectiveMaximum = range.max;
    }
  }

  redo() {
    for (let i = 0; i < this.xAxis.length; i++) {
      const axis = this.xAxis[i];
      const range = this.afterXRanges[i];
      axis.effectiveMinimum = range.min;
      axis.effectiveMaximum = range.max;
    }
    for (let i = 0; i < this.yAxis.length; i++) {
      const axis = this.yAxis[i];
      const range = this.afterYRanges[i];
      axis.effectiveMinimum = range.min;
      axis.effectiveMaximum = range.max;
    }
  }
}

export class CommandBuffer {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  add(command: Command) {
    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
    }
  }
}
