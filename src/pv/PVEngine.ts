import { Display } from "../Display";
import { Property } from "../properties";
import { Rule } from "../rules";
import { ScriptEngine } from "../scripting/ScriptEngine";
import { Script } from "../scripts";
import { Widget } from "../Widget";
import { LocalPV, LocalPVType } from "./LocalPV";
import { AlarmSeverity, PV, PVListener } from "./PV";
import { PVProvider } from "./PVProvider";
import { Sample } from "./Sample";

const PV_PATTERN = /(loc\:\/\/[^\(<]+)(<(.*)>)?(\((.*)\))?/;

function stripInitializer(pvName: string) {
  if (!pvName.startsWith("loc://")) {
    return pvName;
  }
  const match = pvName.match(PV_PATTERN);
  return match ? match[1] : pvName;
}

export class PVEngine {
  private rules: RuleInstance[] = [];
  private scripts: ScriptInstance[] = [];
  private pvs = new Map<string, PV>();

  private providers: PVProvider[] = [];
  readonly scriptLibraries: { [key: string]: any } = {};

  private listeners = new Map<string, PVListener[]>();

  constructor(private display: Display) { }

  /**
   * To be called following display parse.
   * It triggers an update on all listeners whose PV already has
   * a value (for example because of loc initializer or formula).
   *
   * It is important to do this after the full display is parsed,
   * because some scripts may require the presence of certain
   * widgets.
   */
  init() {
    for (const entry of this.listeners.entries()) {
      const pv = this.pvs.get(entry[0]);
      if (pv && pv.value !== null && pv.value !== undefined) {
        for (const listener of entry[1]) {
          listener();
        }
      }
    }
  }

  clearState() {
    this.disconnectAll();
    this.rules = [];
    this.scripts = [];
    this.listeners.clear();
  }

  getPVNames() {
    return [...this.pvs.keys()];
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
  }

  createPV(pvName: string) {
    if (pvName.startsWith("loc://")) {
      return this.createLocalPV(pvName);
    }

    let pv = this.pvs.get(pvName);
    if (pv) {
      return pv;
    }

    pv = new PV(pvName, this);
    this.pvs.set(pvName, pv);

    for (const provider of this.providers) {
      if (provider.canProvide(pvName)) {
        pv.navigable = provider.isNavigable();
        provider.startProviding([pv]);
        return pv;
      }
    }

    console.warn(`No provider for PV ${pvName}`);
    pv.disconnected = true;
    return pv;
  }

  createHistoricalDataProvider(pvName: string, widget: Widget) {
    for (const provider of this.providers) {
      if (provider.canProvide(pvName)) {
        if (provider.createHistoricalDataProvider) {
          return provider.createHistoricalDataProvider(pvName, widget);
        } else {
          break;
        }
      }
    }
  }

  requestRepaint() {
    this.display.requestRepaint();
  }

  private createLocalPV(pvName: string) {
    const match = pvName.match(PV_PATTERN);
    let type: LocalPVType | undefined = undefined;
    let initializer: any;
    if (match) {
      pvName = match[1];
      if (match[3]) {
        switch (match[3]) {
          case "VDouble":
          case "VDoubleArray":
          case "VString":
          case "VStringArray":
            type = match[3];
            break;
          default:
            console.warn(`Unknown local PV type information: ${match[3]}`);
        }
      }

      if (match[5] !== undefined) {
        const spec = match[5];
        if (spec.startsWith('"') && spec.endsWith('"')) {
          initializer = spec.substring(1, spec.length - 1);
        } else if (spec.indexOf(",") !== -1) {
          initializer = spec.split(",").map((part) => {
            const trimmed = part.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              return trimmed.substring(1, trimmed.length - 1);
            } else {
              return Number(trimmed);
            }
          });
        } else {
          initializer = Number(spec);
        }
      }
    }

    let pv = this.pvs.get(pvName);
    let mayInitialize = false;
    if (pv) {
      const localPV = pv as LocalPV;
      if (localPV.type && type && localPV.type !== type) {
        console.warn(
          `PV ${pvName} is defined with different ` +
          `types: ${localPV.type} !== ${type}`
        );
      }
      if (
        localPV.initializer !== undefined &&
        initializer !== undefined &&
        !this.initializerEquals(localPV.initializer, initializer)
      ) {
        console.warn(
          `PV ${pvName} is defined with different ` +
          `initializers: ${localPV.initializer} !== ${initializer}`
        );
      } else if (
        localPV.initializer === undefined &&
        initializer !== undefined
      ) {
        mayInitialize = true;
      }
    }
    if (!pv) {
      pv = new LocalPV(pvName, this, type, initializer);
      this.pvs.set(pvName, pv);
      mayInitialize = true;
    } else if (type && !(pv as LocalPV).type) {
      (pv as LocalPV).type = type;
    }

    if (mayInitialize && initializer !== undefined) {
      this.setValue(new Date(), pvName, initializer);
    }
    return pv;
  }

  private initializerEquals(a: any, b: any) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    } else {
      return a === b;
    }
  }

  getValue(pvName: string) {
    const stripped = stripInitializer(pvName);
    const pv = this.pvs.get(stripped);
    if (pv) {
      return pv.value;
    }
  }

  setValue(
    time: Date,
    pvName: string,
    value: any,
    severity = AlarmSeverity.NONE
  ) {
    const stripped = stripInitializer(pvName);
    const pv = this.pvs.get(stripped);
    if (pv) {
      pv.setSample({ time, value, severity });
      for (const listener of this.listeners.get(stripped) || []) {
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
    const pvs: PV[] = [];
    for (const input of model.inputs) {
      const pvName = widget.expandMacro(input.pvName);
      pvs.push(this.createPV(pvName));
    }
    const script = new ScriptInstance(widget, model, scriptText, pvs);
    this.scripts.push(script);

    for (let i = 0; i < model.inputs.length; i++) {
      const input = model.inputs[i];
      const triggerPV = pvs[i];
      if (input.trigger) {
        const pvName = widget.expandMacro(input.pvName);
        this.addListener(
          pvName,
          () => {
            if (model.checkConnect) {
              for (let j = 0; j < model.inputs.length; j++) {
                const pv = pvs[j];
                const isTrigger = model.inputs[j].trigger;
                const hasValue = pv.value !== null && pv.value !== undefined;
                if (pv.disconnected || (isTrigger && !hasValue)) {
                  return;
                }
              }
            }
            script.scriptEngine.run(triggerPV);
          },
          false
        );
      }
    }

    return script;
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
        this.addListener(pvName, listener, false);
      }
    }
  }

  addProvider(provider: PVProvider) {
    this.providers.push(provider);
  }

  addScriptLibrary(name: string, library: any) {
    this.scriptLibraries[name] = library;
  }

  addListener(pvName: string, listener: PVListener, mayTriggerNow = true) {
    const stripped = stripInitializer(pvName);
    const listeners = this.listeners.get(stripped);
    if (listeners) {
      listeners.push(listener);
    } else {
      this.listeners.set(stripped, [listener]);
    }

    // We don't want this always. For example during initial setup
    // this should not trigger, because some scripts may rely on all
    // widgets being initialized already.
    if (mayTriggerNow) {
      const pv = this.pvs.get(stripped);
      if (pv && pv.value !== null && pv.value !== undefined) {
        listener();
      }
    }
  }

  removeListener(pvName: string, listener: PVListener) {
    const stripped = stripInitializer(pvName);
    const listeners = this.listeners.get(stripped);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    }
  }
}

