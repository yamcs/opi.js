import { AlarmSeverity, PV } from './PV';
import { ConstantGenerator, FormattedTimeGenerator, Noise, Ramp, Sample, SimGenerator, Sine } from './sim';

const PV_PATTERN = /sim\:\/\/([a-z]+)(\((.*)\))?/;
const DUMMY_GENERATOR = new ConstantGenerator(undefined);


export class SimulatedPV extends PV {

    private fn: SimGenerator;
    private lastSample?: Sample;

    constructor(name: string) {
        super(name);
        if (name === 'sys://time') {
            this.fn = new FormattedTimeGenerator(1000);
        } else {
            const match = name.match(PV_PATTERN);
            if (match) {
                const args = match[3] ? match[3].split(',') : [];
                for (let i = 0; i < args.length; i++) {
                    args[i] = args[i].trim();
                }
                this.fn = this.createGenerator(match[1], args);
            } else {
                console.warn(`Unexpected pattern for PV ${name}`);
                this.fn = DUMMY_GENERATOR;
            }
        }
    }

    step(t: number) {
        const sample = this.fn.step(t);
        if (sample) {
            this.lastSample = sample;
            this.fireValueChanged();
            return true;
        }
        return false;
    }

    get value() {
        if (this.lastSample) {
            return this.lastSample.value;
        }
    }

    get severity() {
        return this.lastSample?.severity || AlarmSeverity.NONE;
    }

    isWritable() {
        return false;
    }

    private createGenerator(fnName: string, args: string[]) {
        switch (fnName) {
            case 'const':
                return new ConstantGenerator(args[0]);
            case 'noise':
                return this.createNoise(args);
            case 'ramp':
                return this.createRamp(args);
            case 'sine':
                return this.createSine(args);
            default:
                console.warn(`Unexpected function ${fnName} for PV ${this.name}`);
                return DUMMY_GENERATOR;
        }
    }

    private createNoise(args: string[]) {
        if (args.length === 0) {
            return new Noise(-5, 5, 1000);
        } else {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            return new Noise(min, max, interval);
        }
    }

    private createRamp(args: string[]) {
        let ramp: Ramp;
        if (args.length === 0) {
            ramp = new Ramp(-5, 5, 1, 1000);
        } else if (args.length === 3) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            ramp = new Ramp(min, max, 1, interval);
        } else if (args.length === 4) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const step = parseFloat(args[2]);
            const interval = parseFloat(args[3]) * 1000;
            ramp = new Ramp(min, max, step, interval);
        } else {
            console.warn(`Unexpected ramp arguments for PV ${this.name}`);
            return DUMMY_GENERATOR;
        }

        this.units = ramp.units;
        this.lowerDisplayLimit = ramp.lowerDisplayLimit;
        this.lowerAlarmLimit = ramp.lowerAlarmLimit;
        this.lowerWarningLimit = ramp.lowerWarningLimit;
        this.upperWarningLimit = ramp.upperWarningLimit;
        this.upperAlarmLimit = ramp.upperAlarmLimit;
        this.upperDisplayLimit = ramp.upperDisplayLimit;
        return ramp;
    }

    private createSine(args: string[]) {
        let sine: Sine;
        if (args.length === 0) {
            sine = new Sine(-5, 5, 10, 1000);
        } else if (args.length === 3) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            sine = new Sine(min, max, 10, interval);
        } else if (args.length === 4) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const samplesPerCycle = parseFloat(args[2]);
            const interval = parseFloat(args[3]) * 1000;
            sine = new Sine(min, max, samplesPerCycle, interval);
        } else {
            console.warn(`Unexpected sine arguments for PV ${this.name}`);
            return DUMMY_GENERATOR;
        }

        this.units = sine.units;
        this.lowerDisplayLimit = sine.lowerDisplayLimit;
        this.lowerAlarmLimit = sine.lowerAlarmLimit;
        this.lowerWarningLimit = sine.lowerWarningLimit;
        this.upperWarningLimit = sine.upperWarningLimit;
        this.upperAlarmLimit = sine.upperAlarmLimit;
        this.upperDisplayLimit = sine.upperDisplayLimit;
        return sine;
    }

    toString() {
        return String(this.value);
    }
}
