import { PVEngine } from './PVEngine';
import { Sample } from './Sample';

export class PV {

    private _writable = false;
    private _units?: string;

    private _lowerDisplayLimit?: number;
    private _lowerAlarmLimit?: number;
    private _lowerWarningLimit?: number;

    private _upperWarningLimit?: number;
    private _upperAlarmLimit?: number;
    private _upperDisplayLimit?: number;

    private _time?: Date;
    private _value?: any;
    private _severity = AlarmSeverity.NONE;

    private _disconnected = false;

    constructor(readonly name: string, readonly pvEngine: PVEngine) {
    }

    get units(): string | undefined { return this._units; }
    set units(units: string | undefined) {
        this._units = units;
        this.pvEngine.requestRepaint();
    }

    get lowerDisplayLimit(): number | undefined { return this._lowerDisplayLimit; }
    set lowerDisplayLimit(lowerDisplayLimit: number | undefined) {
        this._lowerDisplayLimit = lowerDisplayLimit;
        this.pvEngine.requestRepaint();
    }

    get lowerAlarmLimit(): number | undefined { return this._lowerAlarmLimit; }
    set lowerAlarmLimit(lowerAlarmLimit: number | undefined) {
        this._lowerAlarmLimit = lowerAlarmLimit;
        this.pvEngine.requestRepaint();
    }

    get lowerWarningLimit(): number | undefined { return this._lowerWarningLimit; }
    set lowerWarningLimit(lowerWarningLimit: number | undefined) {
        this._lowerWarningLimit = lowerWarningLimit;
        this.pvEngine.requestRepaint();
    }

    get upperWarningLimit(): number | undefined { return this._upperWarningLimit; }
    set upperWarningLimit(upperWarningLimit: number | undefined) {
        this._upperWarningLimit = upperWarningLimit;
        this.pvEngine.requestRepaint();
    }

    get upperAlarmLimit(): number | undefined { return this._upperAlarmLimit; }
    set upperAlarmLimit(upperAlarmLimit: number | undefined) {
        this._upperAlarmLimit = upperAlarmLimit;
        this.pvEngine.requestRepaint();
    }

    get upperDisplayLimit(): number | undefined { return this._upperDisplayLimit; }
    set upperDisplayLimit(upperDisplayLimit: number | undefined) {
        this._upperDisplayLimit = upperDisplayLimit;
        this.pvEngine.requestRepaint();
    }

    get writable(): boolean { return this._writable; }
    set writable(writable: boolean) {
        this._writable = writable;
        this.pvEngine.requestRepaint();
    }

    get disconnected(): boolean { return this._disconnected; }
    set disconnected(disconnected: boolean) {
        this._disconnected = disconnected;
        this.pvEngine.requestRepaint();
    }

    get time(): Date | undefined { return this._time; }
    get value(): any | undefined { return this._value; }
    get severity(): AlarmSeverity { return this._severity; }

    // Should be called by PVEngine only
    setSample(sample: Sample) {
        this._time = sample.time;
        this._value = sample.value;
        this._severity = sample.severity;
        this.pvEngine.requestRepaint();
    }

    addListener(listener: PVListener) {
        this.pvEngine.addListener(this.name, listener);
    }

    toString() {
        if (this.value !== undefined) {
            return String(this.value);
        }
    }
}

export type PVListener = () => void;

export enum AlarmSeverity {
    NONE,
    MINOR,
    MAJOR,
    INVALID,
    UNDEFINED
}
