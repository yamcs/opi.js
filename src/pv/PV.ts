export abstract class PV {

    private _value?: any;
    private listeners?: PVListener[];

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

    get value(): any | undefined { return this._value; }
    set value(value: any | undefined) {
        this._value = value;
        this.fireValueChanged();
    }

    protected fireValueChanged() {
        if (this.listeners) {
            for (const listener of this.listeners) {
                listener();
            }
        }
    }

    abstract isWritable(): boolean;

    addListener(listener: PVListener) {
        this.listeners = this.listeners || [];
        this.listeners.push(listener);
    }

    abstract toString(): string | undefined;
}

export type PVListener = () => void;

export enum AlarmSeverity {
    NONE,
    MINOR,
    MAJOR,
    INVALID,
    UNDEFINED
}
