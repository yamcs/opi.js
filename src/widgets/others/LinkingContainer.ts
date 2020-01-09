import * as constants from '../../constants';
import { Display } from '../../Display';
import { HitCanvas } from '../../HitCanvas';
import { IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLParser';
import { DisplayWidget } from './DisplayWidget';

const PROP_OPI_FILE = 'opi_file';
const PROP_RESIZE_BEHAVIOR = 'resize_behaviour';

export class LinkingContainer extends Widget {

    readonly kind = constants.TYPE_LINKING_CONTAINER;

    private instance?: DisplayWidget;

    constructor(display: Display) {
        super(display);
        this.addProperty(new StringProperty(PROP_OPI_FILE));
        this.addProperty(new IntProperty(PROP_RESIZE_BEHAVIOR));
    }

    init() {
        if (this.opiFile) {
            fetch(this.opiFile).then(response => {
                if (response.ok) {
                    response.text().then(source => {
                        this.instance = new DisplayWidget(this.display);
                        const xmlParser = new DOMParser();
                        const doc = xmlParser.parseFromString(source, 'text/xml') as XMLDocument;
                        const displayNode = new XMLNode(doc.getElementsByTagName('display')[0]);
                        this.instance.parseNode(displayNode);
                        this.requestRepaint();
                    });
                }
            });
        }
    }

    draw(ctx: CanvasRenderingContext2D, hitCanvas: HitCanvas) {
        if (!this.transparent) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.instance) {
            // Copy the opi background over the full container area
            ctx.fillStyle = this.instance.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);

            if (this.resizeBehavior === 0) { // FIT_OPI_TO_CONTAINER
                const sw = this.instance.preferredWidth;
                const sh = this.instance.preferredHeight;
                const tmpHitCanvas = hitCanvas.createChild(sw, sh);
                const tmpCanvas = this.drawOffscreen(tmpHitCanvas);

                const ratio = sw / sh;
                let dw = this.width;
                let dh = dw / ratio;
                if (dh > this.height) {
                    dh = this.height;
                    dw = dh * ratio;
                }
                ctx.drawImage(tmpCanvas, this.x, this.y, dw, dh);
                tmpHitCanvas.transferToParent(this.x, this.y, dw, dh);
            } else if (this.resizeBehavior === 1) { // FIT_CONTAINER_TO_OPI
                // TODO
            } else if (this.resizeBehavior === 2) { // CROP OPI
                const tmpCanvas = this.drawOffscreen(hitCanvas);
                ctx.drawImage(tmpCanvas, this.x, this.y);
            } else if (this.resizeBehavior === 3) { // SCROLL OPI
                // TODO
                console.warn('Unsupported resize behavior of LinkingContainer', this.resizeBehavior);
            }
        }
    }

    findWidget(wuid: string) {
        if (this.instance) {
            return this.instance.findWidget(wuid);
        }
    }

    private drawOffscreen(hitCanvas: HitCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = this.instance!.preferredWidth;
        canvas.height = this.instance!.preferredHeight;
        const ctx = canvas.getContext('2d')!;

        this.instance!.draw(ctx, hitCanvas);

        return canvas;
    }

    get opiFile(): string { return this.getPropertyValue(PROP_OPI_FILE); }
    get resizeBehavior(): number { return this.getPropertyValue(PROP_RESIZE_BEHAVIOR); }
}
