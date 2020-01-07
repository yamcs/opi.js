declare var FontFaceObserver: any;

import { BooleanButton } from './BooleanButton';
import { Color } from './Color';
import * as constants from './constants';
import { ImageWidget } from './ImageWidget';
import { Label } from './Label';
import { LED } from './LED';
import { Rectangle } from './Rectangle';
import { RoundedRectangle } from './RoundedRectangle';
import * as utils from './utils';
import { Widget } from './Widget';

export class Display {

    private rootPanel: HTMLDivElement;
    private ctx: CanvasRenderingContext2D;

    private repaintRequested = false;

    private title = 'Untitled';
    private backgroundColor = 'white';
    private _showGrid = true;

    private widgets: Widget[] = [];

    private gridPattern: CanvasPattern | undefined;

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
            this.drawScreen();
            this.repaintRequested = false;
        }
    }

    private drawScreen() {
        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';

        const width = this.rootPanel.clientWidth;
        const height = this.rootPanel.clientHeight;
        utils.resizeCanvas(this.ctx.canvas, width, height);

        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this._showGrid && this.gridPattern) {
            this.ctx.fillStyle = this.gridPattern;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        for (const widget of this.widgets) {
            widget.drawBorder(this.ctx);
            widget.draw(this.ctx);
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
        this.title = utils.parseStringChild(displayEl, 'name', 'Untitled');
        const width = utils.parseFloatChild(displayEl, 'width');
        const height = utils.parseFloatChild(displayEl, 'height');
        this.rootPanel.style.width = `${width}px`;
        this.rootPanel.style.height = `${height}px`;

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

        this._showGrid = utils.parseBooleanChild(displayEl, 'show_grid', false);

        this.widgets = [];
        for (const widgetNode of utils.findChildren(displayEl, 'widget')) {
            this.addWidget(widgetNode);
        }

        this.requestRepaint();
    }

    private addWidget(node: Element) {
        const typeId = utils.parseStringAttribute(node, 'typeId');
        switch (typeId) {
            case constants.TYPE_BOOLEAN_BUTTON:
                this.widgets.push(new BooleanButton(this, node));
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
            case constants.TYPE_RECTANGLE:
                this.widgets.push(new Rectangle(this, node));
                break;
            case constants.TYPE_ROUNDED_RECTANGLE:
                this.widgets.push(new RoundedRectangle(this, node));
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
}
