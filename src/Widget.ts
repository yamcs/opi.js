import { ActionSet } from './actions';
import { Color } from './Color';
import { Display } from './Display';
import { Font } from './Font';
import { Graphics } from './Graphics';
import { HitCanvas } from './HitCanvas';
import { HitRegion } from './HitRegion';
import { toBorderBox } from './positioning';
import { ActionsProperty, BooleanProperty, ColorProperty, IntProperty, PropertySet, StringProperty } from './properties';
import { PV } from './pv/PV';
import { Script } from './scripting/Script';
import { XMLNode } from './XMLNode';

const PROP_ACTIONS = 'actions';
const PROP_BACKGROUND_COLOR = 'background_color';
const PROP_BORDER_ALARM_SENSITIVE = 'border_alarm_sensitive';
const PROP_BORDER_COLOR = 'border_color';
const PROP_BORDER_WIDTH = 'border_width';
const PROP_BORDER_STYLE = 'border_style';
const PROP_FOREGROUND_COLOR = 'foreground_color';
const PROP_HEIGHT = 'height';
const PROP_NAME = 'name';
const PROP_PV_NAME = 'pv_name';
const PROP_TEXT = 'text';
const PROP_TRANSPARENT = 'transparent';
const PROP_VISIBLE = 'visible';
const PROP_WIDGET_TYPE = 'widget_type';
const PROP_WIDTH = 'width';
const PROP_WUID = 'wuid';
const PROP_X = 'x';
const PROP_Y = 'y';

export abstract class Widget {

    insets: [number, number, number, number] = [0, 0, 0, 0]; // T L B R

    // bbox around the widget (excluding border)
    x = 0;
    y = 0;
    width = 0;
    height = 0;

    // Some widgets ignore the fill of this border (only the stroke).
    // (Rectangle, RoundedRectangle)
    protected fillRoundRectangleBackgroundBorder = true;

    properties: PropertySet;

    holderRegion?: HitRegion;

    constructor(readonly display: Display) {
        this.properties = new PropertySet(display, [
            new ActionsProperty(PROP_ACTIONS, new ActionSet()),
            new ColorProperty(PROP_BACKGROUND_COLOR, Color.TRANSPARENT),
            new BooleanProperty(PROP_BORDER_ALARM_SENSITIVE, false),
            new ColorProperty(PROP_BORDER_COLOR),
            new IntProperty(PROP_BORDER_STYLE),
            new IntProperty(PROP_BORDER_WIDTH),
            new ColorProperty(PROP_FOREGROUND_COLOR),
            new IntProperty(PROP_HEIGHT),
            new StringProperty(PROP_NAME),
            new StringProperty(PROP_PV_NAME),
            new StringProperty(PROP_TEXT, ''),
            new BooleanProperty(PROP_TRANSPARENT, false),
            new BooleanProperty(PROP_VISIBLE),
            new StringProperty(PROP_WIDGET_TYPE),
            new IntProperty(PROP_WIDTH),
            new StringProperty(PROP_WUID),
            new IntProperty(PROP_X),
            new IntProperty(PROP_Y),
        ]);
    }

