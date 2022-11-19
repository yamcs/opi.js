import { PV } from '../pv/PV';
import { Widget } from '../Widget';
import { ColorFontUtil } from './ColorFontUtil';
import { ConsoleUtil } from './ConsoleUtil';
import { DataUtil } from './DataUtil';
import { DisplayWrapper } from './DisplayWrapper';
import { FileUtil } from './FileUtil';
import { GUIUtil } from './GUIUtil';
import { createJavaBridge } from './Java';
import { MessageDialog } from './MessageDialog';
import { PVUtil } from './PVUtil';
import { PVWrapper } from './PVWrapper';
import { ScriptUtil } from './ScriptUtil';
import { wrapWidget } from './utils';

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

export function getIframeContentWindow() {
  const el = document.getElementById('script-e') as HTMLIFrameElement;
  return el.contentWindow;
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
      triggerPV: null,
      widget: wrapWidget(widget),
      ColorFontUtil: new ColorFontUtil(),
      ConsoleUtil: new ConsoleUtil(widget.display),
      DataUtil: new DataUtil(),
      FileUtil: new FileUtil(widget.display),
      GUIUtil: new GUIUtil(),
      MessageDialog: new MessageDialog(),
      PVUtil: new PVUtil(widget.display.pvEngine),
      ScriptUtil: new ScriptUtil(widget.display),
      ...widget.display.pvEngine.scriptLibraries,
      ...createJavaBridge(this),
    };
  }

  run(triggerPV?: PV) {
    setTimeout(() => {
      // Update context with triggerPV, using same wrapper object to support equality comparisons
      this.context.triggerPV = null;
      if (triggerPV) {
        for (const pvWrapper of this.context.pvs) {
          if ((pvWrapper as PVWrapper)._pv === triggerPV) {
            this.context.triggerPV = pvWrapper;
          }
        }
      }

      this.runWithContext(() => {
        wEval.call(contentWindow, this.scriptText);
      });
    });
  }

  // Run a specific callback async, but
  // while preserving current state of context.
  //
  // This is used for faking setTimeout without losing
  // the iframe state.
  schedule(runnable: () => void, ms?: number) {
    setTimeout(() => this.runWithContext(runnable), ms);
  }

  // This should be called only from a setTimeout call,
  // so that there's no nesting of scripts triggering
  // other scripts.
  private runWithContext(runnable: () => void) {
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
      runnable();

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
