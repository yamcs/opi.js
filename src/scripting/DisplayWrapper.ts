import { Display } from '../Display';
import { WidgetWrapper } from './WidgetWrapper';

export class DisplayWrapper {

    constructor(private display: Display) {
    }

    getWidget(name: string) {
        const widget = this.display.findWidgetByName(name);
        if (widget) {
            return new WidgetWrapper(widget);
        }
    }
}
