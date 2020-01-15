import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { IntProperty, StringProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { DisplayWidget } from './DisplayWidget';

const PROP_GROUP_NAME = 'group_name';
const PROP_OPI_FILE = 'opi_file';
const PROP_RESIZE_BEHAVIOR = 'resize_behaviour';

export class LinkingContainer extends AbstractContainerWidget {

    private linkedDisplay?: DisplayWidget;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new StringProperty(PROP_GROUP_NAME));
        this.properties.add(new StringProperty(PROP_OPI_FILE));
        this.properties.add(new IntProperty(PROP_RESIZE_BEHAVIOR, 0));
    }

    init() {
        if (this.opiFile) {
            fetch(this.display.baseUrl + this.opiFile).then(response => {
                if (response.ok) {
                    response.text().then(source => {
                        this.linkedDisplay = new DisplayWidget(this.display, this);
                        const displayNode = XMLNode.parseFromXML(source);
                        this.linkedDisplay.parseNode(displayNode);
                        this.requestRepaint();
                    });
                }
            });
        }
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        if (!this.transparent) {
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }

        if (this.linkedDisplay) {
            // Copy the opi background over the full container area
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.linkedDisplay.backgroundColor,
            });

            if (this.resizeBehavior === 0) { // FIT_OPI_TO_CONTAINER
                const sw = this.linkedDisplay.holderWidth;
                const sh = this.linkedDisplay.holderHeight;
                const tmpHitCanvas = hitCanvas.createChild(sw, sh);
                const tmpCanvas = this.drawOffscreen(tmpHitCanvas);

                const ratio = sw / sh;
                let dw = this.width;
                let dh = dw / ratio;
                if (dh > this.height) {
                    dh = this.height;
                    dw = dh * ratio;
                }
                g.ctx.drawImage(tmpCanvas, this.x, this.y, dw, dh);
                tmpHitCanvas.transferToParent(this.x, this.y, dw, dh);
            } else if (this.resizeBehavior === 1) { // FIT_CONTAINER_TO_OPI
                // TODO
            } else if (this.resizeBehavior === 2) { // CROP OPI
                const tmpCanvas = this.drawOffscreen(hitCanvas);
                g.ctx.drawImage(tmpCanvas, this.x, this.y);
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
        canvas.width = this.linkedDisplay!.holderWidth;
        canvas.height = this.linkedDisplay!.holderHeight;
        const g = new Graphics(canvas);

        this.linkedDisplay!.draw(g, hitCanvas);

        return canvas;
    }

    get opiFile(): string { return this.properties.getValue(PROP_OPI_FILE); }
    get groupName(): string { return this.properties.getValue(PROP_GROUP_NAME); }
    get resizeBehavior(): number { return this.properties.getValue(PROP_RESIZE_BEHAVIOR); }
}
