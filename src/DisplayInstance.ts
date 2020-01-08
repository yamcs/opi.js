import { Color } from './Color';
import { Connection } from './Connection';
import * as constants from './constants';
import { Display } from './Display';
import { HitCanvas } from './HitCanvas';
import { ImageWidget } from './ImageWidget';
import * as utils from './utils';
import { Widget } from './Widget';
import { ActionButton } from './widgets/ActionButton';
import { Arc } from './widgets/Arc';
import { BooleanButton } from './widgets/BooleanButton';
import { BooleanSwitch } from './widgets/BooleanSwitch';
import { Ellipse } from './widgets/Ellipse';
import { Label } from './widgets/Label';
import { LED } from './widgets/LED';
import { LinkingContainer } from './widgets/LinkingContainer';
import { Polygon } from './widgets/Polygon';
import { Polyline } from './widgets/Polyline';
import { Rectangle } from './widgets/Rectangle';
import { RoundedRectangle } from './widgets/RoundedRectangle';
import { TextUpdate } from './widgets/TextUpdate';

export class DisplayInstance {

    readonly backgroundColor: Color;
    readonly preferredWidth: number;
    readonly preferredHeight: number;
    readonly gridSpace: number;
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

        this.gridSpace = utils.parseIntChild(displayEl, 'grid_space');
        const fgNode = utils.findChild(displayEl, 'foreground_color');
        this.gridColor = utils.parseColorChild(fgNode);

        for (const widgetNode of utils.findChildren(displayEl, 'widget')) {
            this.addWidget(widgetNode);
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
            // connection.draw(ctx);
        }
    }

    addWidget(node: Element) {
        const typeId = utils.parseStringAttribute(node, 'typeId');
        switch (typeId) {
            case constants.TYPE_ACTION_BUTTON:
                this.widgets.push(new ActionButton(this.display, node));
                break;
            case constants.TYPE_ARC:
                this.widgets.push(new Arc(this.display, node));
                break;
            case constants.TYPE_BOOLEAN_BUTTON:
                this.widgets.push(new BooleanButton(this.display, node));
                break;
            case constants.TYPE_BOOLEAN_SWITCH:
                this.widgets.push(new BooleanSwitch(this.display, node));
                break;
            case constants.TYPE_ELLIPSE:
                this.widgets.push(new Ellipse(this.display, node));
                break;
            case constants.TYPE_IMAGE:
                this.widgets.push(new ImageWidget(this.display, node));
                break;
            case constants.TYPE_LABEL:
                this.widgets.push(new Label(this.display, node));
                break;
            case constants.TYPE_LED:
                this.widgets.push(new LED(this.display, node));
                break;
            case constants.TYPE_LINKING_CONTAINER:
                this.widgets.push(new LinkingContainer(this.display, node));
                break;
            case constants.TYPE_POLYGON:
                this.widgets.push(new Polygon(this.display, node));
                break;
            case constants.TYPE_POLYLINE:
                this.widgets.push(new Polyline(this.display, node));
                break;
            case constants.TYPE_RECTANGLE:
                this.widgets.push(new Rectangle(this.display, node));
                break;
            case constants.TYPE_ROUNDED_RECTANGLE:
                this.widgets.push(new RoundedRectangle(this.display, node));
                break;
            case constants.TYPE_TEXT_UPDATE:
                this.widgets.push(new TextUpdate(this.display, node));
                break;
            default:
                console.warn(`Unsupported widget type: ${typeId}`);
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
