import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitCanvas } from '../../HitCanvas';
import { HitRegion } from '../../HitRegion';
import { BooleanProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';

const PROP_FONT = 'font';
const PROP_PUSH_ACTION_INDEX = 'push_action_index';
const PROP_RELEASE_ACTION_INDEX = 'release_action_index';
const PROP_TOGGLE_BUTTON = 'toggle_button';
const PROP_IMAGE = 'image';

export class ActionButton extends Widget {

    private areaRegion?: HitRegion;

    private pushed = false;

    private imageElement?: HTMLImageElement;
    private imageLoaded = false;

    constructor(display: Display) {
        super(display);
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_TOGGLE_BUTTON));
        this.properties.add(new IntProperty(PROP_PUSH_ACTION_INDEX));
        this.properties.add(new IntProperty(PROP_RELEASE_ACTION_INDEX));
        this.properties.add(new StringProperty(PROP_IMAGE));
    }

    init() {
        if (this.image) {
            this.imageElement = new Image();
            this.imageElement.onload = () => {
                this.imageLoaded = true;
                this.requestRepaint();
            }
            this.imageElement.src = `${this.display.baseUrl}${this.image}`;
        }

        this.areaRegion = {
            id: `${this.wuid}-area`,
            mouseDown: () => {
                if (!this.toggleButton) {
                    this.pushed = true;
                    this.requestRepaint();
                }
            },
            mouseOut: () => {
                this.pushed = false;
                this.requestRepaint();
            },
            mouseUp: () => {
                if (!this.toggleButton) {
                    this.pushed = false;
                    this.requestRepaint();
                }
            },
            click: () => {
                this.executeAction(this.pushed ? this.releaseActionIndex! : this.pushActionIndex);
                if (this.toggleButton) {
                    this.pushed = !this.pushed;
                }
            },
            cursor: 'pointer'
        };
    }

    draw(g: Graphics, hitCanvas: HitCanvas) {
        const ctx = g.ctx;
        ctx.fillStyle = (this.backgroundColor || Color.BUTTON).toString();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        hitCanvas.beginHitRegion(this.areaRegion!);
        hitCanvas.ctx.fillRect(this.x, this.y, this.width, this.height);

        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;

        let shadow1 = Color.BLACK;
        let shadow2 = Color.BUTTON_DARKER;
        let hl1 = Color.BUTTON_LIGHTEST;
        let hl2 = this.backgroundColor || Color.BUTTON;
        if (this.pushed) {
            shadow1 = hl1;
            shadow2 = hl2;
            hl1 = Color.BLACK;
            hl2 = Color.BUTTON_DARKER;
        }

        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(right, bottom);
        ctx.lineTo(right, top);
        ctx.moveTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.strokeStyle = shadow1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(right - 1, bottom - 1);
        ctx.lineTo(right - 1, top + 1);
        ctx.moveTo(right - 1, bottom - 1);
        ctx.lineTo(left + 1, bottom - 1);
        ctx.strokeStyle = shadow2.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right - 1, top);
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom - 1);
        ctx.strokeStyle = hl1.toString();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left + 1, top + 1);
        ctx.lineTo(right - 1 - 1, top + 1);
        ctx.moveTo(left + 1, top + 1);
        ctx.lineTo(left + 1, bottom - 1 - 1);
        ctx.strokeStyle = hl2.toString();
        ctx.stroke();

        const lines = this.text.split('\n');

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        // Calculate available space in height and width
        let x;
        let y;
        if (this.imageElement && this.imageLoaded) {
            const textWidth = ctx.measureText(lines[0]).width;
            const textHeight = this.font.height;

            const hratio = (this.height - this.imageElement.height) / textHeight;
            const wratio = (this.width - this.imageElement.width) / textWidth;
            if (wratio > hratio) { // Text right of icon
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                x = this.x + (this.width - textWidth) / 2 + 5 /* magic spacer */;
                y = this.y + (this.height / 2);

                const imageX = this.x + (this.width - textWidth) / 2 - this.imageElement.width;
                const imageY = this.y + (this.height - this.imageElement.height) / 2;
                ctx.drawImage(this.imageElement, imageX, imageY);
            } else { // Text under icon
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                x = this.x + (this.width / 2);
                y = this.y + (this.height - textHeight) / 2 + 5 /* magic spacer */;
                const imageX = this.x + (this.width - this.imageElement.width) / 2;
                const imageY = this.y + (this.height - textHeight) / 2 - this.imageElement.height;
                ctx.drawImage(this.imageElement, imageX, imageY);
            }
        } else {
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            x = this.x + (this.width / 2);
            y = this.y + (this.height / 2);
        }

        if (this.pushed) {
            x += 1;
            y += 1;
        }
        ctx.fillText(lines[0], x, y);
    }

    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get image(): string { return this.properties.getValue(PROP_IMAGE); }
    get toggleButton(): boolean { return this.properties.getValue(PROP_TOGGLE_BUTTON); }
    get pushActionIndex(): number { return this.properties.getValue(PROP_PUSH_ACTION_INDEX); }
    get releaseActionIndex(): number { return this.properties.getValue(PROP_RELEASE_ACTION_INDEX); }
}
