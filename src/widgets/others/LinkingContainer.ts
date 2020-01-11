import { Display } from '../../Display';
import { HitCanvas } from '../../HitCanvas';
import { IntProperty, StringProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { DisplayWidget } from './DisplayWidget';

const PROP_OPI_FILE = 'opi_file';
const PROP_RESIZE_BEHAVIOR = 'resize_behaviour';

export class LinkingContainer extends AbstractContainerWidget {

    private linkedDisplay?: DisplayWidget;

    constructor(display: Display) {
        super(display);
        this.properties.add(new StringProperty(PROP_OPI_FILE));
        this.properties.add(new IntProperty(PROP_RESIZE_BEHAVIOR));
    }

    init() {
        if (this.opiFile) {
            fetch(this.opiFile).then(response => {
                if (response.ok) {
                    response.text().then(source => {
                        this.linkedDisplay = new DisplayWidget(this.display);
                        const displayNode = XMLNode.parseFromXML(source);
                        this.linkedDisplay.parseNode(displayNode);
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

        if (this.linkedDisplay) {
            // Copy the opi background over the full container area
            ctx.fillStyle = this.linkedDisplay.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);

            if (this.resizeBehavior === 0) { // FIT_OPI_TO_CONTAINER
                const sw = this.linkedDisplay.preferredWidth;
                const sh = this.linkedDisplay.preferredHeight;
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

    get widgets() { return (this.linkedDisplay) ? this.linkedDisplay.widgets : [] }
    get connections() { return (this.linkedDisplay) ? this.linkedDisplay.connections : [] }

    findWidget(wuid: string) {
        if (this.linkedDisplay) {
            return this.linkedDisplay.findWidget(wuid);
        }
    }

    private drawOffscreen(hitCanvas: HitCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = this.linkedDisplay!.preferredWidth;
        canvas.height = this.linkedDisplay!.preferredHeight;
        const ctx = canvas.getContext('2d')!;

        this.linkedDisplay!.draw(ctx, hitCanvas);

        return canvas;
    }

    get opiFile(): string { return this.properties.getValue(PROP_OPI_FILE); }
    get resizeBehavior(): number { return this.properties.getValue(PROP_RESIZE_BEHAVIOR); }
}
