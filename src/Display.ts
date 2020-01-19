import FontFaceObserver from 'fontfaceobserver';
import { Color } from './Color';
import { EventHandler } from './EventHandler';
import { OPIEvent, OPIEventHandlers, OPIEventMap, SelectionEvent } from './events';
import { Graphics } from './Graphics';
import { PVEngine } from './pv/PVEngine';
import { PVProvider } from './pv/PVProvider';
import { SimulatedPVProvider } from './pv/SimulatedPVProvider';
import { ActionButton } from './widgets/controls/ActionButton';
import { BooleanButton } from './widgets/controls/BooleanButton';
import { BooleanSwitch } from './widgets/controls/BooleanSwitch';
import { ImageBooleanButton } from './widgets/controls/ImageBooleanButton';
import { NativeButton } from './widgets/controls/NativeButton';
import { TextInput } from './widgets/controls/TextInput';
import { Arc } from './widgets/graphics/Arc';
import { Ellipse } from './widgets/graphics/Ellipse';
import { ImageWidget } from './widgets/graphics/ImageWidget';
import { Label } from './widgets/graphics/Label';
import { Polygon } from './widgets/graphics/Polygon';
import { Polyline } from './widgets/graphics/Polyline';
import { Rectangle } from './widgets/graphics/Rectangle';
import { RoundedRectangle } from './widgets/graphics/RoundedRectangle';
import { Gauge } from './widgets/monitors/Gauge';
import { ImageBooleanIndicator } from './widgets/monitors/ImageBooleanIndicator';
import { LED } from './widgets/monitors/LED';
import { Meter } from './widgets/monitors/Meter';
import { TextUpdate } from './widgets/monitors/TextUpdate';
import { XYGraph } from './widgets/monitors/XYGraph';
import { AbstractContainerWidget } from './widgets/others/AbstractContainerWidget';
import { DisplayWidget } from './widgets/others/DisplayWidget';
import { GroupingContainer } from './widgets/others/GroupingContainer';
import { LinkingContainer } from './widgets/others/LinkingContainer';
import { TabbedContainer } from './widgets/others/TabbedContainer';
import { WebBrowser } from './widgets/others/WebBrowser';
import { XMLNode } from './XMLNode';


const TYPE_ACTION_BUTTON = 'Action Button';
const TYPE_ARC = 'Arc';
const TYPE_BOOLEAN_BUTTON = 'Boolean Button';
const TYPE_BOOLEAN_SWITCH = 'Boolean Switch';
const TYPE_ELLIPSE = 'Ellipse';
const TYPE_GAUGE = 'Gauge';
const TYPE_GROUPING_CONTAINER = 'Grouping Container';
const TYPE_IMAGE = 'Image';
const TYPE_IMAGE_BOOLEAN_BUTTON = 'Image Boolean Button';
const TYPE_IMAGE_BOOLEAN_INDICATOR = 'Image Boolean Indicator';
const TYPE_LABEL = 'Label';
const TYPE_LED = 'LED';
const TYPE_LINKING_CONTAINER = 'Linking Container';
const TYPE_METER = 'Meter';
const TYPE_NATIVE_BUTTON = 'Button'; // Only used in old displays
const TYPE_POLYGON = 'Polygon';
const TYPE_POLYLINE = 'Polyline';
const TYPE_RECTANGLE = 'Rectangle';
const TYPE_ROUNDED_RECTANGLE = 'Rounded Rectangle';
const TYPE_TABBED_CONTAINER = 'Tabbed Container';
const TYPE_TEXT_INPUT = 'Text Input';
const TYPE_TEXT_UPDATE = 'Text Update';
const TYPE_WEB_BROWSER = 'Web Browser';
const TYPE_XY_GRAPH = 'XY Graph';

export class Display {

    rootPanel: HTMLDivElement;
    private g: Graphics;
    private ctx: CanvasRenderingContext2D;
    pvEngine: PVEngine;

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
        closedisplay: [],
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

        this.pvEngine = new PVEngine(this);
        this.pvEngine.addProvider(new SimulatedPVProvider());

        window.requestAnimationFrame(() => this.step());

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

    addProvider(provider: PVProvider) {
        this.pvEngine.addProvider(provider);
    }

    private step() {
        // Limit CPU usage to when we need it
        if (this.repaintRequested) {
            this.g.clearHitCanvas();
            this.drawScreen();
            this.repaintRequested = false;
        }

        window.requestAnimationFrame(() => this.step());
    }

    private drawScreen() {
        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';
        this.rootPanel.style.width = this.targetElement.clientWidth + 'px';
        this.g.resize(this.rootPanel.clientWidth, this.rootPanel.clientHeight);

        if (this.editMode) {
            const patternCanvas = document.createElement('canvas');
            const patternContext = patternCanvas.getContext('2d')!;
            patternCanvas.width = 16;
            patternCanvas.height = 16;
            patternContext.fillStyle = '#d6d6d6';
            patternContext.fillRect(0, 0, 8, 8);
            patternContext.fillRect(8, 8, 8, 8);
            this.ctx.fillStyle = this.ctx.createPattern(patternCanvas, 'repeat')!;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

            if (this.instance) {
                this.g.fillRect({
                    ... this.instance.bounds,
                    color: this.instance.backgroundColor
                });
            }
        } else {
            this.g.fillCanvas(this.instance ? this.instance.backgroundColor : Color.WHITE);
        }

        if (this.showGrid && this.instance) {
            const patternCanvas = document.createElement('canvas');
            const patternContext = patternCanvas.getContext('2d')!;
            patternCanvas.width = 25;
            patternCanvas.height = 25;
            patternContext.fillStyle = this.instance.foregroundColor.toString();
            patternContext.fillRect(0, 0, 2, 1);
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
            case TYPE_IMAGE_BOOLEAN_BUTTON:
                return new ImageBooleanButton(this, parent);
            case TYPE_IMAGE_BOOLEAN_INDICATOR:
                return new ImageBooleanIndicator(this, parent);
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
            case TYPE_TEXT_INPUT:
                return new TextInput(this, parent);
            case TYPE_TEXT_UPDATE:
                return new TextUpdate(this, parent);
            case TYPE_WEB_BROWSER:
                return new WebBrowser(this, parent);
            case TYPE_XY_GRAPH:
                return new XYGraph(this, parent);
            default:
                console.warn(`Unsupported widget type: ${kind}`);
        }
    }

    destroy() {
        this.instance = undefined;
        this.pvEngine.clearState();
        this.requestRepaint();
    }

    setSource(href: string) {
        if (this.instance) {
            this.clearSelection();
            this.pvEngine.clearState();
            this.instance = undefined;
        }
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
