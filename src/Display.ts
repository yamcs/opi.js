import FontFaceObserver from 'fontfaceobserver';
import { Color } from './Color';
import { EventHandler } from './EventHandler';
import { OPIEvent, OPIEventHandlers, OPIEventMap, SelectionEvent } from './events';
import { Graphics } from './Graphics';
import { PVEngine } from './pv/PVEngine';
import { ActionButton } from './widgets/controls/ActionButton';
import { BooleanButton } from './widgets/controls/BooleanButton';
import { BooleanSwitch } from './widgets/controls/BooleanSwitch';
import { NativeButton } from './widgets/controls/NativeButton';
import { Arc } from './widgets/graphics/Arc';
import { Ellipse } from './widgets/graphics/Ellipse';
import { ImageWidget } from './widgets/graphics/ImageWidget';
import { Label } from './widgets/graphics/Label';
import { Polygon } from './widgets/graphics/Polygon';
import { Polyline } from './widgets/graphics/Polyline';
import { Rectangle } from './widgets/graphics/Rectangle';
import { RoundedRectangle } from './widgets/graphics/RoundedRectangle';
import { Gauge } from './widgets/monitors/Gauge';
import { LED } from './widgets/monitors/LED';
import { Meter } from './widgets/monitors/Meter';
import { TextUpdate } from './widgets/monitors/TextUpdate';
import { AbstractContainerWidget } from './widgets/others/AbstractContainerWidget';
import { DisplayWidget } from './widgets/others/DisplayWidget';
import { GroupingContainer } from './widgets/others/GroupingContainer';
import { LinkingContainer } from './widgets/others/LinkingContainer';
import { TabbedContainer } from './widgets/others/TabbedContainer';
import { WebBrowser } from './widgets/others/WebBrowser';
import { XMLNode } from './XMLNode';


const TYPE_ACTION_BUTTON = 'org.csstudio.opibuilder.widgets.ActionButton';
const TYPE_ARC = 'org.csstudio.opibuilder.widgets.arc';
const TYPE_BOOLEAN_BUTTON = 'org.csstudio.opibuilder.widgets.BoolButton';
const TYPE_BOOLEAN_SWITCH = 'org.csstudio.opibuilder.widgets.BoolSwitch';
const TYPE_DISPLAY = 'org.csstudio.opibuilder.Display';
const TYPE_ELLIPSE = 'org.csstudio.opibuilder.widgets.Ellipse';
const TYPE_GAUGE = 'org.csstudio.opibuilder.widgets.gauge';
const TYPE_GROUPING_CONTAINER = 'org.csstudio.opibuilder.widgets.groupingContainer';
const TYPE_IMAGE = 'org.csstudio.opibuilder.widgets.Image';
const TYPE_IMAGE_BOOLEAN_BUTTON = 'org.csstudio.opibuilder.widgets.ImageBoolButton';
const TYPE_IMAGE_BOOLEAN_INDICATOR = 'org.csstudio.opibuilder.widgets.ImageBoolIndicator';
const TYPE_LABEL = 'org.csstudio.opibuilder.widgets.Label';
const TYPE_LED = 'org.csstudio.opibuilder.widgets.LED';
const TYPE_LINKING_CONTAINER = 'org.csstudio.opibuilder.widgets.linkingContainer';
const TYPE_METER = 'org.csstudio.opibuilder.widgets.meter';
const TYPE_NATIVE_BUTTON = 'org.csstudio.opibuilder.widgets.NativeButton'; // Only used in old displays
const TYPE_POLYGON = 'org.csstudio.opibuilder.widgets.polygon';
const TYPE_POLYLINE = 'org.csstudio.opibuilder.widgets.polyline';
const TYPE_RECTANGLE = 'org.csstudio.opibuilder.widgets.Rectangle';
const TYPE_ROUNDED_RECTANGLE = 'org.csstudio.opibuilder.widgets.RoundedRectangle';
const TYPE_TABBED_CONTAINER = 'org.csstudio.opibuilder.widgets.tab';
const TYPE_TEXT_INPUT = 'org.csstudio.opibuilder.widgets.TextInput';
const TYPE_TEXT_UPDATE = 'org.csstudio.opibuilder.widgets.TextUpdate';
const TYPE_WEB_BROWSER = 'org.csstudio.opibuilder.widgets.webbrowser';
const TYPE_XY_GRAPH = 'org.csstudio.opibuilder.widgets.xyGraph';

export class Display {

    rootPanel: HTMLDivElement;
    private g: Graphics;
    private ctx: CanvasRenderingContext2D;
    pvEngine = new PVEngine();

    private repaintRequested = false;

    private _editMode = false;
    private _showGrid = false;
    private _showOutline = false;
    private _showRuler = false;
    private _selection: string[] = [];

    /**
     * Prefix for external path references (images, scripts, dispays)
     */
    baseUrl = '';

    instance?: DisplayWidget;

    private eventListeners: OPIEventHandlers = {
        opendisplay: [],
        selection: [],
    };

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
        this.g = new Graphics(canvas);
        this.ctx = this.g.ctx;

        window.requestAnimationFrame(t => this.step(t));

        // Preload the default Liberation font for correct text measurements
        // Probably can be done without external library in about 5 years from now.
        // Follow browser support of this spec: https://www.w3.org/TR/css-font-loading-3/
        this.preloadFont('Liberation Sans', 'normal', 'normal');
        this.preloadFont('Liberation Sans', 'normal', 'italic');
        this.preloadFont('Liberation Sans', 'bold', 'normal');
        this.preloadFont('Liberation Sans', 'bold', 'italic');

