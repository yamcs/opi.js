declare var FontFaceObserver: any;

import { Color } from './Color';
import { Connection } from './Connection';
import * as constants from './constants';
import { EventHandler } from './EventHandler';
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
import { Polygon } from './widgets/Polygon';
import { Polyline } from './widgets/Polyline';
import { Rectangle } from './widgets/Rectangle';
import { RoundedRectangle } from './widgets/RoundedRectangle';
import { TextUpdate } from './widgets/TextUpdate';

export class Display {

    private rootPanel: HTMLDivElement;
    private ctx: CanvasRenderingContext2D;
    private hitCanvas = new HitCanvas();

    private repaintRequested = false;

    private backgroundColor = 'white';

    private _activeTool: 'run' | 'edit' = 'run';
    private _showGrid = false;
    private _showOutline = false;
    private _showRuler = false;
    private _selection: string[] = [];

    widgets: Widget[] = [];
    private connections: Connection[] = [];

    private gridPattern: CanvasPattern | undefined;

    private preferredWidth = 0;
    private preferredHeight = 0;

    constructor(private readonly targetElement: HTMLElement) {

        // Wrapper to not modify the user element much more
        this.rootPanel = document.createElement('div');
        this.rootPanel.className = 'display-root';
        this.rootPanel.style.overflow = 'hidden';
        this.rootPanel.style.position = 'relative';
        this.rootPanel.style.fontSize = '0';
        targetElement.appendChild(this.rootPanel);

        const canvas = document.createElement('canvas');
        this.rootPanel.appendChild(canvas);
        this.ctx = canvas.getContext('2d')!;

        window.requestAnimationFrame(() => this.step());

        // Preload the default Liberation font for correct text measurements
        // Probably can be done without external library in about 5 years from now.
        // Follow browser support of this spec: https://www.w3.org/TR/css-font-loading-3/
        this.preloadFont('Liberation Sans', 'normal', 'normal');
        this.preloadFont('Liberation Sans', 'normal', 'italic');
        this.preloadFont('Liberation Sans', 'bold', 'normal');
        this.preloadFont('Liberation Sans', 'bold', 'italic');

        new EventHandler(this, canvas, this.hitCanvas);
    }

    preloadFont(fontFace: string, weight: string, style: string) {
        new FontFaceObserver(fontFace, { weight, style }).load()
            .then(() => this.requestRepaint())
            .catch(() => console.warn(`Failed to load font '${fontFace}'. Font metrics may not be accurate.`));
    }

    private step() {
        window.requestAnimationFrame(() => this.step());

        // Limit CPU usage to when we need it
        if (this.repaintRequested) {
            this.hitCanvas.clear();
            this.drawScreen();
            this.repaintRequested = false;
        }
    }

    private drawScreen() {
        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';
        this.rootPanel.style.width = this.targetElement.clientWidth + 'px';

        const width = this.rootPanel.clientWidth;
        const height = this.rootPanel.clientHeight;
        utils.resizeCanvas(this.ctx.canvas, width, height);
        utils.resizeCanvas(this.hitCanvas.ctx.canvas, width, height);

        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.showGrid && this.gridPattern) {
            this.ctx.fillStyle = this.gridPattern;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        if (this.showRuler) {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'grey';
            this.ctx.textBaseline = 'bottom';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'grey';
            this.ctx.font = '12px Arial';

            let x = 0;
            while (x <= this.ctx.canvas.width) {
                x += 100;
                this.ctx.beginPath();
                this.ctx.moveTo(x - 75 + 0.5, this.ctx.canvas.height);
                this.ctx.lineTo(x - 75 + 0.5, this.ctx.canvas.height - 4);
                this.ctx.moveTo(x - 50 + 0.5, this.ctx.canvas.height);
                this.ctx.lineTo(x - 50 + 0.5, this.ctx.canvas.height - 6);
                this.ctx.moveTo(x - 25 + 0.5, this.ctx.canvas.height);
                this.ctx.lineTo(x - 25 + 0.5, this.ctx.canvas.height - 4);
                this.ctx.moveTo(x + 0.5, this.ctx.canvas.height);
                this.ctx.lineTo(x + 0.5, this.ctx.canvas.height - 8);
                this.ctx.stroke();
                this.ctx.fillText(String(x), x, this.ctx.canvas.height - 8);
            }

            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            let y = 0;
            while (y <= this.ctx.canvas.height) {
                y += 100;
                this.ctx.beginPath();
                this.ctx.moveTo(this.ctx.canvas.width, y - 75 + 0.5);
                this.ctx.lineTo(this.ctx.canvas.width - 4, y - 75 + 0.5);
                this.ctx.moveTo(this.ctx.canvas.width, y - 50 + 0.5);
                this.ctx.lineTo(this.ctx.canvas.width - 6, y - 50 + 0.5);
                this.ctx.moveTo(this.ctx.canvas.width, y - 25 + 0.5);
                this.ctx.lineTo(this.ctx.canvas.width - 4, y - 25 + 0.5);
                this.ctx.moveTo(this.ctx.canvas.width, y + 0.5);
                this.ctx.lineTo(this.ctx.canvas.width - 8, y + 0.5);
                this.ctx.stroke();
                this.ctx.fillText(String(y), this.ctx.canvas.width - 8, y);
            }
        }

        if (this.showOutline) {
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeStyle = 'black';
            this.ctx.strokeRect(-0.5, -0.5, this.preferredWidth + 1, this.preferredHeight + 1);
            this.ctx.setLineDash([]);
        }

        for (const widget of this.widgets) {
            widget.drawBorder(this.ctx);
            widget.draw(this.ctx, this.hitCanvas);
        }

        for (const connection of this.connections) {
            connection.draw(this.ctx);
        }

        // Selection on top of everything
        for (const wuid of this.selection) {
            const widget = this.findWidget(wuid);
            if (widget) {
                widget.drawSelection(this.ctx);
            }
        }
    }

