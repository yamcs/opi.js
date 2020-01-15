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

const iframe = document.createElement('iframe');
iframe.style.display = 'none';
document.body.appendChild(iframe);

const contentWindow = iframe.contentWindow as any;
let wEval = contentWindow.eval;
if (!wEval && contentWindow.execScript) { // IE
  contentWindow.execScript.call(contentWindow, 'null');
  wEval = contentWindow.eval;
}

export class ScriptEngine {

  private scriptText: string;
  private context: Context;

  constructor(widget: Widget, scriptText: string, pvs: PV<any>[] = []) {
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
    };
  }

  run() {
    this.context = this.runWithContext(this.scriptText, this.context);
  }

  private runWithContext(script: string, context: Context) {
    // Mark current globals
    const originalGlobals = [];
    for (const k in iframe.contentWindow) {
      originalGlobals.push(k);
    }

    // Add context to iframe globals
    for (const k in context) {
      if (context.hasOwnProperty(k)) {
        contentWindow[k] = context[k];
      }
    }
    wEval.call(contentWindow, script);

    // Reset iframe while extracting updated context
    const updatedContext: Context = {};
    for (const k in contentWindow) {
      if (originalGlobals.indexOf(k) === -1) {
        updatedContext[k] = contentWindow[k];
        delete contentWindow[k];
      }
    }
    return updatedContext;
  }
}
