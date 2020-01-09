import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';

export class PVEngine {

    private formulas = new Map<string, CompiledFormula>();
    private formulasByTrigger = new Map<string, CompiledFormula[]>();
    private values = new Map<string, any>();

    reset() {
        this.formulas.clear();
        this.formulasByTrigger.clear();
        this.values.clear();
    }

    getValue(pvName: string) {
        return this.values.get(pvName);
    }

    setValue(pvName: string, value: any) {
        this.values.set(pvName, value);
        console.log(this.values);
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
