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

    get severity() {
        return AlarmSeverity.NONE;
    }

    abstract isWritable(): boolean;

    abstract toString(): string | undefined;
}

export enum AlarmSeverity {
    NONE,
    MINOR,
    MAJOR,
    INVALID,
    UNDEFINED
}
