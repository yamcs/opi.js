import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from './AbstractContainerWidget';

const PROP_URL = 'url';

export class WebBrowser extends Widget {

    private iframe?: HTMLIFrameElement;
    private prevUrl?: string;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
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
            const { x, y, width, height } = this.display.measureAbsoluteArea(g, this);
            this.iframe.style.position = 'absolute';
            this.iframe.style.display = 'block';
            this.iframe.style.left = `${x}px`;
            this.iframe.style.top = `${y}px`;
            this.iframe.style.width = `${width}px`;
            this.iframe.style.height = `${height}px`;
            if (this.url && this.prevUrl !== this.url) {
                this.iframe.src = this.url;
                this.prevUrl = this.url;
            }
        }
    }

    hide() {
        if (this.iframe) {
            this.iframe.style.display = 'none';
        }
    }

    destroy() {
        if (this.iframe) {
            this.display.rootPanel.removeChild(this.iframe);
            this.iframe = undefined;
        }
    }

    get url(): string { return this.properties.getValue(PROP_URL); }
}
