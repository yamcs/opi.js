import { Connection } from '../../Connection';
import { Widget } from '../../Widget';

export abstract class AbstractContainerWidget extends Widget {

    widgets: Widget[] = [];
    connections: Connection[] = [];

    findWidget(wuid: string): Widget | undefined {
        for (const widget of this.widgets) {
            if (widget.wuid === wuid) {
                return widget;
            } else if (widget instanceof AbstractContainerWidget) {
                const match = (widget as AbstractContainerWidget).findWidget(wuid);
                if (match) {
                    return match;
                }
            }
        }
    }
}
