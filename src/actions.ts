import { Action } from "./actions/Action";

export class ActionSet {
  actions: (Action | null)[] = [];
  hookFirstActionToClick = false;
  hookAllActionsToClick = false;

  add(action: Action | null) {
    this.actions.push(action);
  }

  isClickable() {
    return (
      this.actions.length &&
      (this.hookFirstActionToClick || this.hookAllActionsToClick)
    );
  }

  getAction(index: number) {
    if (index >= this.actions.length) {
      return;
    }
    return this.actions[index];
  }

  // Called by the macro $(actions)
  toString() {
    if (this.actions.length === 1) {
      return String(this.actions[0]);
    } else {
      return `${this.actions.length} actions`;
    }
  }
}
