import { Display } from '../../Display';
import { MacroSet } from '../../macros';
import { MacrosProperty } from '../../properties';
import { Widget } from '../../Widget';
import { Connection } from './Connection';

const PROP_MACROS = 'macros';

export abstract class AbstractContainerWidget extends Widget {

    _widgets: Widget[] = [];
    _connections: Connection[] = [];

    constructor(display: Display, parent?: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new MacrosProperty(PROP_MACROS));
    }

    expandContainerMacros(text: string): string {
        for (const key in this.macros.macros) {
            // Both ${pv_name} and $(pv_name) notations are accepted
            text = text.replace(`$(${key})`, this.macros.macros[key]);
            text = text.replace(`\${${key}}`, this.macros.macros[key]);
        }

        if (this.parent && this.macros.includeParentMacros) {
            text = this.parent.expandContainerMacros(text);
        }
        return text;
    }

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

    closeMenu() {
        for (const widget of this.widgets) {
            widget.closeMenu();
        }
    }

    destroy() {
        for (const widget of this.widgets) {
            widget.destroy();
        }
    }

    // Exposed as properties to make it easier to override them
    // (used by Linkingcontainer)
    get widgets() { return this._widgets; }
    get connections() { return this._connections; }
    get macros(): MacroSet { return this.properties.getValue(PROP_MACROS); }
}
