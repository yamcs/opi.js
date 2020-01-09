import * as constants from '../../constants';
import { Display } from '../../Display';
import { BooleanProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_IMAGE_FILE = 'image_file';
const PROP_TRANSPARENCY = 'transparency';

export class ImageWidget extends Widget {

    readonly kind = constants.TYPE_IMAGE;

    private image?: HTMLImageElement;
    private imageLoaded = false;

    constructor(display: Display) {
        super(display);
        this.addProperty(new StringProperty(PROP_IMAGE_FILE));
        this.addProperty(new BooleanProperty(PROP_TRANSPARENCY, true))
    }

    init() {
        /*if (this.imageFile.startsWith('../')) {
            this.imageFile = this.display.resolve(this.imageFile);
        }*/
        this.image = new Image(this.width, this.height); // Using optional size for image
        this.image.onload = () => {
            this.imageLoaded = true;
            this.requestRepaint();
        }
        this.image.src = this.imageFile;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.transparency) {
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.image && this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    get transparency(): boolean { return this.getPropertyValue(PROP_TRANSPARENCY); }
    get imageFile(): string { return this.getPropertyValue(PROP_IMAGE_FILE); }
}