class ScriptInstance {
  scriptEngine: ScriptEngine;

  constructor(
    readonly widget: Widget,
    readonly script: Script,
    readonly text: string,
    readonly pvs: PV[]
  ) {
    this.scriptEngine = new ScriptEngine(widget, text, pvs);
  }
}

class RuleInstance {
  scriptEngine: ScriptEngine;

  constructor(readonly widget: Widget, readonly rule: Rule, pvs: PV[]) {
    let scriptText = "";
    const property = widget.properties.getProperty(rule.propertyName);
    if (!property) {
      throw new Error(
        `Cannot create rule for unsupported property ${rule.propertyName}`
      );
    }
    if (rule.expressions.length) {
      let usesDoubles = false;
      let usesInts = false;
      let usesStrings = false;
      let usesSeverities = false;
      for (const expr of rule.expressions) {
        if (expr.expression.match(/pv[0-9]+/)) {
          usesDoubles = true;
        }
        if (
          rule.outputExpression &&
          expr.outputValue.toString().match(/pv[0-9]+/)
        ) {
          usesDoubles = true;
        }
        if (expr.expression.indexOf("pvInt") !== -1) {
          usesInts = true;
        }
        if (
          rule.outputExpression &&
          expr.outputValue.toString().indexOf("pvInt") !== -1
        ) {
          usesInts = true;
        }
        if (expr.expression.indexOf("pvStr") !== -1) {
          usesStrings = true;
        }
        if (
          rule.outputExpression &&
          expr.outputValue.toString().indexOf("pvStr") !== -1
        ) {
          usesStrings = true;
        }
        if (expr.expression.indexOf("pvSev") !== -1) {
          usesSeverities = true;
        }
        if (
          rule.outputExpression &&
          expr.outputValue.toString().indexOf("pvSev") !== -1
        ) {
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
          scriptText += "else ";
        }
        scriptText += `if (${expr}) widget.setPropertyValue("${rule.propertyName}", `;
        if (rule.outputExpression) {
          scriptText += `${outputValue});\n`;
        } else {
          const outputValueStr = this.printScriptValue(property, outputValue);
          scriptText += `${outputValueStr});\n`;
        }
      }
      const defaultValue = property.value;
      const defaultValueStr = this.printScriptValue(property, defaultValue);
      scriptText += `else widget.setPropertyValue("${rule.propertyName}", `;
      scriptText += `${defaultValueStr});\n`;
    }

    this.scriptEngine = new ScriptEngine(widget, scriptText, pvs);
  }

  private printScriptValue(property: Property<any>, value: any) {
    if (value === null || value === undefined) {
      return "null";
    } else {
      return property.printScriptValue(value);
    }
  }
}
