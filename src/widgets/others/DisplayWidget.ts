import { Color } from '../../Color';
import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { MacroSet } from '../../macros';
import { ColorProperty, FloatProperty, MacrosProperty, RulesProperty, ScriptsProperty, StringProperty } from '../../properties';
import { RuleSet } from '../../rules';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { Connection } from './Connection';

const PROP_BACKGROUND_COLOR = 'background_color';
const PROP_FOREGROUND_COLOR = 'foreground_color';
const PROP_HEIGHT = 'height';
const PROP_WIDTH = 'width';
const PROP_MACROS = 'macros';
const PROP_NAME = 'name';
const PROP_RULES = 'rules';
const PROP_SCRIPTS = 'scripts';

export class DisplayWidget extends AbstractContainerWidget {

    constructor(display: Display) {
        super(display);
        this.properties.clear();
        this.properties.add(new FloatProperty(PROP_WIDTH));
        this.properties.add(new FloatProperty(PROP_HEIGHT));
        this.properties.add(new ColorProperty(PROP_BACKGROUND_COLOR));
        this.properties.add(new ColorProperty(PROP_FOREGROUND_COLOR));
        this.properties.add(new MacrosProperty(PROP_MACROS));
        this.properties.add(new StringProperty(PROP_NAME));
        this.properties.add(new RulesProperty(PROP_RULES, new RuleSet()));
        this.properties.add(new ScriptsProperty(PROP_SCRIPTS));
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);

        for (const widgetNode of node.getNodes('widget')) {
            const kind = widgetNode.getStringAttribute('typeId');
            const widget = this.display.createWidget(kind);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
        for (const connectionNode of node.getNodes('connection')) {
            const connection = new Connection(this.display);
            connection.parseNode(connectionNode);
            this.connections.push(connection);
        }
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        for (const widget of this.widgets) {
            widget.drawHolder(g);
            widget.draw(g, hitCanvas);
            widget.drawDecoration(g);
        }
        for (const connection of this.connections) {
            connection.draw(g);
        }
    }

    get backgroundColor(): Color { return this.properties.getValue(PROP_BACKGROUND_COLOR); }
    get foregroundColor(): Color { return this.properties.getValue(PROP_FOREGROUND_COLOR); }
    get preferredWidth(): number { return this.properties.getValue(PROP_WIDTH); }
    get preferredHeight(): number { return this.properties.getValue(PROP_HEIGHT); }
    get macros(): MacroSet { return this.properties.getValue(PROP_MACROS); }
}
