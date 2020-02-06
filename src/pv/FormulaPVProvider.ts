import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';
import { PV } from './PV';
import { PVProvider } from './PVProvider';

export class FormulaPVProvider implements PVProvider {

    private pvs = new Map<string, FormulaPV>();

    canProvide(pvName: string) {
        return pvName.startsWith('=');
    }

    startProviding(pvs: PV[]) {
        for (const pv of pvs) {
            this.pvs.set(pv.name, new FormulaPV(pv));
        }
    }

    stopProviding(pvs: PV[]) {
        for (const pv of pvs) {
            this.pvs.delete(pv.name);
        }
    }

    isNavigable() {
        return false;
    }

    shutdown() {
    }
}

class FormulaPV {

    compiledFormula: CompiledFormula;

    constructor(readonly pv: PV) {
        const compiler = new FormulaCompiler();
        this.compiledFormula = compiler.compile(pv.name);
        for (const pvName of this.compiledFormula.getPVNames()) {
            const pvDependency = pv.pvEngine.createPV(pvName);
            this.compiledFormula.updateDataSource(pvDependency.name, {
                value: pvDependency.value,
                acquisitionStatus: 'good', // TODO ?
            });
            pv.pvEngine.addListener(pvName, () => {
                this.compiledFormula.updateDataSource(pvName, {
                    value: pv.pvEngine.getValue(pvName),
                    acquisitionStatus: 'good', // TODO ?
                });
                this.trigger();
            });
        }
        this.trigger();
    }

    trigger() {
        const result = this.compiledFormula.execute();
        this.pv.pvEngine.setValue(new Date(), this.pv.name, result);
    }
}
