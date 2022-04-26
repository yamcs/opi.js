import { SpreadSheetTable } from './SpreadSheetTable';

export class Java {

    type(className: string) {
        switch (className) {
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
