import { Display } from '../Display';

export class ScriptUtil {

  constructor(private display: Display) { }

  openOPI(widget: any, path: string, target: any, macrosInput: any) {
    /*this.display.navigationHandler.openDisplay({
      target: this.display.resolve(path),
      openInNewWindow: false,
    });*/
  }

  closeCurrentOPI() {
    /*this.display.navigationHandler.closeDisplay();*/
  }
}
