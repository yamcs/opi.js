import { SpreadSheetTable } from './SpreadSheetTable';

export namespace java {
    export namespace lang {
        export const Runnable = function (args: { [key: string]: any; }) {
            this.run = args["run"];
        };

        export const Thread = function (runnable: any) {
            this.runnable = runnable;
        };
        // TODO should use a web worker, but lot of work to
        // come up with a message interface
        Thread.prototype.start = function () {
            this.runnable.run();
        };
        Thread.sleep = function (delay: number) {
            const start = Date.now();
            let i = 0;
            while (Date.now() < start + delay) { i++; }
            if (!i) { // A reference to "i", just to avoid compiler removing the while
                console.trace("Should not happen");
            }
        };
    }
}


export class Java {

    type(className: string) {
        switch (className) {
            case "java.lang.Runnable":
                return java.lang.Runnable;
            case "java.lang.Thread":
                return java.lang.Thread;
            case "org.csstudio.swt.widgets.natives.SpreadSheetTable":
                return SpreadSheetTable;
            default:
                throw new Error("Unexpected class name: " + className);
        }
    }

    to(jsValue: any, javaType: string) {
        // We have no java in the loop, so just return
        // the input JS.
        return jsValue;
    }
}
