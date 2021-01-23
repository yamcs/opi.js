import { AlarmSeverity } from './PV';

export interface Sample {
    time: Date;
    value: any;
    severity: AlarmSeverity;

    /**
     * In case of enum, this value is used
     * to render in plots.
     */
    valueIndex?: number;
}
