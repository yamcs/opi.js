import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';
import { LocalPV } from './LocalPV';
import { PV } from './PV';
import { SimulatedPV } from './SimulatedPV';

export class PVEngine {

    private formulas = new Map<string, CompiledFormula>();
    private formulasByTrigger = new Map<string, CompiledFormula[]>();
    private pvs = new Map<string, PV<any>>();
    private simulatedPvs: SimulatedPV[] = [];

    private changed = false;

    step(t: number): boolean {
        let wasChanged = this.changed;
        for (const pv of this.simulatedPvs) {
            const pvChanged = pv.step(t);
            wasChanged = wasChanged || pvChanged;
        }

        this.changed = false;
        return wasChanged;
    }

    reset() {
        this.formulas.clear();
        this.formulasByTrigger.clear();
        this.pvs.clear();
        this.simulatedPvs = [];
    }

    getPVNames() {
        return [... this.pvs.keys()];
    }

    hasPV(pvName: string) {
        return this.pvs.has(pvName);
    }

    getPV(pvName: string) {
        return this.pvs.get(pvName);
    }

    createPV(pvName: string) {
        let pv = this.pvs.get(pvName);
        if (pv) {
            return pv;
        }

        if (pvName.startsWith('loc://')) {
            pv = new LocalPV(pvName);
            this.pvs.set(pvName, pv);
        } else if (pvName === 'sys://time' || pvName.startsWith('sim://')) {
            pv = new SimulatedPV(pvName);
            this.pvs.set(pvName, pv);
            this.simulatedPvs.push(pv as SimulatedPV);
            return pv;
        } else if (pvName.startsWith('=')) {
            this.createFormula(pvName);
        } else {
            console.warn(`Unsupported PV ${pvName}`);
        }
    }

    getValue(pvName: string) {
        const pv = this.pvs.get(pvName);
        if (pv) {
            return pv.value;
        }
    }

    setValue(pvName: string, value: any) {
        const pv = this.pvs.get(pvName);
        if (pv) {
            if (pv.isWritable()) {
                pv.value = value;
                this.changed = true;
            } else {
                throw new Error(`Cannot set value of readonly PV ${pvName}`);
            }
        } else {
            throw new Error(`Cannot set value of unknown PV ${pvName}`);
        }
    }

    private createFormula(pvName: string) {
        let compiledFormula = this.formulas.get(pvName);
        if (!compiledFormula) {
            const compiler = new FormulaCompiler();
            compiledFormula = compiler.compile(pvName);
        }

        for (const pvName of compiledFormula.getParameters()) {
            this.createPV(pvName);
            this.registerFormulaTriggers(pvName, compiledFormula);
        }
    }

    private registerFormulaTriggers(pvName: string, formula: CompiledFormula) {
        const formulas = this.formulasByTrigger.get(pvName);
        if (formulas) {
            formulas.push(formula);
        } else {
            this.formulasByTrigger.set(pvName, [formula]);
        }
    }
}
