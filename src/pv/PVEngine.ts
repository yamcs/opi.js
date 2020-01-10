import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';
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
            wasChanged = wasChanged || pv.step(t);
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

        if (pvName === 'sys://time' || pvName.startsWith('sim://')) {
            pv = new SimulatedPV(pvName);
            this.pvs.set(pvName, pv);
            this.simulatedPvs.push(pv as SimulatedPV);
            return pv;
        } else {
            console.warn(`Unsupported PV '${pvName}'`);
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
            pv.value = value;
        } else {
            throw new Error(`Cannot set value of unknown PV '${pvName}'`);
        }
    }

    createFormula(pvName: string) {
        if (!pvName.startsWith('=')) {
            throw new Error('Formulas must start with \'=\'');
        }

        let compiledFormula = this.formulas.get(name);
        if (!compiledFormula) {
            const compiler = new FormulaCompiler();
            compiledFormula = compiler.compile(pvName);
        }

        for (const parameter of compiledFormula.getParameters()) {
            this.registerFormulaTriggers(parameter, compiledFormula);
        }
    }

    private registerFormulaTriggers(qualifiedName: string, formula: CompiledFormula) {
        const formulas = this.formulasByTrigger.get(qualifiedName);
        if (formulas) {
            formulas.push(formula);
        } else {
            this.formulasByTrigger.set(qualifiedName, [formula]);
        }
    }
}
