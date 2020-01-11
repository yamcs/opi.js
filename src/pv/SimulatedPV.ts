import { PV } from './PV';
import { ConstantGenerator, FormattedTimeGenerator, Noise, SimGenerator } from './sim';

const PV_PATTERN = /sim\:\/\/([a-z]+)(\((.*)\))?/;
const DUMMY_GENERATOR = new ConstantGenerator(undefined);


export class SimulatedPV extends PV<any> {

    private fn: SimGenerator;

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

    isWritable() {
        return false;
    }

    private createGenerator(fnName: string, args: string[]) {
        switch (fnName) {
            case 'const':
                return new ConstantGenerator(args[0]);
            case 'noise':
                if (args.length === 0) {
                    return new Noise(-5, -5, 1000);
                } else {
                    const min = parseFloat(args[0]);
                    const max = parseFloat(args[1]);
                    const interval = parseFloat(args[2]) * 1000;
                    return new Noise(min, max, interval);
                }
            default:
                console.warn(`Unexpected function ${fnName} for PV ${name}`);
                return DUMMY_GENERATOR;
        }
    }

    step(t: number) {
        const samples = this.fn.step(t);
        if (samples && samples.length) {
            for (const sample of samples) {
                this.value = sample.value;
            }
            return true;
        }
        return false;
    }

    toString() {
        return String(this.value);
    }
}
