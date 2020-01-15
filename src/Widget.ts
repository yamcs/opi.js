import { ActionSet } from './actions';
import { Color } from './Color';
import { Display } from './Display';
import { OpenDisplayEvent } from './events';
import { Font } from './Font';
import { Graphics, Path } from './Graphics';
import { HitCanvas } from './HitCanvas';
import { Bounds, toBorderBox } from './positioning';
import { ActionsProperty, BooleanProperty, ColorProperty, IntProperty, PropertySet, RulesProperty, ScriptsProperty, StringProperty } from './properties';
import { PV } from './pv/PV';
import { RuleSet } from './rules';
import { ScriptEngine } from './scripting/ScriptEngine';
import { ScriptSet } from './scripts';
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
const PROP_RULES = 'rules';
const PROP_SCRIPTS = 'scripts';
const PROP_TEXT = 'text';
const PROP_TRANSPARENT = 'transparent';
const PROP_VISIBLE = 'visible';
const PROP_WIDGET_TYPE = 'widget_type';
const PROP_WIDTH = 'width';
const PROP_WUID = 'wuid';
const PROP_X = 'x';
const PROP_Y = 'y';

export abstract class Widget {

    // bbox around the widget (excluding border)
    x = 0;
    y = 0;
    width = 0;
    height = 0;

    // Some widgets ignore the fill of this border (only the stroke).
    // (Rectangle, RoundedRectangle)
    protected fillRoundRectangleBackgroundBorder = true;

    properties: PropertySet;

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
            new RulesProperty(PROP_RULES, new RuleSet()),
            new ScriptsProperty(PROP_SCRIPTS),
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

        if (this.pvName) {
            this.display.pvEngine.createPV(this.pvName);
        }

        for (const script of this.scripts.scripts) {
            if (script.embedded) {
                this.display.pvEngine.createScript(this, script, script.text!);
            } else {
                fetch(`${this.display.baseUrl}${script.path}`).then(response => {
                    if (response.ok) {
                        response.text().then(text => {
                            this.display.pvEngine.createScript(this, script, text);
                        });
                    }
                });
            }
        }

        for (const rule of this.rules.rules) {
            if (this.properties.getProperty(rule.propertyName)) {
                this.display.pvEngine.createRule(this, rule);
            } else {
                console.warn(`Cannot create rule for unsupported property ${rule.propertyName}`);
            }
        }

