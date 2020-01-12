import { ScriptEngine } from '../scripting/ScriptEngine';
import { Script } from '../scripts';
import { Widget } from '../Widget';
import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';
import { LocalPV } from './LocalPV';
import { PV } from './PV';
import { SimulatedPV } from './SimulatedPV';

export class PVEngine {

    private formulas = new Map<string, CompiledFormula>();
    private formulasByTrigger = new Map<string, CompiledFormula[]>();
    private scripts: ScriptInstance[] = [];
    private scriptsByTrigger = new Map<string, ScriptInstance[]>();
    private pvs = new Map<string, PV<any>>();
    private simulatedPvs: SimulatedPV[] = [];

    private changed = false;

    step(t: number): boolean {
        const triggeredScripts = [];

        let wasChanged = this.changed;
        for (const pv of this.simulatedPvs) {
            const pvChanged = pv.step(t);
            if (pvChanged) {
                for (const script of this.scriptsByTrigger.get(pv.name) || []) {
                    triggeredScripts.push(script);
                }
            }
            wasChanged = wasChanged || pvChanged;
        }

        if (triggeredScripts.length) {
            for (const script of triggeredScripts) {
                script.scriptEngine.run();
            }
        }

        this.changed = false;
        return wasChanged;
    }

    reset() {
        this.formulas.clear();
        this.formulasByTrigger.clear();
        this.pvs.clear();
        this.simulatedPvs = [];
        this.scripts = [];
        this.scriptsByTrigger.clear();
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
            return pv;
        } else if (pvName === 'sys://time' || pvName.startsWith('sim://')) {
            pv = new SimulatedPV(pvName);
            this.pvs.set(pvName, pv);
            this.simulatedPvs.push(pv as SimulatedPV);
            return pv;
        } else if (pvName.startsWith('=')) {
            this.createFormula(pvName);
            return new LocalPV(pvName); // TODO
        } else {
            throw new Error(`Unsupported PV ${pvName}`);
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

    createScript(widget: Widget, model: Script, scriptText: string) {
        const pvs = [];
        for (const input of model.inputs) {
            pvs.push(this.createPV(input.pvName));
        }
        const script = new ScriptInstance(widget, model, scriptText, pvs);
        this.scripts.push(script);
        for (const input of model.inputs) {
            if (input.trigger) {
                this.registerScriptTriggers(input.pvName, script);
            }
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

    private registerScriptTriggers(pvName: string, script: ScriptInstance) {
        const scripts = this.scriptsByTrigger.get(pvName);
        if (scripts) {
            scripts.push(script);
        } else {
            this.scriptsByTrigger.set(pvName, [script]);
        }
    }
}

class ScriptInstance {

    scriptEngine: ScriptEngine;

    constructor(readonly widget: Widget, readonly script: Script, readonly text: string, pvs: PV<any>[]) {
        this.scriptEngine = new ScriptEngine(widget, text, pvs);
    }
}
