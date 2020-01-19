import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { BooleanProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_FONT = 'font';
const PROP_PUSH_ACTION_INDEX = 'push_action_index';
const PROP_RELEASE_ACTION_INDEX = 'release_action_index';
const PROP_TOGGLE_BUTTON = 'toggle_button';
const PROP_IMAGE = 'image';

export class ActionButton extends Widget {

    private areaRegion?: HitRegionSpecification;

    private pushed = false;

    private imageElement?: HTMLImageElement;
    private imageLoaded = false;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
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
            };
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

    draw(g: Graphics) {
        const ctx = g.ctx;

        g.fillRect({
            ...this.area,
            color: this.backgroundColor,
        });

        const hitRegion = g.addHitRegion(this.areaRegion!);
        hitRegion.addRect(this.x, this.y, this.width, this.height);

        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;

        g.strokePath({
            lineWidth: 1,
            color: this.pushed ? Color.BUTTON_LIGHTEST : Color.BLACK,
            path: new Path(right, bottom)
                .lineTo(right, top)
                .moveTo(right, bottom)
                .lineTo(left, bottom),
        });

        g.strokePath({
            lineWidth: 1,
            color: this.pushed ? this.backgroundColor : Color.BUTTON_DARKER,
            path: new Path(right - 1, bottom - 1)
                .lineTo(right - 1, top + 1)
                .moveTo(right - 1, bottom - 1)
                .lineTo(left + 1, bottom - 1),
        });

        g.strokePath({
            lineWidth: 1,
            color: this.pushed ? Color.BLACK : Color.BUTTON_LIGHTEST,
            path: new Path(left, top)
                .lineTo(right - 1, top)
                .moveTo(left, top)
                .lineTo(left, bottom - 1),
        });

        g.strokePath({
            lineWidth: 1,
            color: this.pushed ? Color.BUTTON_DARKER : this.backgroundColor,
            path: new Path(left + 1, top + 1)
                .lineTo(right - 1 - 1, top + 1)
                .moveTo(left + 1, top + 1)
                .lineTo(left + 1, bottom - 1 - 1),
        });

        const lines = this.text.split('\n');

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        // Calculate available space in height and width
        let x;
        let y;
        if (this.imageElement && this.imageLoaded) {
            const textWidth = ctx.measureText(lines[0]).width;
            const textHeight = this.font.height;

            const hratio = (this.height - this.imageElement.naturalHeight) / textHeight;
            const wratio = (this.width - this.imageElement.naturalWidth) / textWidth;
            if (wratio > hratio) { // Text right of icon
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                x = this.x + (this.width - textWidth) / 2 + 5 /* magic spacer */;
                y = this.y + (this.height / 2);

                const imageX = this.x + (this.width - textWidth) / 2 - this.imageElement.naturalWidth;
                const imageY = this.y + (this.height - this.imageElement.naturalHeight) / 2;
                ctx.drawImage(this.imageElement, imageX, imageY);
            } else { // Text under icon
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const contentHeight = textHeight + this.imageElement.naturalHeight;
                x = this.x + (this.width / 2);
                y = this.y + (this.height - contentHeight) / 2 + this.imageElement.naturalHeight;
                const imageX = this.x + (this.width - this.imageElement.naturalWidth) / 2;
                const imageY = this.y + (this.height - contentHeight) / 2;
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

    // Some widget instances don't seem to have this property and use a specific default.
    get backgroundColor(): Color {
        const prop = this.properties.getProperty('background_color');
        if (prop && prop.value !== Color.TRANSPARENT) {
            return prop.value;
        } else {
            return Color.BUTTON;
        }
    }
}
