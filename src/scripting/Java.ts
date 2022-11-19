import { PVWrapper } from './PVWrapper';
import { ScriptEngine } from './ScriptEngine';
import { SpreadSheetTable } from './SpreadSheetTable';

export function createJavaBridge(scriptEngine: ScriptEngine) {
    const Runnable = function (args: { [key: string]: any; }) {
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
        while (Date.now() < start + delay) { i++; }
        if (!i) { // A reference to "i", just to avoid compiler removing the while
            console.trace("Should not happen");
        }
    };

    const Timer = function () { };
    Timer.prototype.schedule = function (task: () => void, delay: number) {
        scriptEngine.schedule(task, delay);
    };

    const IPVListener = function (args: { [key: string]: any; }) {
        this.valueChanged = (pv: PVWrapper) => {
            scriptEngine.schedule(() => {
                const callback = args["valueChanged"];
                callback(pv);
            });
        };
    };

    return {
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
            yamcs: {
                studio: {
                    data: {
                        IPVListener,
                    },
                },
            },
        },
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