    parseNode(node: XMLNode) {
        this.properties.loadXMLValues(node);

        this.insets = [0, 0, 0, 0];
        switch (this.borderStyle) {
            case 0: // Empty
                if (this.borderAlarmSensitive) {
                    // TODO reevaluate the condition for these insets
                    // (at least the TextUpdate does not seem to need this)
                    ///this.insets = [2, 2, 2, 2];
                }
                break;
            case 1: // Line
                this.insets = [this.borderWidth, this.borderWidth, this.borderWidth, this.borderWidth];
                break;
            case 2: // Raised
            case 3: // Lowered
                this.insets = [1, 1, 1, 1];
                break;
            case 4: // Etched
            case 5: // Ridged
            case 6: // Button Raised
                this.insets = [2, 2, 2, 2];
                break;
            case 7: // Button Pressed
                this.insets = [2, 2, 1, 1];
                break;
            case 8: // Dot
            case 9: // Dash
            case 10: // Dash Dot
            case 11: // Dash Dot Dot
                this.insets = [this.borderWidth, this.borderWidth, this.borderWidth, this.borderWidth];
                break;
            case 12: // Title Bar
                this.insets = [16 + 1, 1, 1, 1];
                break;
            case 13: // Group Box
                this.insets = [16, 16, 16, 16];
                break;
            case 14: // Round Rectangle Background
                const i = this.borderWidth * 2;
                this.insets = [i, i, i, i];
                break;
        }

        console.log('insets for', this.name, this.insets);

        // Shrink the available widget area
        this.x = this.holderX + this.insets[1];
        this.y = this.holderY + this.insets[0];
        this.width = this.holderWidth - this.insets[1] - this.insets[3];
        this.height = this.holderHeight - this.insets[0] - this.insets[2];

        if (this.actions.isClickable()) {
            this.holderRegion = {
                id: `${this.wuid}-holder`,
                click: () => this.onHolderClick(),
                cursor: 'pointer'
            }
        }

        if (this.pvName) {
            this.display.pvEngine.createPV(this.pvName);
        }

        this.init();
    }

    onHolderClick() {
        for (const idx of this.actions.getClickActions()) {
            this.executeAction(idx);
        }
    }

