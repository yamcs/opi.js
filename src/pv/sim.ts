import { Sample } from './Sample';

export abstract class SimGenerator {

    private lastEmit?: number;

    constructor(private interval: number, private initialValue?: any) {
    }

    step(frameTime: number) {
        if (!this.lastEmit && this.initialValue) {
            const samples = [{ date: new Date(), value: this.initialValue }];
            this.lastEmit = frameTime;
            return samples;
        }
        if (this.interval > 0) {
            if (!this.lastEmit || (frameTime - this.lastEmit) >= this.interval) {
                this.lastEmit = frameTime;
                return this.generateSamples(new Date());
            }
        }
    }

    abstract generateSamples(t: Date): Sample[];
}

export class ConstantGenerator extends SimGenerator {

    constructor(initialValue: any) {
        super(-1, initialValue);
    }

    generateSamples() {
        return [];
    }
}

/**
 * Generates 1 Hz time updates in string format
 */
export class FormattedTimeGenerator extends SimGenerator {

    generateSamples(date: Date) {
        return [{ date, value: date.toISOString() }];
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

    generateSamples(date: Date) {
        this.state = !this.state;
        return [{ date, value: !this.state }];
    }
}

/**
 * Generates random floats in the range [min, max]
 */
export class Noise extends SimGenerator {

    constructor(private min: number, private max: number, interval: number) {
        super(interval);
    }

    generateSamples(date: Date) {
        return [{ date, value: Math.random() * (this.max - this.min) + this.min }];
    }
}

/**
 * Generates random values in the range [min, max]
 */
export class GaussianNoise extends SimGenerator {

    constructor(interval: number, private avg: number, private stddev: number) {
        super(interval);
    }

    generateSamples(date: Date) {
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
        return [{ date, value: this.avg + gaussian * this.stddev }];
    }
}

/**
 * Generate sine samples between min and max.
 * Warning limits are set at 80%, and alarm limits at 90%.
 * Alarm status is not set.
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

    generateSamples(date: Date) {
        const samples = [];
        const range = this.max - this.min;
        const value = Math.sin(this.currentValue * 2 * Math.PI / this.samplesPerCycle) * range / 2 + this.min + (range / 2);
        samples.push({ date, value });
        this.currentValue++;
        return samples;
    }
}

export class Ramp extends SimGenerator {

    private currentValue = 0;

    constructor(private min: number, private max: number, private inc: number, interval: number) {
        super(interval);
        if (inc >= 0) {
            this.currentValue = min - inc;
        } else {
            this.currentValue = max - inc;
        }
    }

    generateSamples(date: Date) {
        const samples = [];
        this.currentValue = this.currentValue + this.inc;
        if (this.currentValue > this.max) {
            this.currentValue = this.min;
        }
        if (this.currentValue < this.min) {
            this.currentValue = this.max;
        }
        samples.push({ date, value: this.currentValue });
        return samples;
    }
}
