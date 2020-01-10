import { Connection } from '../../Connection';
import { Widget } from '../../Widget';

export abstract class AbstractContainerWidget extends Widget {

    _widgets: Widget[] = [];
    _connections: Connection[] = [];

    findWidget(wuid: string): Widget | undefined {
        for (const widget of this.widgets) {
            if (widget.wuid === wuid) {
                return widget;
            } else if (widget instanceof AbstractContainerWidget) {
                const match = widget.findWidget(wuid);
                if (match) {
                    return match;
                }
            }
        }
    }

    // Exposed as properties to make it easier to override them
    // (used by Linkingcontainer)
    get widgets() { return this._widgets };
    get connections() { return this._connections };
}
