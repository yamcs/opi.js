import { Display } from '../Display';
import { StringProperty } from '../properties';
import { Rule } from '../rules';
import { ScriptEngine } from '../scripting/ScriptEngine';
import { Script } from '../scripts';
import { Widget } from '../Widget';
import { CompiledFormula } from './formulas/CompiledFormula';
import { FormulaCompiler } from './formulas/FormulaCompiler';
import { LocalPV } from './LocalPV';
import { AlarmSeverity, PV, PVListener } from './PV';
import { PVProvider } from './PVProvider';
import { Sample } from './Sample';

const PV_PATTERN = /(loc\:\/\/[^\(]+)(\((.*)\))?/;

function stripInitializer(pvName: string) {
    if (!pvName.startsWith('loc://')) {
        return pvName;
    }
    const match = pvName.match(PV_PATTERN);
    return match ? match[1] : pvName;
}

export class PVEngine {

    private formulas = new Map<string, CompiledFormula>();
    private rules: RuleInstance[] = [];
    private scripts: ScriptInstance[] = [];
    private pvs = new Map<string, PV>();

    private providers: PVProvider[] = [];

    private listeners = new Map<string, PVListener[]>();

    constructor(private display: Display) {
    }

    clearState() {
        this.disconnectAll();
        this.rules = [];
        this.scripts = [];
        this.listeners.clear();
    }

    getPVNames() {
        return [... this.pvs.keys()];
    }

    hasPV(pvName: string) {
        const stripped = stripInitializer(pvName);
        return this.pvs.has(stripped);
    }

    getPV(pvName: string) {
        const stripped = stripInitializer(pvName);
        return this.pvs.get(stripped);
    }

    disconnectAll() {
        for (const provider of this.providers) {
            const toBeStopped = [];
            for (const pv of this.pvs.values()) {
                if (provider.canProvide(pv.name)) {
                    toBeStopped.push(pv);
                }
            }
            if (toBeStopped.length) {
                provider.stopProviding(toBeStopped);
            }
        }
        this.pvs.clear();
        this.formulas.clear();
    }

    createPV(pvName: string) {
        if (pvName.startsWith('loc://')) {
            return this.createLocalPV(pvName);
        }

        let pv = this.pvs.get(pvName);
        if (pv) {
            return pv;
        }

        if (pvName.startsWith('=')) {
            this.createFormula(pvName);
            return new LocalPV(pvName, this); // TODO
        }

        pv = new PV(pvName, this);
        this.pvs.set(pvName, pv);

        for (const provider of this.providers) {
            if (provider.canProvide(pvName)) {
                provider.startProviding([pv]);
                return pv;
            }
        }

        console.warn(`No provider for PV ${pvName}`);
        pv.disconnected = true;
        return pv;
    }

    requestRepaint() {
        this.display.requestRepaint();
    }

    private createLocalPV(pvName: string) {
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
            pv = new LocalPV(pvName, this, initializer);
            this.pvs.set(pvName, pv);
            if (initializer !== undefined) {
                this.setValue(new Date(), pvName, initializer);
            }
        }
        return pv;
    }

    getValue(pvName: string) {
        const stripped = stripInitializer(pvName);
        const pv = this.pvs.get(stripped);
        if (pv) {
            return pv.value;
        }
    }

    setValue(time: Date, pvName: string, value: any, severity = AlarmSeverity.NONE) {
        const stripped = stripInitializer(pvName);
        const pv = this.pvs.get(stripped);
        if (pv) {
            pv.setSample({ time, value, severity });
            for (const listener of this.listeners.get(pvName) || []) {
                listener();
            }
        } else {
            throw new Error(`Cannot set value of unknown PV ${pvName}`);
        }
    }

    setValues(samples: Map<string, Sample>) {
        // Bundle triggers so that if a listener is listening to
        // multiple received PVs, it only triggers once (i.e. scripts).
        const triggeredListeners: PVListener[] = [];

        for (const pvName of samples.keys()) {
            const pv = this.pvs.get(pvName);
            if (pv) {
                pv.setSample(samples.get(pvName)!);
                for (const listener of this.listeners.get(pvName) || []) {
                    triggeredListeners.push(listener);
                }
            } else {
                console.warn(`Received an update for unknown pv ${pvName}`);
            }
        }

        for (const listener of triggeredListeners) {
            listener();
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

        const listener = () => script.scriptEngine.run();

        for (const input of model.inputs) {
            if (input.trigger) {
                const pvName = widget.expandMacro(input.pvName);
                this.addListener(pvName, listener);
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

        const listener = () => rule.scriptEngine.run();

        for (const input of model.inputs) {
            if (input.trigger) {
                const pvName = widget.expandMacro(input.pvName);
                this.addListener(pvName, listener);
            }
        }
    }

    private createFormula(pvName: string) {
        let compiledFormula = this.formulas.get(pvName);
        if (!compiledFormula) {
            const compiler = new FormulaCompiler();
            compiledFormula = compiler.compile(pvName);
        }

        const listener = () => compiledFormula?.execute();

        for (const pvName of compiledFormula.getParameters()) {
            this.createPV(pvName);
            this.addListener(pvName, listener);
        }
    }

    addProvider(provider: PVProvider) {
        this.providers.push(provider);
    }

    addListener(pvName: string, listener: PVListener) {
        const listeners = this.listeners.get(pvName);
        if (listeners) {
            listeners.push(listener);
        } else {
            this.listeners.set(pvName, [listener]);
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
