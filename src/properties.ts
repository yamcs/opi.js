import { ActionSet } from "./actions";
import { Color } from "./Color";
import { ColorMap } from "./ColorMap";
import { Font } from "./Font";
import { MacroSet } from "./macros";
import { Point } from "./positioning";
import { RuleSet } from "./rules";
import { AutoScaleWidgets, ScaleOptions } from "./scale";
import { ScriptSet } from "./scripts";
import { Widget } from "./Widget";
import { XMLNode } from "./XMLNode";

export type PropertyGenerator = () => Property<any>[];

export class PropertySet {
  private properties = new Map<string, Property<any>>();
  private generators: PropertyGenerator[] = [];

  constructor(private widget: Widget | null, properties: Property<any>[] = []) {
    for (const property of properties) {
      this.properties.set(property.name, property);
    }
  }

  clear() {
    this.properties.clear();
  }

  add(property: Property<any>) {
    this.properties.set(property.name, property);
  }

  /**
   * Add a property generator. Generators can access the effective
   * value of static properties to determine property names.
   */
  addGenerator(generator: PropertyGenerator) {
    this.generators.push(generator);
  }

  all() {
    return [...this.properties.values()];
  }

  private loadProperty(node: XMLNode, property: Property<any>) {
    if (node.hasNode(property.name)) {
      if (property instanceof ActionsProperty) {
        property.value = node.getActions(property.name);
      } else if (property instanceof AutoScaleWidgetsProperty) {
        property.value = node.getAutoScaleWidgets(property.name);
      } else if (property instanceof BooleanProperty) {
        property.value = node.getBoolean(property.name);
      } else if (property instanceof ColorMapProperty) {
        property.value = node.getColorMap(property.name);
      } else if (property instanceof ColorProperty) {
        property.value = node.getColor(property.name);
      } else if (property instanceof FloatProperty) {
        property.value = node.getFloat(property.name);
      } else if (property instanceof FontProperty) {
        property.value = node.getFont(property.name);
      } else if (property instanceof IntProperty) {
        property.value = node.getInt(property.name);
      } else if (property instanceof MacrosProperty) {
        property.value = node.getMacros(property.name);
      } else if (property instanceof PointsProperty) {
        property.value = node.getPoints(property.name);
      } else if (property instanceof PVValueProperty) {
        // Value determined when needed.
      } else if (property instanceof RulesProperty) {
        property.value = node.getRules(property.name);
      } else if (property instanceof ScaleOptionsProperty) {
        property.value = node.getScaleOptions(property.name);
      } else if (property instanceof ScriptsProperty) {
        property.value = node.getScripts(property.name);
      } else if (property instanceof StringProperty) {
        // The non-raw value is set below (after reading in other properties)
        (property as StringProperty).rawValue = node.getString(property.name);
      } else if (property instanceof StringListProperty) {
        property.value = node.getStringList(property.name);
      } else if (property instanceof StringMapProperty) {
        property.value = node.getStringMap(property.name);
      } else if (property instanceof StringTableProperty) {
        property.value = node.getStringTable(property.name);
      } else {
        throw new Error(`Property ${property.name} has an unexpected type`);
      }
    }
  }

  loadXMLValues(node: XMLNode) {
    this.properties.forEach((property) => {
      this.loadProperty(node, property);
    });

    // Do this a first time, so that string properties
    // are available to generators (e.g. wuid).
    this.resolveStringProperties();

    for (const generator of this.generators) {
      for (const property of generator()) {
        this.properties.set(property.name, property);
        this.loadProperty(node, property);
      }
    }
    this.resolveStringProperties();
  }

  private resolveStringProperties() {
    // Expand macros only after reading in all properties
    // (we need the values of other properties)
    for (let i = 0; i < 2; i++) {
      // Twice, in case properties depend on each other.
      this.properties.forEach((property) => {
        if (property instanceof StringProperty) {
          const stringProperty = property as StringProperty;
          if (stringProperty.rawValue !== undefined && this.widget) {
            property.value = this.widget.expandMacro(stringProperty.rawValue);
          } else {
            property.value = stringProperty.rawValue;
          }
        }
      });
    }
  }

  getProperty(propertyName: string) {
    return this.properties.get(propertyName);
  }

  getValue(propertyName: string, optional = false) {
    const prop = this.properties.get(propertyName);
    if (prop && prop.value !== undefined) {
      return prop.value;
    } else {
      if (!optional) {
        throw new Error(`Missing property ${propertyName}`);
      }
    }
  }

  setValue(propertyName: string, value: any) {
    const prop = this.properties.get(propertyName);
    if (!prop) {
      throw new Error(`Cannot set value of unknown property ${propertyName}`);
    }
    prop.value = value;
  }
}

export abstract class Property<T> {
  private _value?: T;
  private listeners?: PropertyListener<T>[];

  constructor(readonly name: string, readonly defaultValue?: T) {
    this.value = defaultValue;
  }

  get value(): T | undefined {
    return this._value;
  }
  set value(value: T | undefined) {
    if (this.value !== value) {
      const oldValue = this._value;
      this._value = value;
      if (this.listeners) {
        for (const listener of this.listeners) {
          listener(value, oldValue);
        }
      }
    }
  }

  addListener(listener: PropertyListener<T>) {
    this.listeners = this.listeners || [];
    this.listeners.push(listener);
  }

  removeListener(listener: PropertyListener<T>) {
    const listeners = this.listeners || [];
    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  }

  printScriptValue(value: T) {
    return String(value);
  }
}

export type PropertyListener<T> = (newValue?: T, oldValue?: T) => void;

export class StringProperty extends Property<string> {
  /**
   * Has macros unexpanded
   */
  rawValue?: string;

  printScriptValue(value: String) {
    return `"${value.replace('"', '\\"')}"`;
  }
}

export class PVValueProperty extends Property<any> {
  constructor(name: string, readonly pvPropertyName: string) {
    super(name);
  }
}

export class IntProperty extends Property<number> { }

export class FloatProperty extends Property<number> { }

export class BooleanProperty extends Property<boolean> { }

export class ColorProperty extends Property<Color> {
  printScriptValue(value: Color) {
    const { red, green, blue } = { ...value };
    return `ColorFontUtil.getColorFromRGB(${red}, ${green}, ${blue})`;
  }
}

export class FontProperty extends Property<Font> {
  printScriptValue(value: Font) {
    const { name, height, style } = { ...value };
    return `ColorFontUtil.getFont("${name}", ${height}, ${style})`;
  }
}

export class ColorMapProperty extends Property<ColorMap> {
  printScriptValue(value: ColorMap) {
    return `${value.code}`;
  }
}

export class PointsProperty extends Property<Point[]> { }

export class ActionsProperty extends Property<ActionSet> { }

export class MacrosProperty extends Property<MacroSet> { }

export class ScriptsProperty extends Property<ScriptSet> { }

export class StringListProperty extends Property<string[]> { }

export class StringMapProperty extends Property<{ [key: string]: string }> { }

export class StringTableProperty extends Property<string[][]> { }

export class RulesProperty extends Property<RuleSet> { }

export class ScaleOptionsProperty extends Property<ScaleOptions> { }

export class AutoScaleWidgetsProperty extends Property<AutoScaleWidgets> { }
