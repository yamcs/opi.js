import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { BooleanProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_IMAGE_FILE = 'image_file';
const PROP_NO_ANIMATION = 'no_animation';
const PROP_TRANSPARENCY = 'transparency';

export class ImageWidget extends Widget {

    private currentImageFile?: string;
    private imageElement?: HTMLImageElement;
    private imageSnapshot?: HTMLCanvasElement;
    private imageLoaded = false;

    constructor(display: Display) {
        super(display);
        this.properties.add(new StringProperty(PROP_IMAGE_FILE));
        this.properties.add(new StringProperty(PROP_NO_ANIMATION));
        this.properties.add(new BooleanProperty(PROP_TRANSPARENCY, true))
    }

    init() {
        this.imageElement = new Image(this.width, this.height); // Using optional size for image
        this.imageElement.onload = () => {
            this.snapshotImage(this.imageElement!);
            this.imageLoaded = true;
            this.requestRepaint();
        }

        this.triggerImageLoad();
    }

    draw(g: Graphics) {
        if (this.imageFile && this.currentImageFile !== this.imageFile) {
            this.triggerImageLoad();
        }

        if (!this.transparency) {
            g.ctx.fillStyle = this.backgroundColor.toString();
            g.ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.imageLoaded) {
            if (this.noAnimation) {
                g.ctx.drawImage(this.imageSnapshot!, this.x, this.y, this.width, this.height);
            } else {
                // Note that GIF animation through canvas does not seem to work in Chrome.
                // In Safari it is working.
                g.ctx.drawImage(this.imageElement!, this.x, this.y, this.width, this.height);
            }
        }
    }

    private triggerImageLoad() {
        this.imageLoaded = false;
        if (this.imageElement && this.imageFile) {
            this.currentImageFile = this.imageFile;
            this.imageElement.src = `${this.display.baseUrl}${this.imageFile}`;
        }
    }

    // Used to "stop" the animation of animated gifs.
    private snapshotImage(image: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
        this.imageSnapshot = canvas;
    }

    get transparency(): boolean { return this.properties.getValue(PROP_TRANSPARENCY); }
    get imageFile(): string { return this.properties.getValue(PROP_IMAGE_FILE); }
    get noAnimation(): boolean { return this.properties.getValue(PROP_NO_ANIMATION); }
}