        this.init();
    }

    drawHolder(g: Graphics) {
        let insets = [0, 0, 0, 0]; // T L B R
        switch (this.borderStyle) {
            case 0: // Empty
                if (this.borderAlarmSensitive) {
                    // TODO reevaluate the condition for these insets
                    // (at least the TextUpdate does not seem to need this)
                    ///this.insets = [2, 2, 2, 2];
                }
                break;
            case 1: // Line
                insets = [this.borderWidth, this.borderWidth, this.borderWidth, this.borderWidth];
                break;
            case 2: // Raised
            case 3: // Lowered
                insets = [1, 1, 1, 1];
                break;
            case 4: // Etched
            case 5: // Ridged
            case 6: // Button Raised
                insets = [2, 2, 2, 2];
                break;
            case 7: // Button Pressed
                insets = [2, 2, 1, 1];
                break;
            case 8: // Dot
            case 9: // Dash
            case 10: // Dash Dot
            case 11: // Dash Dot Dot
                insets = [this.borderWidth, this.borderWidth, this.borderWidth, this.borderWidth];
                break;
            case 12: // Title Bar
                insets = [16 + 1, 1, 1, 1];
                break;
            case 13: // Group Box
                insets = [16, 16, 16, 16];
                break;
            case 14: // Round Rectangle Background
                const i = this.borderWidth * 2;
                insets = [i, i, i, i];
                break;
        }

        // Shrink the available widget area
        this.x = this.holderX + insets[1];
        this.y = this.holderY + insets[0];
        this.width = this.holderWidth - insets[1] - insets[3];
        this.height = this.holderHeight - insets[0] - insets[2];

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
            g.strokePath({
                color: Color.BLACK,
                path: new Path(right, bottom)
                    .lineTo(right, top)
                    .moveTo(right, bottom)
                    .lineTo(left, bottom)
            });
            g.strokePath({
                color: Color.WHITE,
                path: new Path(left, top)
                    .lineTo(right - 1, top)
                    .moveTo(left, top)
                    .lineTo(left, bottom - 1)
            });
        } else if (this.borderStyle === 3) { // Lowered
            const top = this.holderY + 0.5;
            const left = this.holderX + 0.5;
            const bottom = this.holderY + this.holderHeight - 1 + 0.5;
            const right = this.holderX + this.holderWidth - 1 + 0.5;
            g.strokePath({
                color: Color.WHITE,
                path: new Path(right, bottom)
                    .lineTo(right, top)
                    .moveTo(right, bottom)
                    .lineTo(left, bottom)
            });
            g.strokePath({
                color: Color.BLACK,
                path: new Path(left, top)
                    .lineTo(right - 1, top)
                    .moveTo(left, top)
                    .lineTo(left, bottom - 1)
            });
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

            g.strokePath({
                color: this.backgroundColor.darker(),
                path: new Path(box.x, box.y)
                    .lineTo(box.x + 8, box.y)
                    .moveTo(box.x + 8 + fm.width, box.y)
                    .lineTo(box.x + box.width, box.y)
                    .lineTo(box.x + box.width, box.y + box.height)
                    .lineTo(box.x, box.y + box.height)
                    .lineTo(box.x, box.y)
            });

            box = toBorderBox(this.holderX + 8 + 1, this.holderY + 8 + 1, this.holderWidth - 16 - 1, this.holderHeight - 16 - 1, 1);

            g.strokePath({
                color: this.backgroundColor.brighter(),
                path: new Path(box.x, box.y)
                    .lineTo(box.x + 8 - 1, box.y)
                    .moveTo(box.x + 8 - 1 + fm.width, box.y)
                    .lineTo(box.x + box.width, box.y)
                    .lineTo(box.x + box.width, box.y + box.height)
                    .lineTo(box.x, box.y + box.height)
                    .lineTo(box.x, box.y)
            });
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

        if (this.actions.isClickable()) {
            const hitRegion = g.addHitRegion({
                id: `${this.wuid}-holder`,
                click: () => {
                    for (const idx of this.actions.getClickActions()) {
                        this.executeAction(idx);
                    }
                },
                cursor: 'pointer'
            });
            hitRegion.addRect(this.holderX, this.holderY, this.holderWidth, this.holderHeight);
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

    getBounds(): Bounds {
        return {
            x: this.holderX,
            y: this.holderY,
            width: this.holderWidth,
            height: this.holderHeight,
        };
    }

    private drawShadowBorder(g: Graphics, c1: Color, c2: Color, c3: Color, c4: Color) {
        const top = this.holderY + 0.5;
        const left = this.holderX + 0.5;
        const bottom = this.holderY + this.holderHeight - 1 + 0.5;
        const right = this.holderX + this.holderWidth - 1 + 0.5;
        g.strokePath({
            color: c1,
            path: new Path(right, bottom)
                .lineTo(right, bottom)
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

    private drawDashedBorder(g: Graphics, dash: number[]) {
        const bbox = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, this.borderWidth);
        g.strokePath({
            color: this.borderColor,
            lineWidth: this.borderWidth,
            dash,
            path: new Path(bbox.x, bbox.y)
                .lineTo(bbox.x + bbox.width, bbox.y)
                .lineTo(bbox.x + bbox.width, bbox.y + bbox.height)
                .lineTo(bbox.x, bbox.y + bbox.height)
                .closePath()
        });
    }

    protected executeAction(index: number) {
        const action = this.actions.getAction(index);
        if (!action) {
            return;
        }

        switch (action.type) {
            case 'OPEN_DISPLAY':
                const event: OpenDisplayEvent = {
                    path: action.path,
                    replace: action.mode === 0,
                };
                this.display.fireEvent('opendisplay', event);
                break;
            case 'EXECUTE_JAVASCRIPT':
                if (action.embedded) {
                    // TODO should the current widget be passed?
                    const engine = new ScriptEngine(this.display.instance!, action.text!);
                    engine.run();
                } else {
                    fetch(`${this.display.baseUrl}${action.path}`).then(response => {
                        if (response.ok) {
                            response.text().then(text => {
                                const engine = new ScriptEngine(this.display.instance!, text);
                                engine.run();
                            });
                        }
                    });
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
                    const audio = new Audio(`${this.display.baseUrl}${action.path}`);
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
    get scripts(): ScriptSet { return this.properties.getValue(PROP_SCRIPTS); }
    get rules(): RuleSet { return this.properties.getValue(PROP_RULES); }

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
