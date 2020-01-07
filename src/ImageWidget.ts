import { Display } from './Display';
import * as utils from './utils';
import { Widget } from './Widget';

export class ImageWidget extends Widget {

    private image: HTMLImageElement;
    private imageLoaded = false;
    private transparency: boolean;

    constructor(display: Display, node: Element) {
        super(display, node);
        const imageFile = utils.parseStringChild(node, 'image_file');
        /*if (this.imageFile.startsWith('../')) {
            this.imageFile = this.display.resolve(this.imageFile);
        }*/
        this.image = new Image(this.width, this.height); // Using optional size for image
        this.image.onload = () => {
            this.imageLoaded = true;
            this.requestRepaint();
        }
        this.image.src = imageFile;
        this.transparency = utils.parseBooleanChild(node, 'transparency', true);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (true) return;
        if (!this.transparency) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}
