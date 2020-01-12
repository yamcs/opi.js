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
        console.log('request to set property', propertyName, 'to', value);
        const level = Math.floor(Math.random() * 100);
        this.widget.properties.setValue('gradient', true);
        this.widget.properties.setValue('horizontal_fill', false);
        this.widget.properties.setValue('fill_level', level);
        this.widget.requestRepaint();
    }
}
