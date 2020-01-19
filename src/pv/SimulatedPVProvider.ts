import { PV } from './PV';
import { PVProvider } from './PVProvider';
import { ConstantGenerator, Noise, Ramp, SimGenerator, Sine } from './sim';

const PV_PATTERN = /sim\:\/\/([a-z]+)(\((.*)\))?/;

export class SimulatedPVProvider implements PVProvider {

    private pvs = new Map<string, SimulatedPV>();

    canProvide(pvName: string) {
        return pvName.startsWith('sim://');
    }

    startProviding(pvs: PV[]) {
        for (const pv of pvs) {
            const wrapped = new SimulatedPV(pv);
            this.pvs.set(pv.name, wrapped);
        }
    }

    stopProviding(pvs: PV[]) {
        for (const pv of pvs) {
            const match = this.pvs.get(pv.name);
            if (match) {
                match.fn.stop();
                this.pvs.delete(pv.name);
            }
        }
    }

    shutdown() {
        for (const pv of this.pvs.values()) {
            pv.fn.stop();
        }
    }
}

class SimulatedPV {

    fn: SimGenerator;

    constructor(readonly pv: PV) {
        const match = pv.name.match(PV_PATTERN);
        if (match) {
            const args = match[3] ? match[3].split(',') : [];
            for (let i = 0; i < args.length; i++) {
                args[i] = args[i].trim();
            }
            this.fn = this.createGenerator(match[1], args);
        } else {
            console.warn(`Unexpected pattern for PV ${name}`);
            this.fn = new ConstantGenerator(pv, undefined);
        }
    }

    private createGenerator(fnName: string, args: string[]) {
        switch (fnName) {
            case 'const':
                return new ConstantGenerator(this.pv, args[0]);
            case 'noise':
                return this.createNoise(args);
            case 'ramp':
                return this.createRamp(args);
            case 'sine':
                return this.createSine(args);
            default:
                console.warn(`Unexpected function ${fnName} for PV ${this.pv.name}`);
                return new ConstantGenerator(this.pv, undefined);
        }
    }

    private createNoise(args: string[]) {
        if (args.length === 0) {
            return new Noise(this.pv, -5, 5, 1000);
        } else {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            return new Noise(this.pv, min, max, interval);
        }
    }

    private createRamp(args: string[]) {
        let ramp: Ramp;
        if (args.length === 0) {
            ramp = new Ramp(this.pv, -5, 5, 1, 1000);
        } else if (args.length === 3) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            ramp = new Ramp(this.pv, min, max, 1, interval);
        } else if (args.length === 4) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const step = parseFloat(args[2]);
            const interval = parseFloat(args[3]) * 1000;
            ramp = new Ramp(this.pv, min, max, step, interval);
        } else {
            console.warn(`Unexpected ramp arguments for PV ${this.pv.name}`);
            return new ConstantGenerator(this.pv, undefined);
        }

        return ramp;
    }

    private createSine(args: string[]) {
        let sine: Sine;
        if (args.length === 0) {
            sine = new Sine(this.pv, -5, 5, 10, 1000);
        } else if (args.length === 3) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const interval = parseFloat(args[2]) * 1000;
            sine = new Sine(this.pv, min, max, 10, interval);
        } else if (args.length === 4) {
            const min = parseFloat(args[0]);
            const max = parseFloat(args[1]);
            const samplesPerCycle = parseFloat(args[2]);
            const interval = parseFloat(args[3]) * 1000;
            sine = new Sine(this.pv, min, max, samplesPerCycle, interval);
        } else {
            console.warn(`Unexpected sine arguments for PV ${this.pv.name}`);
            return new ConstantGenerator(this.pv, undefined);
        }

        return sine;
    }
}
