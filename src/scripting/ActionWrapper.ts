import { Action } from '../actions/Action';
import { StringProperty } from '../properties';
import { Widget } from '../Widget';

/**
 * Exposes the API for actions as used in display scripts.
 */
export class ActionWrapper {

    constructor(private action: Action, private widget: Widget) {
    }

    getPropertyValue(propertyName: string) {
        const property = this.action.properties.getProperty(propertyName);
        return property ? property.value : null;
    }

    setPropertyValue(propertyName: string, value: any) {
        const property = this.action.properties.getProperty(propertyName);
        if (!property) {
            throw new Error(`Cannot set value of unknown property ${propertyName}`);
        }

        if (property instanceof StringProperty) {
            value = (value !== undefined) ? String(value) : value;
            this.action.properties.setValue(propertyName, value);
        } else {
            this.action.properties.setValue(propertyName, value);
        }

        this.widget.requestRepaint();
    }
}
