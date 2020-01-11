import { Display } from '../../Display';
import { BooleanProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_IMAGE_FILE = 'image_file';
const PROP_TRANSPARENCY = 'transparency';

export class ImageWidget extends Widget {

    private imageElement?: HTMLImageElement;
    private imageLoaded = false;

    constructor(display: Display) {
        super(display);
        this.properties.add(new StringProperty(PROP_IMAGE_FILE));
        this.properties.add(new BooleanProperty(PROP_TRANSPARENCY, true))
    }

    init() {
        /*if (this.imageFile.startsWith('../')) {
            this.imageFile = this.display.resolve(this.imageFile);
        }*/
        this.imageElement = new Image(this.width, this.height); // Using optional size for image
        this.imageElement.onload = () => {
            this.imageLoaded = true;
            this.requestRepaint();
        }

        const src = `/raw/${this.imageFile}`;
        this.imageElement.src = src;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.transparency) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.imageElement && this.imageLoaded) {
            ctx.drawImage(this.imageElement, this.x, this.y, this.width, this.height);
        }
    }

    get transparency(): boolean { return this.properties.getValue(PROP_TRANSPARENCY); }
    get imageFile(): string { return this.properties.getValue(PROP_IMAGE_FILE); }
}
