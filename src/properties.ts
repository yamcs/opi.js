import { ActionSet } from './actions';
import { Color } from './Color';
import { Font } from './Font';
import { Point } from './Point';
import { XMLNode } from './XMLParser';

export class PropertySet {

    private properties = new Map<string, Property<any>>();

    constructor(properties: Property<any>[] = []) {
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

    loadXMLValues(node: XMLNode) {
        this.properties.forEach(property => {
            if (node.hasNode(property.name)) {
                if (property instanceof StringProperty) {
                    property.value = node.getString(property.name);
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
                } else {
                    throw new Error(`Property ${property.name} has an unexpected type`);
                }
            }
        });
    }

    getValue(propertyName: string, optional = false) {
        const prop = this.properties.get(propertyName);
        if (prop && prop.value !== undefined) {
            return prop.value;
        } else {
            if (!optional) {
                throw new Error(`Missing property ${propertyName} for connection`);
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