    drawHolder(g: Graphics, hitCanvas: HitCanvas) {
        if (this.borderStyle === 0) { // No border
            // This is a weird one. When there is no border the widget
            // shrinks according to an inset of 2px. This only happens when
            // the border is alarm-sensitive.
            if (this.borderAlarmSensitive) {
                // anything TODO ?
            }
        } else if (this.borderStyle === 1) { // Line
            g.strokeRect({
                x: this.holderX,
                y: this.holderY,
                width: this.holderWidth,
                height: this.holderHeight,
                color: this.borderColor,
                lineWidth: this.borderWidth,
                crispen: true,
            });
        } else if (this.borderStyle === 2) { // Raised
            const top = this.holderY + 0.5;
            const left = this.holderX + 0.5;
            const bottom = this.holderY + this.holderHeight - 1 + 0.5;
            const right = this.holderX + this.holderWidth - 1 + 0.5;
            g.path(right, bottom)
                .lineTo(right, top)
                .moveTo(right, bottom)
                .lineTo(left, bottom)
                .stroke({ color: Color.BLACK });
            g.path(left, top)
                .lineTo(right - 1, top)
                .moveTo(left, top)
                .lineTo(left, bottom - 1)
                .stroke({ color: Color.WHITE });
        } else if (this.borderStyle === 3) { // Lowered
            const top = this.holderY + 0.5;
            const left = this.holderX + 0.5;
            const bottom = this.holderY + this.holderHeight - 1 + 0.5;
            const right = this.holderX + this.holderWidth - 1 + 0.5;
            g.path(right, bottom)
                .lineTo(right, top)
                .moveTo(right, bottom)
                .lineTo(left, bottom)
                .stroke({ color: Color.WHITE });
            g.path(left, top)
                .lineTo(right - 1, top)
                .moveTo(left, top)
                .lineTo(left, bottom - 1)
                .stroke({ color: Color.BLACK });
        } else if (this.borderStyle === 4) { // Etched
            this.drawShadowBorder(g, Color.BUTTON_LIGHTEST, Color.BUTTON_DARKER,
                Color.BUTTON_DARKER, Color.BUTTON_LIGHTEST);
        } else if (this.borderStyle === 5) { // Ridged
            this.drawShadowBorder(g, Color.BUTTON_DARKER, Color.BUTTON_LIGHTEST,
                Color.BUTTON_LIGHTEST, Color.BUTTON_DARKER);
        } else if (this.borderStyle === 6) { // Button Raised
            this.drawShadowBorder(g, Color.BUTTON_DARKEST, Color.BUTTON_DARKER,
                Color.BUTTON, Color.BUTTON_LIGHTEST);
        } else if (this.borderStyle === 7) { // Button Pressed
            this.drawShadowBorder(g, Color.BUTTON_LIGHTEST, Color.BUTTON_LIGHTEST,
                Color.BUTTON_DARKEST, Color.BUTTON_DARKER);
        } else if (this.borderStyle === 8) { // Dot
            this.drawDashedBorder(g, [2, 2]);
        } else if (this.borderStyle === 9) { // Dash
            this.drawDashedBorder(g, [6, 2]);
        } else if (this.borderStyle === 10) { // Dash Dot
            this.drawDashedBorder(g, [6, 2, 2, 2]);
        } else if (this.borderStyle === 11) { // Dash Dot Dot
            this.drawDashedBorder(g, [6, 2, 2, 2, 2, 2]);
        } else if (this.borderStyle === 12) { // Title bar
            g.fillRect({
                x: this.holderX,
                y: this.holderY + 1,
                width: this.holderWidth,
                height: 16,
                color: this.borderColor,
            });
            g.fillText({
                x: this.holderX + 1 + 3,
                y: this.holderY + 1 + (16 / 2),
                baseline: 'middle',
                align: 'left',
                font: Font.ARIAL_11,
                color: Color.BLACK,
                text: this.name,
            });
            g.strokeRect({
                x: this.holderX,
                y: this.holderY,
                width: this.holderWidth,
                height: this.holderHeight,
                color: Color.BLACK,
                crispen: true,
            });
        } else if (this.borderStyle === 13) { // Group Box
            if (!this.transparent) {
                g.fillRect({
                    x: this.holderX,
                    y: this.holderY,
                    width: this.holderWidth,
                    height: this.holderHeight,
                    color: this.backgroundColor,
                });
            }

            g.fillText({
                x: this.holderX + 16,
                y: this.holderY + 8,
                baseline: 'middle',
                align: 'left',
                font: Font.ARIAL_11,
                color: this.borderColor,
                text: this.name,
            });

            // Avoid drawing border over text
            const fm = g.measureText(this.name, Font.ARIAL_11);

            let box = toBorderBox(this.holderX + 8, this.holderY + 8, this.holderWidth - 16 - 1, this.holderHeight - 16 - 1, 1);

            g.path(box.x, box.y)
                .lineTo(box.x + 8, box.y)
                .moveTo(box.x + 8 + fm.width, box.y)
                .lineTo(box.x + box.width, box.y)
                .lineTo(box.x + box.width, box.y + box.height)
                .lineTo(box.x, box.y + box.height)
                .lineTo(box.x, box.y)
                .stroke({ color: this.backgroundColor.darker() });

            box = toBorderBox(this.holderX + 8 + 1, this.holderY + 8 + 1, this.holderWidth - 16 - 1, this.holderHeight - 16 - 1, 1);

            g.path(box.x, box.y)
                .lineTo(box.x + 8 - 1, box.y)
                .moveTo(box.x + 8 - 1 + fm.width, box.y)
                .lineTo(box.x + box.width, box.y)
                .lineTo(box.x + box.width, box.y + box.height)
                .lineTo(box.x, box.y + box.height)
                .lineTo(box.x, box.y)
                .stroke({ color: this.backgroundColor.brighter() });
        } else if (this.borderStyle === 14) { // Round Rectangle Background
            const box = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, this.borderWidth);

            if (this.fillRoundRectangleBackgroundBorder) {
                g.fillRect({
                    ...box,
                    rx: 4,
                    ry: 4,
                    color: this.backgroundColor,
                });
            }
            if (this.borderWidth) {
                g.strokeRect({
                    ...box,
                    rx: 4,
                    ry: 4,
                    color: this.borderColor,
                    lineWidth: this.borderWidth,
                });
            }
        } else if (this.borderStyle === 15) { // Empty
            // NOP
        } else {
            console.warn(`Unsupported border style: ${this.borderStyle}`);
        }

