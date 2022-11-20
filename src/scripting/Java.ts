import { ColorFontUtil } from "./ColorFontUtil";
import { ConsoleUtil } from "./ConsoleUtil";
import { DataUtil } from "./DataUtil";
import { DisplayWrapper } from "./DisplayWrapper";
import { FileUtil } from "./FileUtil";
import { GUIUtil } from "./GUIUtil";
import { MessageDialog } from "./MessageDialog";
import { PVUtil } from "./PVUtil";
import { PVWrapper } from "./PVWrapper";
import { ScriptEngine } from "./ScriptEngine";
import { ScriptUtil } from "./ScriptUtil";
import { wrapWidget } from "./utils";

export function createJavaBridge(scriptEngine: ScriptEngine) {
  const widget = scriptEngine.widget;
  const display = scriptEngine.widget.display;

  const Runnable = function (args: { [key: string]: any }) {
    this.run = args["run"];
  };

  const Thread = function (runnable: any) {
    this.runnable = runnable;
  };
  Thread.prototype.start = function () {
    // Async, so UI updates can continue
    scriptEngine.schedule(() => this.runnable.run());
  };
  Thread.sleep = function (delay: number) {
    const start = Date.now();
    let i = 0;
    while (Date.now() < start + delay) {
      i++;
    }
    if (!i) {
      // A reference to "i", just to avoid compiler removing the while
      console.trace("Should not happen");
    }
  };

  const Timer = function () {};
  Timer.prototype.schedule = function (task: () => void, delay: number) {
    scriptEngine.schedule(task, delay);
  };

  const IPVListener = function (args: { [key: string]: any }) {
    this.valueChanged = (pv: PVWrapper) => {
      scriptEngine.schedule(() => {
        const callback = args["valueChanged"];
        callback(pv);
      });
    };
  };

  const ITableModifiedListener = function (args: { [key: string]: any }) {
    this.modified = (content: string[][]) => {
      const callback = args["modified"];
      callback(content);
    };
  };

  const ITableSelectionChangedListener = function (args: {
    [key: string]: any;
  }) {
    this.selectionChanged = (selection: string[][]) => {
      const callback = args["selectionChanged"];
      callback(selection);
    };
  };

  const SpreadSheetTable = {
    ITableModifiedListener,
    ITableSelectionChangedListener,
  };

  return {
    display: new DisplayWrapper(widget.display, scriptEngine),
    widget: wrapWidget(widget, scriptEngine),
    java: {
      lang: {
        Runnable,
        Thread,
      },
      util: {
        Timer,
      },
    },
    org: {
      csstudio: {
        swt: {
          widgets: {
            natives: {
              SpreadSheetTable,
            },
          },
        },
      },
      yamcs: {
        studio: {
          data: {
            IPVListener,
          },
        },
      },
    },
    ColorFontUtil: new ColorFontUtil(),
    ConsoleUtil: new ConsoleUtil(display),
    DataUtil: new DataUtil(),
    FileUtil: new FileUtil(display),
    GUIUtil: new GUIUtil(display),
    MessageDialog: new MessageDialog(display),
    PVUtil: new PVUtil(display.pvEngine),
    ScriptUtil: new ScriptUtil(display),
    SpreadSheetTable,
    Java: {
      type: function (className: string) {
        switch (className) {
          case "java.lang.Runnable":
            return Runnable;
          case "java.lang.Thread":
            return Thread;
          case "java.util.Timer":
            return Timer;
          case "org.csstudio.swt.widgets.natives.SpreadSheetTable":
            return SpreadSheetTable;
          case "org.yamcs.studio.data.IPVListener":
            return IPVListener;
          default:
            throw new Error("Unexpected class name: " + className);
        }
      },
      to: function (jsValue: any, javaType: string) {
        // We have no java in the loop, so just return
        // the input JS.
        return jsValue;
      },
    },
  };
}