    /**
     * Request a repaint of the canvas. The repaint is done async from a
     * UI render loop.
     */
    requestRepaint() {
        this.repaintRequested = true;
    }

    setSource(source: string) {
        const xmlParser = new DOMParser();
        const doc = xmlParser.parseFromString(source, 'text/xml') as XMLDocument;

        const displayEl = doc.getElementsByTagName('display')[0];
        this.preferredWidth = utils.parseFloatChild(displayEl, 'width');
        this.preferredHeight = utils.parseFloatChild(displayEl, 'height');

        const bgNode = utils.findChild(displayEl, 'background_color');
        this.backgroundColor = utils.parseColorChild(bgNode, Color.WHITE).toString();

        const gridSpace = utils.parseIntChild(displayEl, 'grid_space');
        const fgNode = utils.findChild(displayEl, 'foreground_color');
        const gridColor = utils.parseColorChild(fgNode).toString();

        const patternCanvas = document.createElement('canvas');
        const patternContext = patternCanvas.getContext('2d')!;
        patternCanvas.width = gridSpace;
        patternCanvas.height = gridSpace;
        patternContext.fillStyle = gridColor;
        patternContext.fillRect(0, 0, 2, 1);
        this.gridPattern = this.ctx.createPattern(patternCanvas, 'repeat')!;

        this.widgets = [];
        for (const widgetNode of utils.findChildren(displayEl, 'widget')) {
            this.addWidget(widgetNode);
        }
        this.connections = [];
        for (const connectionNode of utils.findChildren(displayEl, 'connection')) {
            this.connections.push(new Connection(connectionNode, this));
        }

        this.requestRepaint();
    }

    private addWidget(node: Element) {
        const typeId = utils.parseStringAttribute(node, 'typeId');
        switch (typeId) {
            case constants.TYPE_ACTION_BUTTON:
                this.widgets.push(new ActionButton(this, node));
                break;
            case constants.TYPE_ARC:
                this.widgets.push(new Arc(this, node));
                break;
            case constants.TYPE_BOOLEAN_BUTTON:
                this.widgets.push(new BooleanButton(this, node));
                break;
            case constants.TYPE_BOOLEAN_SWITCH:
                this.widgets.push(new BooleanSwitch(this, node));
                break;
            case constants.TYPE_ELLIPSE:
                this.widgets.push(new Ellipse(this, node));
                break;
            case constants.TYPE_IMAGE:
                this.widgets.push(new ImageWidget(this, node));
                break;
            case constants.TYPE_LABEL:
                this.widgets.push(new Label(this, node));
                break;
            case constants.TYPE_LED:
                this.widgets.push(new LED(this, node));
                break;
            case constants.TYPE_POLYGON:
                this.widgets.push(new Polygon(this, node));
                break;
            case constants.TYPE_POLYLINE:
                this.widgets.push(new Polyline(this, node));
                break;
            case constants.TYPE_RECTANGLE:
                this.widgets.push(new Rectangle(this, node));
                break;
            case constants.TYPE_ROUNDED_RECTANGLE:
                this.widgets.push(new RoundedRectangle(this, node));
                break;
            case constants.TYPE_TEXT_UPDATE:
                this.widgets.push(new TextUpdate(this, node));
                break;
            default:
                console.warn(`Unsupported widget type: ${typeId}`);
        }
    }

    get showGrid() { return this._showGrid; }
    set showGrid(showGrid: boolean) {
        this._showGrid = showGrid;
        this.requestRepaint();
    }

    get showOutline() { return this._showOutline; }
    set showOutline(showOutline: boolean) {
        this._showOutline = showOutline;
        this.requestRepaint();
    }

    get showRuler() { return this._showRuler; }
    set showRuler(showRuler: boolean) {
        this._showRuler = showRuler;
        this.requestRepaint();
    }

    get selection() { return this._selection; }
    set selection(selection: string[]) {
        this._selection = selection;
        this.requestRepaint();
    }

    get activeTool() { return this._activeTool; }
    set activeTool(activeTool: 'run' | 'edit') {
        this._activeTool = activeTool;
        this.requestRepaint();
    }

    clearSelection() {
        this.selection = [];
    }

    findWidget(wuid: string) {
        for (const widget of this.widgets) {
            if (widget.wuid === wuid) {
                return widget;
            }
        }
    }
}
