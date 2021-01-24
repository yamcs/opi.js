import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { BooleanProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_BIT = 'bit';
const PROP_DATA_TYPE = 'data_type';
const PROP_OFF_IMAGE = 'off_image';
const PROP_OFF_LABEL = 'off_label';
const PROP_FONT = 'font';
const PROP_ON_IMAGE = 'on_image';
const PROP_ON_LABEL = 'on_label';
const PROP_SHOW_BOOLEAN_LABEL = 'show_boolean_label';

export class ImageBooleanIndicator extends Widget {

    private onImageElement?: HTMLImageElement;
    private onImageLoaded = false;

    private offImageElement?: HTMLImageElement;
    private offImageLoaded = false;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_BIT));
        this.properties.add(new IntProperty(PROP_DATA_TYPE));
        this.properties.add(new StringProperty(PROP_OFF_IMAGE));
        this.properties.add(new StringProperty(PROP_OFF_LABEL));
        this.properties.add(new StringProperty(PROP_ON_IMAGE));
        this.properties.add(new StringProperty(PROP_ON_LABEL));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_SHOW_BOOLEAN_LABEL));
    }

    init() {
        this.onImageElement = new Image();
        this.onImageElement.onload = () => {
            this.onImageLoaded = true;
            this.requestRepaint();
        };
        this.offImageElement = new Image();
        this.offImageElement.onload = () => {
            this.offImageLoaded = true;
            this.requestRepaint();
        };

        if (this.onImage) {
            this.onImageElement.src = `${this.display.baseUrl}${this.onImage}`;
        }
        if (this.offImage) {
            this.offImageElement.src = `${this.display.baseUrl}${this.offImage}`;
        }
    }

    get booleanValue() {
        if (this.bit < 0) {
            return Boolean(this.pv?.toNumber());
        } else if (this.pv?.value !== undefined) {
            return ((this.pv?.value >> this.bit) & 1) > 0;
        } else {
            return false;
        }
    }

    get image(): string {
        return this.booleanValue ? this.onImage : this.offImage;
    }

    get label(): string {
        return this.booleanValue ? this.onLabel : this.offLabel;
    }

    draw(g: Graphics) {
        if (!this.transparent) {
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }

        if (this.booleanValue) {
            if (this.onImageLoaded) {
                g.ctx.drawImage(this.onImageElement!, this.x, this.y, this.width, this.height);
            }
        } else {
            if (this.offImageLoaded) {
                g.ctx.drawImage(this.offImageElement!, this.x, this.y, this.width, this.height);
            }
        }

        if (this.showBooleanLabel) {
            g.fillText({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                font: this.font,
                baseline: 'middle',
                align: 'center',
                color: this.foregroundColor,
                text: this.label,
            });
        }
    }

    get bit(): number { return this.properties.getValue(PROP_BIT); }
    get dataType(): number { return this.properties.getValue(PROP_DATA_TYPE); }
    get showBooleanLabel(): boolean { return this.properties.getValue(PROP_SHOW_BOOLEAN_LABEL); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get offLabel(): string { return this.properties.getValue(PROP_OFF_LABEL); }
    get offImage(): string { return this.properties.getValue(PROP_OFF_IMAGE); }
    get onLabel(): string { return this.properties.getValue(PROP_ON_LABEL); }
    get onImage(): string { return this.properties.getValue(PROP_ON_IMAGE); }
}
