import { ActionSet } from './actions';
import { Color } from './Color';
import { Display } from './Display';
import { Font } from './Font';
import { MacroSet } from './macros';
import { Point } from './positioning';
import { XMLNode } from './XMLNode';

export class PropertySet {

    private properties = new Map<string, Property<any>>();

    constructor(private parent: Display, properties: Property<any>[] = []) {
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

    all() {
        return this.properties.values();
    }

    loadXMLValues(node: XMLNode) {
        this.properties.forEach(property => {
            if (node.hasNode(property.name)) {
                if (property instanceof StringProperty) {
                    // The non-raw value is set below (after reading in other properties)
                    property.rawValue = node.getString(property.name);
                } else if (property instanceof IntProperty) {
                    property.value = node.getInt(property.name);
                } else if (property instanceof FloatProperty) {
                    property.value = node.getFloat(property.name);
                } else if (property instanceof BooleanProperty) {
                    property.value = node.getBoolean(property.name);
                } else if (property instanceof ColorProperty) {
                    property.value = node.getColor(property.name);
                } else if (property instanceof FontProperty) {
                    property.value = node.getFont(property.name);
                } else if (property instanceof ActionsProperty) {
                    property.value = node.getActions(property.name);
                } else if (property instanceof PointsProperty) {
                    property.value = node.getPoints(property.name);
                } else if (property instanceof MacrosProperty) {
                    property.value = node.getMacros(property.name);
                } else {
                    throw new Error(`Property ${property.name} has an unexpected type`);
                }
            }
        });

        // Expand macros only after reading in all properties
        // (we need the values of other properties)
        this.properties.forEach(property => {
            if (property instanceof StringProperty) {
                if (property.rawValue) {
                    property.value = this.expandMacro(property.rawValue);
                } else {
                    property.value = property.rawValue;
                }
            }
        });
    }

    expandMacro(macro: string) {
        if (macro.indexOf('$') === -1) {
            return macro;
        } else {
            let expanded = macro;
            for (const prop of this.properties.values()) {
                // Both ${pv_name} and $(pv_name) notations are accepted
                expanded = expanded.replace(`$(${prop.name})`, prop.value || '');
                expanded = expanded.replace(`\${${prop.name}}`, prop.value || '');
            }
            const parentWidget = this.parent.instance;
            if (parentWidget) {
                const macrosProperty = parentWidget.properties.getProperty('macros') as MacrosProperty;
                if (macrosProperty.value) {
                    expanded = macrosProperty.value.expandMacro(expanded);
                }
            }

            return expanded;
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
}

export abstract class Property<T> {

    value?: T;

    constructor(readonly name: string, readonly defaultValue?: T) {
        this.value = defaultValue;
    }
}

export class StringProperty extends Property<string> {
    /**
     * Has macros unexpanded
     */
    rawValue?: string;
}

export class IntProperty extends Property<number> {
}

export class FloatProperty extends Property<number> {
}

export class BooleanProperty extends Property<boolean> {
}

export class ColorProperty extends Property<Color> {
}

export class FontProperty extends Property<Font> {
}

export class PointsProperty extends Property<Point[]> {
}

export class ActionsProperty extends Property<ActionSet> {
}

export class MacrosProperty extends Property<MacroSet> {
}
