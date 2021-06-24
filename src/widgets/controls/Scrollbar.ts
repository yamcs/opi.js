import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { Bounds, Point, shrink } from '../../positioning';
import { BooleanProperty, FloatProperty, FontProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_ENABLED = 'enabled';
const PROP_FONT = 'font';
const PROP_MAXIMUM = 'maximum';
const PROP_MINIMUM = 'minimum';
const PROP_HORIZONTAL = 'horizontal';
const PROP_STEP_INCREMENT = 'step_increment';
const PROP_PAGE_INCREMENT = 'page_increment';
const PROP_BAR_LENGTH = 'bar_length';
const PROP_SHOW_VALUE_TIP = 'show_value_tip';

const BACKGROUND_COLOR = new Color(243, 243, 243);
const BUTTON_COLOR = new Color(232, 232, 231);
const REPEAT_INTERVAL = 150;

export class Scrollbar extends Widget {

    private decreaseRegion?: HitRegionSpecification;
    private decreasePressed = false;
    private increaseRegion?: HitRegionSpecification;
    private increasePressed = false;
    private pageDecreaseRegion?: HitRegionSpecification;
    private pageDecreasePressed = false;
    private pageIncreaseRegion?: HitRegionSpecification;
    private pageIncreasePressed = false;
    private thumbRegion?: HitRegionSpecification;

    // Value when a grab action is initiated
    private grabStartValue?: number;

    // Track width (excluding buttons and thumb)
    private dragRange?: number;

    private actionTimeout?: number;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new BooleanProperty(PROP_ENABLED));
        this.properties.add(new BooleanProperty(PROP_HORIZONTAL));
        this.properties.add(new BooleanProperty(PROP_SHOW_VALUE_TIP));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new FloatProperty(PROP_MAXIMUM));
        this.properties.add(new FloatProperty(PROP_MINIMUM));
        this.properties.add(new FloatProperty(PROP_STEP_INCREMENT));
        this.properties.add(new FloatProperty(PROP_PAGE_INCREMENT));
        this.properties.add(new FloatProperty(PROP_BAR_LENGTH));
    }

    init() {
        this.decreaseRegion = {
            id: `${this.wuid}-decrease`,
            mouseDown: () => {
                this.decreasePressed = true;
                this.stepDecreaseRepeatedly();
            },
            mouseUp: () => {
                window.clearTimeout(this.actionTimeout);
                this.decreasePressed = false;
                this.requestRepaint();
            },
            mouseOut: () => {
                window.clearTimeout(this.actionTimeout);
                this.decreasePressed = false;
                this.requestRepaint();
            },
        };
        this.increaseRegion = {
            id: `${this.wuid}-increase`,
            mouseDown: () => {
                this.increasePressed = true;
                this.stepIncreaseRepeatedly();
            },
            mouseUp: () => {
                window.clearTimeout(this.actionTimeout);
                this.increasePressed = false;
                this.requestRepaint();
            },
            mouseOut: () => {
                window.clearTimeout(this.actionTimeout);
                this.increasePressed = false;
                this.requestRepaint();
            },
        };
        this.thumbRegion = {
            id: `${this.wuid}-thumb`,
            mouseDown: () => {
                this.grabStartValue = this.getCoercedValue();
            },
            grab: (dx, dy) => {
                const delta = this.horizontal ? dx : dy;
                const valueChange = (this.maximum - this.minimum) * delta / this.dragRange!;
                this.setCoercedValue(this.grabStartValue! + valueChange);
                this.requestRepaint();
            }
        };
        this.pageDecreaseRegion = {
            id: `${this.wuid}-page-decrease`,
            mouseDown: () => {
                this.pageDecreasePressed = true;
                this.pageDecreaseRepeatedly();
            },
            mouseUp: () => {
                window.clearTimeout(this.actionTimeout);
                this.pageDecreasePressed = false;
                this.requestRepaint();
            },
            mouseOut: () => {
                window.clearTimeout(this.actionTimeout);
                this.pageDecreasePressed = false;
                this.requestRepaint();
            },
        };
        this.pageIncreaseRegion = {
            id: `${this.wuid}-page-increase`,
            mouseDown: () => {
                this.pageIncreasePressed = true;
                this.pageIncreaseRepeatedly();
            },
            mouseUp: () => {
                window.clearTimeout(this.actionTimeout);
                this.pageIncreasePressed = false;
                this.requestRepaint();
            },
            mouseOut: () => {
                window.clearTimeout(this.actionTimeout);
                this.pageIncreasePressed = false;
                this.requestRepaint();
            },
        };
    }

    draw(g: Graphics) {
        if (this.horizontal) {
            this.drawHorizontal(g);
        } else {
            this.drawVertical(g);
        }
    }

    private drawHorizontal(g: Graphics) {
        const bounds = shrink(this.bounds, 2);
        g.fillRect({ ...bounds, color: BACKGROUND_COLOR });

        const buttonWidth = Math.min(bounds.height, bounds.width / 2);
        this.drawLeftButton(g, {
            x: bounds.x,
            y: bounds.y,
            width: buttonWidth,
            height: bounds.height,
        });
        this.drawRightButton(g, {
            x: bounds.x + bounds.width - buttonWidth,
            y: bounds.y,
            width: buttonWidth,
            height: bounds.height,
        });

        // Thumb
        const extent = this.barLength;
        const max = this.maximum + extent;
        const min = this.minimum;
        const totalRange = max - min;
        const valueRange = totalRange - extent;
        const trackWidth = bounds.width - buttonWidth - buttonWidth;
        const thumbWidth = Math.floor(Math.max(6, trackWidth * extent / totalRange));
        this.dragRange = trackWidth - thumbWidth;

        const currentValue = this.getCoercedValue();
        const leftTrackWidth = Math.floor((trackWidth - thumbWidth) * (currentValue - min) / valueRange);
        const rightTrackWidth = trackWidth - leftTrackWidth - thumbWidth;

        const thumbBounds: Bounds = {
            x: bounds.x + buttonWidth + leftTrackWidth,
            y: bounds.y,
            width: thumbWidth,
            height: bounds.height,
        };
        g.fillRect({ ...thumbBounds, color: BUTTON_COLOR });
        this.drawRaisedButtonBorder(g, thumbBounds);

        const area = g.addHitRegion(this.thumbRegion!);
        area.addRect(thumbBounds.x, thumbBounds.y, thumbBounds.width, thumbBounds.height);

        // Page decrease
        const pageDecreaseBounds: Bounds = {
            x: bounds.x + buttonWidth,
            y: bounds.y,
            width: leftTrackWidth,
            height: bounds.height,
        };
        const pageDecreaseArea = g.addHitRegion(this.pageDecreaseRegion!);
        pageDecreaseArea.addRect(pageDecreaseBounds.x, pageDecreaseBounds.y, pageDecreaseBounds.width, pageDecreaseBounds.height);
        if (this.pageDecreasePressed) {
            g.fillRect({ ...pageDecreaseBounds, color: Color.BLACK });
        }

        // Page increase
        const pageIncreaseBounds: Bounds = {
            x: bounds.x + buttonWidth + leftTrackWidth + thumbWidth,
            y: bounds.y,
            width: rightTrackWidth,
            height: bounds.height,
        };
        const pageIncreaseArea = g.addHitRegion(this.pageIncreaseRegion!);
        pageIncreaseArea.addRect(pageIncreaseBounds.x, pageIncreaseBounds.y, pageIncreaseBounds.width, pageIncreaseBounds.height);
        if (this.pageIncreasePressed) {
            g.fillRect({ ...pageIncreaseBounds, color: Color.BLACK });
        }
    }

    private drawVertical(g: Graphics) {
        const bounds = shrink(this.bounds, 2);
        g.fillRect({ ...bounds, color: BACKGROUND_COLOR });

        const buttonHeight = Math.min(bounds.width, bounds.height / 2);
        this.drawUpButton(g, {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: buttonHeight,
        });
        this.drawDownButton(g, {
            x: bounds.x,
            y: bounds.y + bounds.height - buttonHeight,
            width: bounds.width,
            height: buttonHeight,
        });

        // Thumb
        const extent = this.barLength;
        const max = this.maximum + extent;
        const min = this.minimum;
        const totalRange = max - min;
        const valueRange = totalRange - extent;
        const trackHeight = bounds.height - buttonHeight - buttonHeight;
        const thumbHeight = Math.floor(Math.max(6, trackHeight * extent / totalRange));
        this.dragRange = trackHeight - thumbHeight;

        const currentValue = this.getCoercedValue();
        const northTrackHeight = Math.floor((trackHeight - thumbHeight) * (currentValue - min) / valueRange);
        const southTrackHeight = trackHeight - northTrackHeight - thumbHeight;

        const thumbBounds: Bounds = {
            x: bounds.x,
            y: bounds.y + buttonHeight + northTrackHeight,
            width: bounds.width,
            height: thumbHeight,
        };
        g.fillRect({ ...thumbBounds, color: BUTTON_COLOR });
        this.drawRaisedButtonBorder(g, thumbBounds);

        const area = g.addHitRegion(this.thumbRegion!);
        area.addRect(thumbBounds.x, thumbBounds.y, thumbBounds.width, thumbBounds.height);

        // Page decrease
        const pageDecreaseBounds: Bounds = {
            x: bounds.x,
            y: bounds.y + buttonHeight,
            width: bounds.width,
            height: northTrackHeight,
        };
        const pageDecreaseArea = g.addHitRegion(this.pageDecreaseRegion!);
        pageDecreaseArea.addRect(pageDecreaseBounds.x, pageDecreaseBounds.y, pageDecreaseBounds.width, pageDecreaseBounds.height);
        if (this.pageDecreasePressed) {
            g.fillRect({ ...pageDecreaseBounds, color: Color.BLACK });
        }

        // Page increase
        const pageIncreaseBounds: Bounds = {
            x: bounds.x,
            y: bounds.y + buttonHeight + northTrackHeight + thumbHeight,
            width: bounds.width,
            height: southTrackHeight,
        };
        const pageIncreaseArea = g.addHitRegion(this.pageIncreaseRegion!);
        pageIncreaseArea.addRect(pageIncreaseBounds.x, pageIncreaseBounds.y, pageIncreaseBounds.width, pageIncreaseBounds.height);
        if (this.pageIncreasePressed) {
            g.fillRect({ ...pageIncreaseBounds, color: Color.BLACK });
        }
    }

    private drawLeftButton(g: Graphics, bounds: Bounds) {
        g.fillRect({ ...bounds, color: BUTTON_COLOR });
        this.decreasePressed ? this.drawPressedButtonBorder(g, bounds) : this.drawRaisedButtonBorder(g, bounds);

        const area = g.addHitRegion(this.decreaseRegion!);
        area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const triangleBounds = shrink(bounds, 3);
        let triangleSize = Math.min(triangleBounds.height / 2, triangleBounds.width);
        triangleBounds.x += (triangleBounds.width - triangleSize) / 2;
        triangleSize = Math.max(triangleSize, 1); // No negative

        const head: Point = { x: triangleBounds.x, y: triangleBounds.y + triangleBounds.height / 2 };
        g.fillPath({
            color: Color.BLACK,
            path: new Path(head.x, head.y)
                .lineTo(head.x + triangleSize, head.y - triangleSize)
                .lineTo(head.x + triangleSize, head.y + triangleSize)
                .closePath(),
        });
    }

    private drawRightButton(g: Graphics, bounds: Bounds) {
        g.fillRect({ ...bounds, color: BUTTON_COLOR });
        this.increasePressed ? this.drawPressedButtonBorder(g, bounds) : this.drawRaisedButtonBorder(g, bounds);

        const area = g.addHitRegion(this.increaseRegion!);
        area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const triangleBounds = shrink(bounds, 3);
        let triangleSize = Math.min(triangleBounds.height / 2, triangleBounds.width);
        triangleBounds.x += (triangleBounds.width - triangleSize) / 2;
        triangleSize = Math.max(triangleSize, 1); // No negative

        const head: Point = { x: triangleBounds.x + triangleSize, y: triangleBounds.y + triangleBounds.height / 2 };
        g.fillPath({
            color: Color.BLACK,
            path: new Path(head.x, head.y)
                .lineTo(head.x - triangleSize, head.y - triangleSize)
                .lineTo(head.x - triangleSize, head.y + triangleSize)
                .closePath(),
        });
    }

    private drawUpButton(g: Graphics, bounds: Bounds) {
        g.fillRect({ ...bounds, color: BUTTON_COLOR });
        this.decreasePressed ? this.drawPressedButtonBorder(g, bounds) : this.drawRaisedButtonBorder(g, bounds);

        const area = g.addHitRegion(this.decreaseRegion!);
        area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const triangleBounds = shrink(bounds, 3);
        let triangleSize = Math.min(triangleBounds.height, triangleBounds.width / 2);
        triangleBounds.y += (triangleBounds.height - triangleSize) / 2;
        triangleSize = Math.max(triangleSize, 1); // No negative

        const head: Point = { x: triangleBounds.x + triangleBounds.width / 2, y: triangleBounds.y };
        g.fillPath({
            color: Color.BLACK,
            path: new Path(head.x, head.y)
                .lineTo(head.x - triangleSize, head.y + triangleSize)
                .lineTo(head.x + triangleSize, head.y + triangleSize)
                .closePath(),
        });
    }

    private drawDownButton(g: Graphics, bounds: Bounds) {
        g.fillRect({ ...bounds, color: BUTTON_COLOR });
        this.increasePressed ? this.drawPressedButtonBorder(g, bounds) : this.drawRaisedButtonBorder(g, bounds);

        const area = g.addHitRegion(this.increaseRegion!);
        area.addRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const triangleBounds = shrink(bounds, 3);
        let triangleSize = Math.min(triangleBounds.height, triangleBounds.width / 2);
        triangleBounds.y += (triangleBounds.height - triangleSize) / 2;
        triangleSize = Math.max(triangleSize, 1); // No negative

        const head: Point = { x: triangleBounds.x + triangleBounds.width / 2, y: triangleBounds.y + triangleSize };
        g.fillPath({
            color: Color.BLACK,
            path: new Path(head.x, head.y)
                .lineTo(head.x - triangleSize, head.y - triangleSize)
                .lineTo(head.x + triangleSize, head.y - triangleSize)
                .closePath(),
        });
    }

    private drawRaisedButtonBorder(g: Graphics, bounds: Bounds) {
        this.drawButtonBorder(g, bounds, Color.BUTTON_DARKEST, Color.BUTTON_DARKER,
            Color.BUTTON, Color.BUTTON_LIGHTEST);
    }

    private drawPressedButtonBorder(g: Graphics, bounds: Bounds) {
        this.drawButtonBorder(g, bounds, Color.BUTTON_LIGHTEST, Color.BUTTON_LIGHTEST,
            Color.BUTTON_DARKEST, Color.BUTTON_DARKER);
    }

    private drawButtonBorder(g: Graphics, bounds: Bounds, c1: Color, c2: Color, c3: Color, c4: Color) {
        const top = bounds.y + 0.5;
        const left = bounds.x + 0.5;
        const bottom = bounds.y + bounds.height - 1 + 0.5;
        const right = bounds.x + bounds.width - 1 + 0.5;
        g.strokePath({
            color: c1,
            path: new Path(right, bottom)
                .lineTo(right, top)
                .moveTo(right, bottom)
                .lineTo(left, bottom)
        });
        g.strokePath({
            color: c2,
            path: new Path(right - 1, bottom - 1)
                .lineTo(right - 1, top + 1)
                .moveTo(right - 1, bottom - 1)
                .lineTo(left + 1, bottom - 1)
        });
        g.strokePath({
            color: c3,
            path: new Path(left, top)
                .lineTo(right - 1, top)
                .moveTo(left, top)
                .lineTo(left, bottom - 1)
        });
        g.strokePath({
            color: c4,
            path: new Path(left + 1, top + 1)
                .lineTo(right - 1 - 1, top + 1)
                .moveTo(left + 1, top + 1)
                .lineTo(left + 1, bottom - 1 - 1)
        });
    }

    private stepIncreaseRepeatedly() {
        window.clearTimeout(this.actionTimeout);
        this.stepIncrease();
        this.requestRepaint();
        this.actionTimeout = window.setTimeout(() => this.stepIncreaseRepeatedly(), REPEAT_INTERVAL);
    }

    private stepDecreaseRepeatedly() {
        window.clearTimeout(this.actionTimeout);
        this.stepDecrease();
        this.requestRepaint();
        this.actionTimeout = window.setTimeout(() => this.stepDecreaseRepeatedly(), REPEAT_INTERVAL);
    }

    private stepIncrease() {
        const currentValue = this.pv?.value ?? (this.maximum - this.minimum) / 2;
        this.setCoercedValue(currentValue + this.stepIncrement);
    }

    private stepDecrease() {
        const currentValue = this.pv?.value ?? (this.maximum - this.minimum) / 2;
        this.setCoercedValue(currentValue - this.stepIncrement);
    }

    private pageIncreaseRepeatedly() {
        window.clearTimeout(this.actionTimeout);
        this.pageIncrease();
        this.requestRepaint();
        this.actionTimeout = window.setTimeout(() => this.pageIncreaseRepeatedly(), REPEAT_INTERVAL);
    }

    private pageDecreaseRepeatedly() {
        window.clearTimeout(this.actionTimeout);
        this.pageDecrease();
        this.requestRepaint();
        this.actionTimeout = window.setTimeout(() => this.pageDecreaseRepeatedly(), REPEAT_INTERVAL);
    }

    private pageIncrease() {
        const currentValue = this.pv?.value ?? (this.maximum - this.minimum) / 2;
        this.setCoercedValue(currentValue + this.pageIncrement);
    }

    private pageDecrease() {
        const currentValue = this.pv?.value ?? (this.maximum - this.minimum) / 2;
        this.setCoercedValue(currentValue - this.pageIncrement);
    }

    private setCoercedValue(value: number) {
        if (this.pv && this.pv.writable) {
            value = value < this.minimum ? this.minimum : (value > this.maximum ? this.maximum : value);
            this.display.pvEngine.setValue(new Date(), this.pv.name, value);
        }
    }

    private getCoercedValue() {
        const value = this.pv?.value ?? (this.maximum - this.minimum) / 2;
        return value < this.minimum ? this.minimum : (value > this.maximum ? this.maximum : value);
    }

    destroy() {
        window.clearTimeout(this.actionTimeout);
    }

    get enabled(): boolean { return this.properties.getValue(PROP_ENABLED); }
    get horizontal(): boolean { return this.properties.getValue(PROP_HORIZONTAL); }
    get showValueTip(): boolean { return this.properties.getValue(PROP_SHOW_VALUE_TIP); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get stepIncrement(): number { return this.properties.getValue(PROP_STEP_INCREMENT); }
    get pageIncrement(): number { return this.properties.getValue(PROP_PAGE_INCREMENT); }
    get barLength(): number { return this.properties.getValue(PROP_BAR_LENGTH); }
}
