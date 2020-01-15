import { StringProperty } from '../properties';
import { Widget } from '../Widget';

/**
 * Exposes the API for the variable "widget" as used in display scripts.
 */
export class WidgetWrapper {

    constructor(private widget: Widget) {
    }

    getPropertyValue(propertyName: string) {
        const property = this.widget.properties.getProperty(propertyName);
        return property ? property.value : null;
    }

    setPropertyValue(propertyName: string, value: any) {
        const property = this.widget.properties.getProperty(propertyName);
        if (!property) {
            throw new Error(`Cannot set value of unknown property ${propertyName}`);
        }

        if (property instanceof StringProperty) {
            value = (value !== undefined) ? String(value) : value;
            this.widget.properties.setValue(propertyName, value);
        } else {
            this.widget.properties.setValue(propertyName, value);
        }

        this.widget.requestRepaint();
    }
}
