import { Display } from '../Display';
import { DisplayInstance } from '../DisplayInstance';
import { HitCanvas } from '../HitCanvas';
import * as utils from '../utils';
import { Widget } from '../Widget';

export class LinkingContainer extends Widget {

    private opiFile: string;
    private resizeBehavior: number;

    private instance?: DisplayInstance;

    constructor(display: Display, node: Element) {
        super(display, node);
        this.opiFile = utils.parseStringChild(node, 'opi_file');
        this.resizeBehavior = utils.parseIntChild(node, 'resize_behaviour');

        if (this.opiFile) {
            fetch(this.opiFile).then(response => {
                if (response.ok) {
                    response.text().then(source => {
                        this.instance = new DisplayInstance(display, source);
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
}
