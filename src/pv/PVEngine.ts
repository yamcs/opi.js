import { StringProperty } from '../properties';
import { Rule } from '../rules';
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
    private rules: RuleInstance[] = [];
    private rulesByTrigger = new Map<string, RuleInstance[]>();
    private scripts: ScriptInstance[] = [];
    private scriptsByTrigger = new Map<string, ScriptInstance[]>();
    private pvs = new Map<string, PV>();
    private simulatedPvs: SimulatedPV[] = [];

    private changed = false;

    step(t: number): boolean {
        const triggeredScripts = [];
        const triggeredRules = [];

        let wasChanged = this.changed;
        for (const pv of this.simulatedPvs) {
            const pvChanged = pv.step(t);
            if (pvChanged) {
                for (const script of this.scriptsByTrigger.get(pv.name) || []) {
                    triggeredScripts.push(script);
                }
                for (const rule of this.rulesByTrigger.get(pv.name) || []) {
                    triggeredRules.push(rule);
                }
            }
            wasChanged = wasChanged || pvChanged;
        }

        if (triggeredRules.length) {
            for (const rule of triggeredRules) {
                rule.scriptEngine.run();
            }
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
        this.rules = [];
        this.rulesByTrigger.clear();
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
        if (pvName.startsWith('loc://')) {
            return this.createLocalPV(pvName);
        }

        let pv = this.pvs.get(pvName);
        if (pv) {
            return pv;
        }

        if (pvName === 'sys://time' || pvName.startsWith('sim://')) {
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

    private createLocalPV(pvName: string) {
        const PV_PATTERN = /(loc\:\/\/[^\(]+)(\((.*)\))?/;
        const match = pvName.match(PV_PATTERN);
        let initializer;
        if (match) {
            pvName = match[1];
            if (match[3] !== undefined) {
                initializer = match[3];
            }
        }

        let pv = this.pvs.get(pvName);
        if (pv && (pv as LocalPV).initializer !== initializer) {
            console.warn(`PV ${pvName} is defined with different initializers.`);
        }
        if (!pv) {
            pv = new LocalPV(pvName, initializer);
            this.pvs.set(pvName, pv);
            if (initializer !== undefined) {
                this.setValue(pvName, initializer);
            }
        }
        return pv;
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
            const pvName = widget.expandMacro(input.pvName);
            pvs.push(this.createPV(pvName));
        }
        const script = new ScriptInstance(widget, model, scriptText, pvs);
        this.scripts.push(script);
        for (const input of model.inputs) {
            if (input.trigger) {
                const pvName = widget.expandMacro(input.pvName);
                this.registerScriptTriggers(pvName, script);
            }
        }
    }

    createRule(widget: Widget, model: Rule) {
        const pvs = [];
        for (const input of model.inputs) {
            const pvName = widget.expandMacro(input.pvName);
            pvs.push(this.createPV(pvName));
        }
        const rule = new RuleInstance(widget, model, pvs);
        this.rules.push(rule);
        for (const input of model.inputs) {
            if (input.trigger) {
                const pvName = widget.expandMacro(input.pvName);
                this.registerRuleTriggers(pvName, rule);
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

    private registerRuleTriggers(pvName: string, rule: RuleInstance) {
        const rules = this.rulesByTrigger.get(pvName);
        if (rules) {
            rules.push(rule);
        } else {
            this.rulesByTrigger.set(pvName, [rule]);
        }
    }
}

class ScriptInstance {

    scriptEngine: ScriptEngine;

    constructor(readonly widget: Widget, readonly script: Script, readonly text: string, pvs: PV[]) {
        this.scriptEngine = new ScriptEngine(widget, text, pvs);
    }
}

class RuleInstance {

    scriptEngine: ScriptEngine;

    constructor(readonly widget: Widget, readonly rule: Rule, pvs: PV[]) {
        let scriptText = '';
        const property = widget.properties.getProperty(rule.propertyName);
        if (!property) {
            throw new Error(`Cannot create rule for unsupported property ${rule.propertyName}`);
        }
        const quoteValues = property instanceof StringProperty;
        if (rule.expressions.length) {
            let usesDoubles = false;
            let usesInts = false;
            let usesStrings = false;
            let usesSeverities = false;
            for (const expr of rule.expressions) {
                if (expr.expression.match(/pv[0-9]+/)) {
                    usesDoubles = true;
                }
                if (rule.outputExpression && expr.outputValue.match(/pv[0-9]+/)) {
                    usesDoubles = true;
                }
                if (expr.expression.indexOf('pvInt') !== -1) {
                    usesInts = true;
                }
                if (rule.outputExpression && expr.outputValue.indexOf('pvInt') !== -1) {
                    usesInts = true;
                }
                if (expr.expression.indexOf('pvStr') !== -1) {
                    usesStrings = true;
                }
                if (rule.outputExpression && expr.outputValue.indexOf('pvStr') !== -1) {
                    usesStrings = true;
                }
                if (expr.expression.indexOf('pvSev') !== -1) {
                    usesSeverities = true;
                }
                if (rule.outputExpression && expr.outputValue.indexOf('pvSev') !== -1) {
                    usesSeverities = true;
                }
            }
            // This does not seem to make much sense, but it is ported as-is
            // from the desktop application.
            for (let i = 0; i < pvs.length; i++) {
                if (usesDoubles) {
                    scriptText += `var pv${i} = PVUtil.getDouble(pvs[${i}]);\n`;
                }
                if (usesInts) {
                    scriptText += `var pvInt${i} = PVUtil.getLong(pvs[${i}]);\n`;
                }
                if (usesStrings) {
                    scriptText += `var pvStr${i} = PVUtil.getString(pvs[${i}]);\n`;
                }
                if (usesSeverities) {
                    scriptText += `var pvSev${i} = PVUtil.getSeverity(pvs[${i}]);\n`;
                }
            }
            for (let i = 0; i < rule.expressions.length; i++) {
                const expr = rule.expressions[i].expression;
                const outputValue = rule.expressions[i].outputValue;
                if (i > 0) {
                    scriptText += 'else ';
                }
                scriptText += `if (${expr}) widget.setPropertyValue("${rule.propertyName}", `;
                if (rule.outputExpression || !quoteValues) {
                    scriptText += `${outputValue});\n`;
                } else {
                    scriptText += `"${outputValue}");\n`;
                }
            }
            const defaultValue = property.value;
            scriptText += `else widget.setPropertyValue("${rule.propertyName}", `;
            if (quoteValues) {
                scriptText += `"${defaultValue}");\n`;
            } else {
                scriptText += `${defaultValue});\n`;
            }
        }

        this.scriptEngine = new ScriptEngine(widget, scriptText, pvs);
    }
}
