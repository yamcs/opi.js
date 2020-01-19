import { AlarmSeverity } from './PV';

export interface Sample {
    time: Date;
    value: any;
    severity: AlarmSeverity;
}