        if (this.holderRegion) {
            hitCanvas.beginHitRegion(this.holderRegion);
            hitCanvas.ctx.fillRect(this.holderX, this.holderY, this.holderWidth, this.holderHeight);
        }
    }

    drawDecoration(g: Graphics) {
        if (!this.display.editMode) {
            if (this.pvName && !this.pv) { // Disconnected
                g.ctx.globalAlpha = 0.4;
                g.fillRect({
                    x: this.holderX - 0.5,
                    y: this.holderY - 0.5,
                    width: this.holderWidth + 1,
                    height: this.holderHeight + 1,
                    color: Color.PURPLE,
                });
                g.ctx.globalAlpha = 1;
                g.strokeRect({
                    x: this.holderX - 0.5,
                    y: this.holderY - 0.5,
                    width: this.holderWidth + 1,
                    height: this.holderHeight + 1,
                    color: Color.PURPLE,
                });
            } else if (this.pv && this.pv.value === undefined) { // Connected, but no value
                const box = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, 2);
                g.strokeRect({
                    ...box,
                    dash: [2, 2],
                    lineWidth: 2,
                    color: Color.PINK,
                });
            }
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.strokeRect(this.holderX - 0.5, this.holderY - 0.5, this.holderWidth + 1, this.holderHeight + 1);
        ctx.fillStyle = 'black';
        let r = 2;
        ctx.fillRect(this.holderX - r, this.holderY - r, r + r, r + r);
        ctx.fillRect(this.holderX + this.holderWidth / 2 - r, this.holderY - r, r + r, r + r);
        ctx.fillRect(this.holderX + this.holderWidth - r, this.holderY - r, r + r, r + r);

        ctx.fillRect(this.holderX - r, this.holderY + this.holderHeight / 2 - r, r + r, r + r);
        ctx.fillRect(this.holderX + this.holderWidth - r, this.holderY + this.holderHeight / 2 - r, r + r, r + r);

        ctx.fillRect(this.holderX - r, this.holderY + this.holderHeight - r, r + r, r + r);
        ctx.fillRect(this.holderX + this.holderWidth / 2 - r, this.holderY + this.holderHeight - r, r + r, r + r);
        ctx.fillRect(this.holderX + this.holderWidth - r, this.holderY + this.holderHeight - r, r + r, r + r);

        ctx.strokeStyle = 'white';
        r = 3;
        ctx.strokeRect(this.holderX - r + 0.5, this.holderY - r + 0.5, r + r - 1, r + r - 1);
        ctx.strokeRect(this.holderX + this.holderWidth / 2 - r + 0.5, this.holderY - r + 0.5, r + r - 1, r + r - 1);
        ctx.strokeRect(this.holderX + this.holderWidth - r + 0.5, this.holderY - r + 0.5, r + r - 1, r + r - 1);

        ctx.strokeRect(this.holderX - r + 0.5, this.holderY + this.holderHeight / 2 - r + 0.5, r + r - 1, r + r - 1);
        ctx.strokeRect(this.holderX + this.holderWidth - r + 0.5, this.holderY + this.holderHeight / 2 - r + 0.5, r + r - 1, r + r - 1);

        ctx.strokeRect(this.holderX - r + 0.5, this.holderY + this.holderHeight - r + 0.5, r + r - 1, r + r - 1);
        ctx.strokeRect(this.holderX + this.holderWidth / 2 - r + 0.5, this.holderY + this.holderHeight - r + 0.5, r + r - 1, r + r - 1);
        ctx.strokeRect(this.holderX + this.holderWidth - r + 0.5, this.holderY + this.holderHeight - r + 0.5, r + r - 1, r + r - 1);
    }

    requestRepaint() {
        this.display.requestRepaint();
    }

    private drawShadowBorder(g: Graphics, c1: Color, c2: Color, c3: Color, c4: Color) {
        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;
        g.path(right, bottom)
            .lineTo(right, bottom)
            .moveTo(right, bottom)
            .lineTo(left, bottom)
            .stroke({ color: c1 });
        g.path(right - 1, bottom - 1)
            .lineTo(right - 1, top + 1)
            .moveTo(right - 1, bottom - 1)
            .lineTo(left + 1, bottom - 1)
            .stroke({ color: c2 });
        g.path(left, top)
            .lineTo(right - 1, top)
            .moveTo(left, top)
            .lineTo(left, bottom - 1)
            .stroke({ color: c3 });
        g.path(left + 1, top + 1)
            .lineTo(right - 1 - 1, top + 1)
            .moveTo(left + 1, top + 1)
            .lineTo(left + 1, bottom - 1 - 1)
            .stroke({ color: c4 });
    }

    private drawDashedBorder(g: Graphics, dash: number[]) {
        const bbox = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, this.borderWidth);
        g.path(bbox.x, bbox.y)
            .lineTo(bbox.x + bbox.width, bbox.y)
            .lineTo(bbox.x + bbox.width, bbox.y + bbox.height)
            .lineTo(bbox.x, bbox.y + bbox.height)
            .closePath()
            .stroke({
                color: this.borderColor,
                lineWidth: this.borderWidth,
                dash,
            });
    }

    protected executeAction(index: number) {
        const action = this.actions.getAction(index);
        if (!action) {
            return;
        }

        switch (action.type) {
            case 'OPEN_DISPLAY':
                if (action.mode === 0) { // Replace current display
                    this.display.setSource(action.path);
                } else { // Open in new window
                    // TODO, just generate event?
                    console.warn('An action requested to open an external display');
                }
                break;
            case 'EXECUTE_JAVASCRIPT':
                if (action.embedded) {
                    const script = new Script(this.display, action.text!);
                    script.run();
                } else {
                    console.warn('An action requested to run an external script');
                    /*const path = this.display.resolve(action.path!);
                    this.display.displayCommunicator.getObject('displays', path).then(response => {
                        response.text().then(text => {
                            const script = new Script(this.display, text);
                            script.run();
                        });
                    });*/
                }
                break;
            case 'WRITE_PV':
                if (action.pvName) {
                    const pvName = this.properties.expandMacro(action.pvName);
                    this.display.pvEngine.setValue(pvName, action.value);
                }
                break;
            case 'PLAY_SOUND':
                if (action.path) {
                    const audio = new Audio('/raw/' + action.path);
                    audio.play();
                }
                break;
            case 'OPEN_WEBPAGE':
                if (action.hyperlink) {
                    window.location.href = action.hyperlink;
                }
                break;
            default:
                throw new Error(`Unsupported command ${action.type}`);
        }
    }

    get pv(): PV<any> | undefined {
        if (this.pvName) {
            return this.display.getPV(this.pvName);
        }
    }

    get wuid(): string { return this.properties.getValue(PROP_WUID); }
    get name(): string { return this.properties.getValue(PROP_NAME); }
    get holderX(): number { return this.properties.getValue(PROP_X); }
    get holderY(): number { return this.properties.getValue(PROP_Y); }
    get holderWidth(): number { return this.properties.getValue(PROP_WIDTH); }
    get holderHeight(): number { return this.properties.getValue(PROP_HEIGHT); }
    get borderAlarmSensitive(): boolean {
        return this.properties.getValue(PROP_BORDER_ALARM_SENSITIVE);
    }
    get pvName(): string | undefined { return this.properties.getValue(PROP_PV_NAME, true); }
    get borderColor(): Color { return this.properties.getValue(PROP_BORDER_COLOR); }
    get borderStyle(): number { return this.properties.getValue(PROP_BORDER_STYLE); }
    get borderWidth(): number { return this.properties.getValue(PROP_BORDER_WIDTH); }
    get backgroundColor(): Color { return this.properties.getValue(PROP_BACKGROUND_COLOR); }
    get foregroundColor(): Color { return this.properties.getValue(PROP_FOREGROUND_COLOR); }
    get transparent(): boolean { return this.properties.getValue(PROP_TRANSPARENT); }
    get visible(): boolean { return this.properties.getValue(PROP_VISIBLE); }
    get actions(): ActionSet { return this.properties.getValue(PROP_ACTIONS); }

    get text(): string {
        if (this.display.editMode) {
            const prop = this.properties.getProperty(PROP_TEXT) as StringProperty;
            return (prop.rawValue || '').split(' ').join('\u00a0'); // Preserve whitespace
        } else {
            const text = this.properties.getValue(PROP_TEXT);
            return text.split(' ').join('\u00a0'); // Preserve whitespace
        }
    }

    init(): void { };
    abstract draw(g: Graphics, hitCanvas: HitCanvas): void;
}
