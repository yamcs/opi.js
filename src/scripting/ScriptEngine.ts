import { PV } from '../pv/PV';
import { Widget } from '../Widget';
import { ColorFontUtil } from './ColorFontUtil';
import { ConsoleUtil } from './ConsoleUtil';
import { DisplayWrapper } from './DisplayWrapper';
import { MessageDialog } from './MessageDialog';
import { PVUtil } from './PVUtil';
import { PVWrapper } from './PVWrapper';
import { ScriptUtil } from './ScriptUtil';
import { WidgetWrapper } from './WidgetWrapper';

interface Context { [key: string]: any; }

let iframe: HTMLIFrameElement;
let contentWindow: any;
let wEval: any;
function createIframe() {
  iframe = document.createElement('iframe');
  iframe.id = 'script-e';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  contentWindow = iframe.contentWindow as any;
  wEval = contentWindow.eval;
  if (!wEval && contentWindow.execScript) { // IE
    contentWindow.execScript.call(contentWindow, 'null');
    wEval = contentWindow.eval;
  }
}

export class ScriptEngine {

  private context: Context;

  constructor(widget: Widget, readonly scriptText: string, pvs: PV[] = []) {
    if (!iframe) {
      createIframe();
    }
    this.scriptText = scriptText
      .replace(/importClass\([^\)]*\)\s*\;?/gi, '')
      .replace(/importPackage\([^\)]*\)\s*\;?/gi, '')
      .trim();
    this.context = {
      display: new DisplayWrapper(widget.display),
      pvs: pvs.map(pv => new PVWrapper(pv)),
      widget: new WidgetWrapper(widget),
      ConsoleUtil: new ConsoleUtil(),
      ColorFontUtil: new ColorFontUtil(),
      MessageDialog: new MessageDialog(),
      PVUtil: new PVUtil(widget.display.pvEngine),
      ScriptUtil: new ScriptUtil(widget.display),
      ...widget.display.pvEngine.scriptLibraries,
    };
  }

  run() {
    // Mark current globals
    const originalGlobals = [];
    for (const k in iframe.contentWindow) {
      originalGlobals.push(k);
    }

    try {
      // Add context to iframe globals
      for (const k in this.context) {
        if (this.context.hasOwnProperty(k)) {
          contentWindow[k] = this.context[k];
        }
      }
      wEval.call(contentWindow, this.scriptText);

      // Extract updated context
      const updatedContext: Context = {};
      for (const k in contentWindow) {
        if (originalGlobals.indexOf(k) === -1) {
          updatedContext[k] = contentWindow[k];
        }
      }
      this.context = updatedContext;
    } finally {
      // Reset iframe
      for (const k in contentWindow) {
        if (originalGlobals.indexOf(k) === -1) {
          delete contentWindow[k];
        }
      }
    }
  }
}
