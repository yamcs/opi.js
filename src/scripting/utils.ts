import { Widget } from '../Widget';
import { WidgetWrapper } from './WidgetWrapper';
import { XYGraphWrapper } from './XYGraphWrapper';

export function wrapWidget(widget: Widget) {
    // Avoid importing specific widgets, because it result in a circular warning
    switch (widget.widgetType) {
        case 'XY Graph':
            return new XYGraphWrapper(widget as any);
        default:
            return new WidgetWrapper(widget);
    }
}