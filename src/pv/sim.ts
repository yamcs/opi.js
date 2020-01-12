import { Sample } from './Sample';

export abstract class SimGenerator {

    private lastEmit?: number;

    constructor(private interval: number, private initialValue?: any) {
    }

    step(frameTime: number) {
        if (!this.lastEmit && this.initialValue) {
            const samples = [new Sample(new Date(), this.initialValue)];
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
        return [new Sample(date, date.toISOString())];
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
        return [new Sample(date, !this.state)];
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
        return [new Sample(date, Math.random() * (this.max - this.min) + this.min)];
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
        return [new Sample(date, this.avg + gaussian * this.stddev)];
    }
}

/**
 * Generate sine samples between min and max
 */
export class Sine extends SimGenerator {

    private currentValue = 0;

    constructor(private min: number, private max: number, private samplesPerCycle: number, interval: number) {
        super(interval);
    }

    generateSamples(date: Date) {
        const samples = [];
        const range = this.max - this.min;
        for (let i = 0; i < this.samplesPerCycle; i++) {
            const value = Math.sin(this.currentValue * 2 * Math.PI / this.samplesPerCycle) * range / 2 + this.min + (range / 2);
            samples.push(new Sample(date, value));
            this.currentValue++;
        }
        return samples;
    }
}
