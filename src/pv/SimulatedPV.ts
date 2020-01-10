import { PV } from './PV';
import { ConstantGenerator, FormattedTimeGenerator, Noise, SimGenerator } from './sim';

const PV_PATTERN = /sim\:\/\/([a-z]+)\((.*)\)/;


export class SimulatedPV extends PV<any> {

    private fn: SimGenerator;

    constructor(name: string) {
        super(name);
        if (name === 'sys://time') {
            this.fn = new FormattedTimeGenerator(1000);
        } else {
            const match = name.match(PV_PATTERN);
            if (match) {
                const args = match[2].split(',');
                for (let i = 0; i < args.length; i++) {
                    args[i] = args[i].trim();
                }
                this.fn = this.createGenerator(match[1], args);
            } else {
                console.warn(`Unexpected pattern for PV ${name}`);
                this.fn = new Noise(500, -5, 5);
            }
        }
    }

    private createGenerator(fnName: string, args: string[]) {
        switch (fnName) {
            case 'const':
                console.log('create const generator', fnName, args);
                return new ConstantGenerator(args[0]);
            default:
                console.warn(`Unexpected function ${fnName} for PV ${name}`);
                return new Noise(500, -5, 5);
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
