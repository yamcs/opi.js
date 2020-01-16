
export abstract class PV {

    value?: any;

    units?: string;

    lowerDisplayLimit?: number;
    lowerAlarmLimit?: number;
    lowerWarningLimit?: number;

    upperWarningLimit?: number;
    upperAlarmLimit?: number;
    upperDisplayLimit?: number;

    constructor(readonly name: string) {
    }

    abstract isWritable(): boolean;

    abstract toString(): string | undefined;
}
