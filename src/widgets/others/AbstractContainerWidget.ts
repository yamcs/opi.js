import { Widget } from '../../Widget';
import { Connection } from './Connection';

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

    findWidgetByName(name: string): Widget | undefined {
        for (const widget of this.widgets) {
            if (widget.name === name) {
                return widget;
            } else if (widget instanceof AbstractContainerWidget) {
                const match = widget.findWidgetByName(name);
                if (match) {
                    return match;
                }
            }
        }
        for (const connection of this.connections) {
            if (connection.name === name) {
                return connection;
            }
        }
    }

    // Exposed as properties to make it easier to override them
    // (used by Linkingcontainer)
    get widgets() { return this._widgets };
    get connections() { return this._connections };
}
