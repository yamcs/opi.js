import { AlarmSeverity } from './PV';


export interface Sample {
    date: Date;
    value: any;
    severity: AlarmSeverity;
}

export abstract class SimGenerator {

    private lastEmit?: number;

    lowerDisplayLimit?: number;
    lowerAlarmLimit?: number;
    lowerWarningLimit?: number;

    upperWarningLimit?: number;
    upperAlarmLimit?: number;
    upperDisplayLimit?: number;

    constructor(private interval: number, private initialValue?: any) {
    }

    step(frameTime: number): Sample | undefined {
        if (!this.lastEmit && this.initialValue) {
            this.lastEmit = frameTime;
            return {
                date: new Date(),
                value: this.initialValue,
                severity: AlarmSeverity.NONE,
            };
        }
        if (this.interval > 0) {
            if (!this.lastEmit || (frameTime - this.lastEmit) >= this.interval) {
                this.lastEmit = frameTime;
                return this.generateSample(new Date());
            }
        }
    }

    protected calculateSeverity(value: any): AlarmSeverity {
        if (this.lowerAlarmLimit !== undefined && value < this.lowerAlarmLimit) {
            return AlarmSeverity.MAJOR;
        } else if (this.upperAlarmLimit !== undefined && value > this.upperAlarmLimit) {
            return AlarmSeverity.MAJOR;
        } else if (this.lowerWarningLimit !== undefined && value < this.lowerWarningLimit) {
            return AlarmSeverity.MINOR;
        } else if (this.upperWarningLimit !== undefined && value > this.upperWarningLimit) {
            return AlarmSeverity.MINOR;
        }
        return AlarmSeverity.NONE;
    }

    abstract generateSample(t: Date): Sample | undefined;
}

export class ConstantGenerator extends SimGenerator {

    constructor(initialValue: any) {
        super(-1, initialValue);
    }

    generateSample(): undefined {
        return;
    }
}

/**
 * Generates 1 Hz time updates in string format
 */
export class FormattedTimeGenerator extends SimGenerator {

    generateSample(date: Date) {
        return { date, value: date.toISOString(), severity: AlarmSeverity.NONE };
    }
}

/**
 * Generates an alternating boolean value
 */
export class Flipflop extends SimGenerator {

    private state = true;

    constructor(interval: number) {
        super(interval);
    }

    generateSample(date: Date) {
        this.state = !this.state;
        return { date, value: !this.state, severity: AlarmSeverity.NONE };
    }
}

/**
 * Generates random floats in the range [min, max]
 */
export class Noise extends SimGenerator {

    units: string;

    constructor(private min: number, private max: number, interval: number) {
        super(interval);
        const range = this.max - this.min;
        this.units = 'x';
        this.lowerDisplayLimit = min;
        this.lowerAlarmLimit = min + range * 0.1;
        this.lowerWarningLimit = min + range * 0.2;
        this.upperWarningLimit = min + range * 0.8;
        this.upperAlarmLimit = min + range * 0.9;
        this.upperDisplayLimit = max;
    }

    generateSample(date: Date) {
        const value = Math.random() * (this.max - this.min) + this.min;
        return { date, value, severity: this.calculateSeverity(value) };
    }
}

/**
 * Generates random values in the range [min, max]
 */
export class GaussianNoise extends SimGenerator {

    units: string;

    lowerDisplayLimit: number;
    lowerAlarmLimit: number;
    lowerWarningLimit: number;

    upperWarningLimit: number;
    upperAlarmLimit: number;
    upperDisplayLimit: number;

    constructor(interval: number, private avg: number, private stddev: number) {
        super(interval);
        this.units = 'x';
        this.lowerDisplayLimit = avg - 4 * stddev;
        this.lowerAlarmLimit = avg - 2 * stddev;
        this.lowerWarningLimit = avg - stddev;
        this.upperWarningLimit = avg + stddev;
        this.upperAlarmLimit = avg + 2 * stddev;
        this.upperDisplayLimit = avg + 4 * stddev;
    }

    generateSample(date: Date) {
        let x1;
        let x2;
        let rad;
        do {
            x1 = 2 * Math.random() - 1;
            x2 = 2 * Math.random() - 1;
            rad = x1 * x1 + x2 * x2;
        } while (rad >= 1 || rad === 0);
        const c = Math.sqrt(-2 * Math.log(rad) / rad);
        const gaussian = x1 * c;
        const value = this.avg + gaussian * this.stddev;
        return { date, value, severity: this.calculateSeverity(value) };
    }
}

/**
 * Generate sine samples between min and max.
 * Warning limits are set at 80%, and alarm limits at 90%.
 */
export class Sine extends SimGenerator {

    private currentValue = 0;

    units: string;

    lowerDisplayLimit: number;
    lowerAlarmLimit: number;
    lowerWarningLimit: number;

    upperWarningLimit: number;
    upperAlarmLimit: number;
    upperDisplayLimit: number;

    constructor(private min: number, private max: number, private samplesPerCycle: number, interval: number) {
        super(interval);
        const range = this.max - this.min;
        this.units = 'x';
        this.lowerDisplayLimit = min;
        this.lowerAlarmLimit = min + range * 0.1;
        this.lowerWarningLimit = min + range * 0.2;
        this.upperWarningLimit = min + range * 0.8;
        this.upperAlarmLimit = min + range * 0.9;
        this.upperDisplayLimit = max;
    }

    generateSample(date: Date) {
        const range = this.max - this.min;
        const value = Math.sin(this.currentValue * 2 * Math.PI / this.samplesPerCycle) * range / 2 + this.min + (range / 2);
        this.currentValue++;
        return { date, value, severity: this.calculateSeverity(value) };
    }
}

export class Ramp extends SimGenerator {

    private currentValue = 0;

    units: string;

    lowerDisplayLimit: number;
    lowerAlarmLimit: number;
    lowerWarningLimit: number;

    upperWarningLimit: number;
    upperAlarmLimit: number;
    upperDisplayLimit: number;

    constructor(private min: number, private max: number, private inc: number, interval: number) {
        super(interval);
        if (inc >= 0) {
            this.currentValue = min - inc;
        } else {
            this.currentValue = max - inc;
        }
        const range = this.max - this.min;
        this.units = 'x';
        this.lowerDisplayLimit = min;
        this.lowerAlarmLimit = min + range * 0.1;
        this.lowerWarningLimit = min + range * 0.2;
        this.upperWarningLimit = min + range * 0.8;
        this.upperAlarmLimit = min + range * 0.9;
        this.upperDisplayLimit = max;
    }

    generateSample(date: Date) {
        this.currentValue = this.currentValue + this.inc;
        if (this.currentValue > this.max) {
            this.currentValue = this.min;
        }
        if (this.currentValue < this.min) {
            this.currentValue = this.max;
        }

        return { date, value: this.currentValue, severity: this.calculateSeverity(this.currentValue) };
    }
}
