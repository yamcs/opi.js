export class ActionSet {

  actions: (Action | null)[] = [];
  hookFirstActionToClick = false;
  hookAllActionsToClick = false;

  add(action: Action | null) {
    this.actions.push(action);
  }

  isClickable() {
    return this.actions.length
      && (this.hookFirstActionToClick || this.hookAllActionsToClick);
  }

  getAction(index: number) {
    if (index >= this.actions.length) {
      return;
    }
    return this.actions[index];
  }

  getClickActions() {
    const indexes = [];
    if (this.hookFirstActionToClick) {
      indexes.push(0);
    } else if (this.hookAllActionsToClick) {
      for (let i = 0; i < this.actions.length; i++) {
        indexes.push(i);
      }
    }
    return indexes;
  }
}

type Action = OpenDisplayAction | ExecuteJavaScriptAction | WritePVAction;

export interface OpenDisplayAction {
  type: 'OPEN_DISPLAY';
  path: string;
  mode?: number;
}

export interface ExecuteJavaScriptAction {
  type: 'EXECUTE_JAVASCRIPT';
  embedded: boolean;
  text?: string;
  path?: string;
}

export interface WritePVAction {
  type: 'WRITE_PV';
  pvName: string;
  value: string;
  confirmMessage?: string;
  description?: string;
}
