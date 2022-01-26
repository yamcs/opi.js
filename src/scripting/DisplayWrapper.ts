import { Display } from '../Display';
import { wrapWidget } from './utils';

export class DisplayWrapper {

    constructor(private display: Display) {
    }

    getWidget(name: string) {
        const widget = this.display.findWidgetByName(name);
        if (widget) {
            return wrapWidget(widget);
        }
    }
}
