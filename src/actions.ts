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

  // Called by the macro $(actions)
  toString() {
    if (this.actions.length === 1) {
      return String(this.actions[0]) || this.actions[0]!.type;
    } else {
      return `${this.actions.length} actions`
    }
  }
}

type Action =
  ExecuteCommandAction |
  ExecuteJavaScriptAction |
  OpenDisplayAction |
  OpenFileAction |
  OpenWebpageAction |
  WritePVAction |
  PlaySoundAction;

export class OpenDisplayAction {
  readonly type = 'OPEN_DISPLAY';
  mode?: number;
  description?: string;
  constructor(public path: string) { }
  toString() {
    return `Open ${this.path}`;
  }
}

export class OpenFileAction {
  readonly type = 'OPEN_FILE';
  path?: string;
  description?: string;
  toString() {
    return `Open ${this.path}`;
  }
}

export class ExecuteJavaScriptAction {
  readonly type = 'EXECUTE_JAVASCRIPT';
  text?: string;
  path?: string;
  description?: string;
  constructor(public embedded: boolean) { }
  toString() {
    return `Execute JavaScript`;
  }
}

export class ExecuteCommandAction {
  readonly type = 'EXECUTE_CMD';
  command?: string;
  commandDirectory?: string;
  waitTime?: number;
  description?: string;
  toString() {
    return `Execute Command ${this.command}`;
  }
}

export class WritePVAction {
  readonly type = 'WRITE_PV';
  confirmMessage?: string;
  description?: string;
  constructor(public pvName: string, public value: string) { }
  toString() {
    return `Write ${this.value} to ${this.pvName}`;
  }
}

export class PlaySoundAction {
  readonly type = 'PLAY_SOUND';
  path?: string;
  description?: string;
  toString() {
    return `Play WAV File ${this.path}`;
  }
}

export class OpenWebpageAction {
  readonly type = 'OPEN_WEBPAGE';
  hyperlink?: string;
  description?: string;
  toString() {
    return `Open Webpage ${this.hyperlink}`;
  }
}
