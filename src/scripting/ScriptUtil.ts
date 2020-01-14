import { Display } from '../Display';
import { OpenDisplayEvent } from '../events';

export class ScriptUtil {

  constructor(private display: Display) { }

  openOPI(widget: any, path: string, target: number, macrosInput: any) {
    if (target === 0) { // replace
      const event: OpenDisplayEvent = {
        path,
        replace: target === 0,
      };
      this.display.fireEvent('opendisplay', event);
    } else {
      throw new Error(`Unsupported target ${target}`);
    }
  }

  closeCurrentOPI() {
    this.display.clear();
  }
}
