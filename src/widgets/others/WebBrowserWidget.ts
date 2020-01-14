import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_URL = 'url';

export class WebBrowserWidget extends Widget {

    private iframe?: HTMLIFrameElement;
    private prevUrl?: string;

    constructor(display: Display) {
        super(display);
        this.properties.add(new StringProperty(PROP_URL));
    }

    init() {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'https://yamcs.org';
        this.iframe.style.display = 'none';
        this.iframe.style.border = '0';
        this.display.rootPanel.appendChild(this.iframe);
    }

    draw(g: Graphics) {
        if (this.iframe) {
            this.iframe.style.position = 'absolute';
            this.iframe.style.display = 'block';
            this.iframe.style.left = `${this.x}px`;
            this.iframe.style.top = `${this.y}px`;
            this.iframe.style.width = `${this.width}px`;
            this.iframe.style.height = `${this.height}px`;
            if (this.url && this.prevUrl !== this.url) {
                this.iframe.src = this.url;
                this.prevUrl = this.url;
            }
        }
    }

    get url(): string { return this.properties.getValue(PROP_URL); }
}
