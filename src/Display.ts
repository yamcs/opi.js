declare var FontFaceObserver: any;

import * as constants from './constants';
import { EventHandler } from './EventHandler';
import { HitCanvas } from './HitCanvas';
import { PVEngine } from './PVEngine';
import * as utils from './utils';
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
import { DisplayWidget } from './widgets/others/DisplayWidget';
import { LinkingContainer } from './widgets/others/LinkingContainer';
import { XMLNode } from './XMLParser';

export class Display {

    private rootPanel: HTMLDivElement;
    private ctx: CanvasRenderingContext2D;
    private hitCanvas = new HitCanvas();
    pvEngine = new PVEngine();

    private repaintRequested = false;

    private _activeTool: 'run' | 'edit' = 'run';
    private _showGrid = false;
    private _showOutline = false;
    private _showRuler = false;
    private _selection: string[] = [];

    instance?: DisplayWidget;

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

        this.ctx.fillStyle = this.instance ? this.instance.backgroundColor.toString() : 'white';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.showGrid && this.instance) {
            const patternCanvas = document.createElement('canvas');
            const patternContext = patternCanvas.getContext('2d')!;
            patternCanvas.width = 25;
            patternCanvas.height = 25;
            patternContext.fillStyle = this.instance.foregroundColor.toString();
            patternContext.fillRect(0, 0, 1, 1);
            this.ctx.fillStyle = this.ctx.createPattern(patternCanvas, 'repeat')!;
            this.ctx.fillRect(25, 25, this.ctx.canvas.width - 50, this.ctx.canvas.height - 50);
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

        if (this.showOutline && this.instance) {
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeStyle = 'black';
            this.ctx.strokeRect(-0.5, -0.5, this.instance.preferredWidth + 1, this.instance.preferredHeight + 1);
            this.ctx.setLineDash([]);
        }

        if (this.instance) {
            this.instance.draw(this.ctx, this.hitCanvas);
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

    createWidget(kind: string) {
        switch (kind) {
            case constants.TYPE_ACTION_BUTTON:
                return new ActionButton(this);
            case constants.TYPE_ARC:
                return new Arc(this);
            case constants.TYPE_BOOLEAN_BUTTON:
                return new BooleanButton(this);
            case constants.TYPE_BOOLEAN_SWITCH:
                return new BooleanSwitch(this);
            case constants.TYPE_ELLIPSE:
                return new Ellipse(this);
            case constants.TYPE_IMAGE:
                return new ImageWidget(this);
            case constants.TYPE_LABEL:
                return new Label(this);
            case constants.TYPE_LED:
                return new LED(this);
            case constants.TYPE_LINKING_CONTAINER:
                return new LinkingContainer(this);
            case constants.TYPE_POLYGON:
                return new Polygon(this);
            case constants.TYPE_POLYLINE:
                return new Polyline(this);
            case constants.TYPE_RECTANGLE:
                return new Rectangle(this);
            case constants.TYPE_ROUNDED_RECTANGLE:
                return new RoundedRectangle(this);
            case constants.TYPE_TEXT_UPDATE:
                return new TextUpdate(this);
            default:
                console.warn(`Unsupported widget type: ${kind}`);
        }
    }

    setSource(href: string) {
        return fetch(href).then(response => {
            if (response.ok) {
                response.text().then(text => {
                    this.setSourceString(text);
                });
            }
        });
    }

    setSourceString(source: string) {
        this.instance = new DisplayWidget(this);
        const xmlParser = new DOMParser();
        const doc = xmlParser.parseFromString(source, 'text/xml') as XMLDocument;
        const displayNode = new XMLNode(doc.getElementsByTagName('display')[0]);
        this.instance.parseNode(displayNode);
        this.requestRepaint();
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

    get widgets() { return this.instance ? this.instance.widgets : []; }

    clearSelection() {
        this.selection = [];
    }

    findWidget(wuid: string) {
        if (this.instance) {
            return this.instance.findWidget(wuid);
        }
    }
}
