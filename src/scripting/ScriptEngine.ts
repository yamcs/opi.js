import { PV } from "../pv/PV";
import { Widget } from "../Widget";
import { createJavaBridge } from "./Java";
import { PVWrapper } from "./PVWrapper";

interface Context {
  [key: string]: any;
}

export class ScriptEngine {
  private context: Context;

  constructor(
    readonly widget: Widget,
    readonly scriptText: string,
    pvs: PV[] = [],
  ) {
    this.scriptText = scriptText
      .replace(/importClass\([^\)]*\)\s*\;?/gi, "")
      .replace(/importPackage\([^\)]*\)\s*\;?/gi, "")
      .trim();
    this.context = {
      pvs: pvs.map((pv) => new PVWrapper(pv)),
      triggerPV: null,
      ...widget.display.pvEngine.scriptLibraries,
      ...createJavaBridge(this),
    };
  }

  run(triggerPV?: PV) {
    window.setTimeout(() => {
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
        // Indirect eval: runs in global scope, not this module's lexical scope.
        (0, eval)(this.scriptText);
      });
    });
  }

  // Run a specific callback while preserving the current context state.
  // Must only be called from a setTimeout to avoid nested script execution.
  schedule(runnable: () => void, ms?: number) {
    window.setTimeout(() => this.runWithContext(runnable), ms);
  }

  private runWithContext(runnable: () => void) {
    // Snapshot existing globals so we can restore them after the run.
    const originalGlobals: string[] = [];
    for (const k in window) {
      originalGlobals.push(k);
    }

    try {
      // Expose context as globals so scripts can reference pvs, triggerPV, etc.
      for (const k in this.context) {
        if (this.context.hasOwnProperty(k)) {
          (window as any)[k] = this.context[k];
        }
      }
      runnable();

      // Capture any new or modified globals as updated context for the next run.
      const updatedContext: Context = {};
      for (const k in window) {
        if (originalGlobals.indexOf(k) === -1) {
          updatedContext[k] = (window as any)[k];
        }
      }
      this.context = updatedContext;
    } finally {
      // Remove everything added during this run.
      for (const k in window) {
        if (originalGlobals.indexOf(k) === -1) {
          delete (window as any)[k];
        }
      }
    }
  }
}
