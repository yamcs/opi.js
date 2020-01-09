import { Color } from './Color';
import { Connection } from './Connection';
import * as constants from './constants';
import { Display } from './Display';
import { HitCanvas } from './HitCanvas';
import * as utils from './utils';
import { Widget } from './Widget';
import { ActionButton } from './widgets/controls/ActionButton';
import { BooleanButton } from './widgets/controls/BooleanButton';
import { BooleanSwitch } from './widgets/controls/BooleanSwitch';
import { Arc } from './widgets/graphics/Arc';
import { Ellipse } from './widgets/graphics/Ellipse';
import { ImageWidget } from './widgets/graphics/ImageWidget';
import { Label } from './widgets/graphics/Label';
import { Polygon } from './widgets/graphics/Polygon';
import { Polyline } from './widgets/graphics/Polyline';
import { Rectangle } from './widgets/graphics/Rectangle';
import { RoundedRectangle } from './widgets/graphics/RoundedRectangle';
import { LED } from './widgets/monitors/LED';
import { TextUpdate } from './widgets/monitors/TextUpdate';
import { LinkingContainer } from './widgets/others/LinkingContainer';

export class DisplayInstance {

    readonly backgroundColor: Color;
    readonly preferredWidth: number;
    readonly preferredHeight: number;
    readonly gridColor: Color;

    widgets: Widget[] = [];
    connections: Connection[] = [];

    constructor(private display: Display, source: string) {
        const xmlParser = new DOMParser();
        const doc = xmlParser.parseFromString(source, 'text/xml') as XMLDocument;

        const displayEl = doc.getElementsByTagName('display')[0];
        this.preferredWidth = utils.parseFloatChild(displayEl, 'width');
        this.preferredHeight = utils.parseFloatChild(displayEl, 'height');

        const bgNode = utils.findChild(displayEl, 'background_color');
        this.backgroundColor = utils.parseColorChild(bgNode, Color.WHITE);

        const fgNode = utils.findChild(displayEl, 'foreground_color');
        this.gridColor = utils.parseColorChild(fgNode);

        for (const widgetNode of utils.findChildren(displayEl, 'widget')) {
            const kind = utils.parseStringAttribute(widgetNode, 'typeId');
            const widget = this.createWidget(kind);
            if (widget) {
                widget.parseNode(widgetNode);
                this.widgets.push(widget);
            }
        }
        for (const connectionNode of utils.findChildren(displayEl, 'connection')) {
            this.connections.push(new Connection(connectionNode, display));
        }
    }

    draw(ctx: CanvasRenderingContext2D, hitCanvas: HitCanvas) {
        for (const widget of this.widgets) {
            widget.drawHolder(ctx, hitCanvas);
            widget.draw(ctx, hitCanvas);
        }
        for (const connection of this.connections) {
            connection.draw(ctx);
        }
    }

    createWidget(kind: string) {
        switch (kind) {
            case constants.TYPE_ACTION_BUTTON:
                return new ActionButton(this.display);
            case constants.TYPE_ARC:
                return new Arc(this.display);
            case constants.TYPE_BOOLEAN_BUTTON:
                return new BooleanButton(this.display);
            case constants.TYPE_BOOLEAN_SWITCH:
                return new BooleanSwitch(this.display);
            case constants.TYPE_ELLIPSE:
                return new Ellipse(this.display);
            case constants.TYPE_IMAGE:
                return new ImageWidget(this.display);
            case constants.TYPE_LABEL:
                return new Label(this.display);
            case constants.TYPE_LED:
                return new LED(this.display);
            case constants.TYPE_LINKING_CONTAINER:
                return new LinkingContainer(this.display);
            case constants.TYPE_POLYGON:
                return new Polygon(this.display);
            case constants.TYPE_POLYLINE:
                return new Polyline(this.display);
            case constants.TYPE_RECTANGLE:
                return new Rectangle(this.display);
            case constants.TYPE_ROUNDED_RECTANGLE:
                return new RoundedRectangle(this.display);
            case constants.TYPE_TEXT_UPDATE:
                return new TextUpdate(this.display);
            default:
                console.warn(`Unsupported widget type: ${kind}`);
        }
    }

    findWidget(wuid: string): Widget | undefined {
        for (const widget of this.widgets) {
            if (widget.wuid === wuid) {
                return widget;
            } else if (widget instanceof LinkingContainer) {
                const match = (widget as LinkingContainer).findWidget(wuid);
                if (match) {
                    return match;
                }
            }
        }
    }
}