        new EventHandler(this, canvas, this.g.hitCanvas);
    }

    preloadFont(fontFace: string, weight: string, style: string) {
        new FontFaceObserver(fontFace, { weight, style }).load()
            .then(() => this.requestRepaint())
            .catch(() => console.warn(`Failed to load font '${fontFace}'. Font metrics may not be accurate.`));
    }

    private step(t: number) {
        window.requestAnimationFrame(t => this.step(t));

        const pvChanged = this.pvEngine.step(t);

        // Limit CPU usage to when we need it
        if (this.repaintRequested || pvChanged) {
            this.g.clearHitCanvas();
            this.drawScreen();
            this.repaintRequested = false;
        }
    }

    private drawScreen() {
        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';
        this.rootPanel.style.width = this.targetElement.clientWidth + 'px';
        this.g.resize(this.rootPanel.clientWidth, this.rootPanel.clientHeight);

        this.g.fillCanvas(this.instance ? this.instance.backgroundColor : Color.WHITE);

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
            this.ctx.strokeRect(-0.5, -0.5, this.instance.holderWidth + 1, this.instance.holderHeight + 1);
            this.ctx.setLineDash([]);
        }

        if (this.instance) {
            this.instance.draw(this.g);
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

    createWidget(kind: string, parent: AbstractContainerWidget) {
        switch (kind) {
            case TYPE_ACTION_BUTTON:
                return new ActionButton(this, parent);
            case TYPE_ARC:
                return new Arc(this, parent);
            case TYPE_BOOLEAN_BUTTON:
                return new BooleanButton(this, parent);
            case TYPE_BOOLEAN_SWITCH:
                return new BooleanSwitch(this, parent);
            case TYPE_ELLIPSE:
                return new Ellipse(this, parent);
            case TYPE_GAUGE:
                return new Gauge(this, parent);
            case TYPE_GROUPING_CONTAINER:
                return new GroupingContainer(this, parent);
            case TYPE_IMAGE:
                return new ImageWidget(this, parent);
            case TYPE_LABEL:
                return new Label(this, parent);
            case TYPE_LED:
                return new LED(this, parent);
            case TYPE_LINKING_CONTAINER:
                return new LinkingContainer(this, parent);
            case TYPE_METER:
                return new Meter(this, parent);
            case TYPE_NATIVE_BUTTON:
                return new NativeButton(this, parent);
            case TYPE_POLYGON:
                return new Polygon(this, parent);
            case TYPE_POLYLINE:
                return new Polyline(this, parent);
            case TYPE_RECTANGLE:
                return new Rectangle(this, parent);
            case TYPE_ROUNDED_RECTANGLE:
                return new RoundedRectangle(this, parent);
            case TYPE_TABBED_CONTAINER:
                return new TabbedContainer(this, parent);
            case TYPE_TEXT_UPDATE:
                return new TextUpdate(this, parent);
            case TYPE_WEB_BROWSER:
                return new WebBrowser(this, parent);
            default:
                console.warn(`Unsupported widget type: ${kind}`);
        }
    }

    clear() {
        this.clearSelection();
        this.instance = undefined;
        this.pvEngine.reset();
        this.requestRepaint();
    }

    setSource(href: string) {
        return new Promise((resolve, reject) => {
            fetch(this.baseUrl + href).then(response => {
                if (response.ok) {
                    response.text().then(text => {
                        this.setSourceString(text);
                        resolve();
                    }).catch(err => reject(err));
                }
            }).catch(err => reject(err));
        });
    }

    setSourceString(source: string) {
        this.instance = new DisplayWidget(this);
        const displayNode = XMLNode.parseFromXML(source);
        this.instance.parseNode(displayNode);
        this.requestRepaint();
    }

    addEventListener<K extends keyof OPIEventMap>(type: K, listener: ((ev: OPIEventMap[K]) => void)): void;
    addEventListener(type: string, listener: (ev: OPIEvent) => void): void {
        if (!(type in this.eventListeners)) {
            throw new Error(`Unknown event '${type}'`);
        }
        this.eventListeners[type].push(listener);
    }

    removeEventListener<K extends keyof OPIEventMap>(type: K, listener: ((ev: OPIEventMap[K]) => void)): void;
    removeEventListener(type: string, listener: (ev: OPIEvent) => void): void {
        if (!(type in this.eventListeners)) {
            throw new Error(`Unknown event '${type}'`);
        }
        this.eventListeners[type] = this.eventListeners[type]
            .filter((el: any) => (el !== listener));
    }

    fireEvent(type: string, event: OPIEvent) {
        const listeners = this.eventListeners[type];
        listeners.forEach(listener => listener(event));
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
        const selectionEvent: SelectionEvent = {
            selected: this._selection.slice(),
        };
        this.fireEvent('selection', selectionEvent);
    }

    get editMode() { return this._editMode; }
    set editMode(editMode: boolean) {
        this._editMode = editMode;
        this.requestRepaint();
    }

    get widgets() { return this.instance ? this.instance.widgets : []; }

    clearSelection() {
        if (this.selection.length) { // Avoids unnecessary selection events
            this.selection = [];
        }
    }

    findWidget(wuid: string) {
        if (this.instance) {
            return this.instance.findWidget(wuid);
        }
    }

    findWidgetByName(name: string) {
        if (this.instance) {
            return this.instance.findWidgetByName(name);
        }
    }

    getPVNames() {
        this.pvEngine.getPVNames();
    }

    getPV(pvName: string) {
        return this.pvEngine.getPV(pvName);
    }
}
