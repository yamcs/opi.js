import { Action, ExecuteJavaScriptAction, OpenDisplayAction } from './actions';
import { toBorderBox } from './Bounds';
import { Color } from './Color';
import * as constants from './constants';
import { Display } from './Display';
import * as utils from './utils';

export abstract class Widget {

    // Long ID as contained in the display
    wuid: string;

    // bbox around the widget and its border
    holderX: number;
    holderY: number;
    holderWidth: number;
    holderHeight: number;

    borderStyle: number;
    borderColor: Color;
    borderWidth: number;
    borderAlarmSensitive: boolean;

    insets: [number, number, number, number]; // T L B R

    // bbox around the widget (excluding border)
    x: number;
    y: number;
    width: number;
    height: number;

    typeId: string;
    type: string;
    name: string;
    text: string;

    pvName?: string;

    backgroundColor = Color.TRANSPARENT;
    foregroundColor: Color;

    transparent: boolean;
    visible: boolean;

    actions: Action[] = [];

    constructor(readonly display: Display, node: Element) {
        this.wuid = utils.parseStringChild(node, 'wuid');

        this.typeId = utils.parseStringAttribute(node, 'typeId');
        this.type = utils.parseStringChild(node, 'widget_type');
        this.name = utils.parseStringChild(node, 'name');

        this.holderX = utils.parseIntChild(node, 'x');
        this.holderY = utils.parseIntChild(node, 'y');
        this.holderWidth = utils.parseIntChild(node, 'width');
        this.holderHeight = utils.parseIntChild(node, 'height');

        const borderColorNode = utils.findChild(node, 'border_color');
        this.borderColor = utils.parseColorChild(borderColorNode);
        this.borderWidth = utils.parseIntChild(node, 'border_width');
        this.borderStyle = utils.parseIntChild(node, 'border_style');
        this.borderAlarmSensitive = utils.parseBooleanChild(node, 'border_alarm_sensitive', false);

        this.insets = [0, 0, 0, 0];
        switch (this.borderStyle) {
            case 0: // Empty
                if (this.borderAlarmSensitive) {
                    this.insets = [2, 2, 2, 2];
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

        // Shrink the availabe widget area
        this.x = this.holderX + this.insets[1];
        this.y = this.holderY + this.insets[0];
        this.width = this.holderWidth - this.insets[1] - this.insets[3];
        this.height = this.holderHeight - this.insets[0] - this.insets[2];

        this.text = utils.parseStringChild(node, 'text', '');
        this.text = this.text.split(' ').join('\u00a0'); // Preserve whitespace

        if (utils.hasChild(node, 'background_color')) {
            const backgroundColorNode = utils.findChild(node, 'background_color');
            this.backgroundColor = utils.parseColorChild(backgroundColorNode);
        }

        const foregroundColorNode = utils.findChild(node, 'foreground_color');
        this.foregroundColor = utils.parseColorChild(foregroundColorNode);

        this.transparent = utils.parseBooleanChild(node, 'transparent', false);
        this.visible = utils.parseBooleanChild(node, 'visible');

        if (utils.hasChild(node, 'pv_name')) {
            this.pvName = utils.parseStringChild(node, 'pv_name');
        }

        if (utils.hasChild(node, 'actions')) {
            const actionsNode = utils.findChild(node, 'actions');
            for (const actionNode of utils.findChildren(actionsNode, 'action')) {
                const actionType = utils.parseStringAttribute(actionNode, 'type');
                if (actionType === 'OPEN_DISPLAY') {
                    const action: OpenDisplayAction = {
                        type: actionType,
                        path: utils.parseStringChild(actionNode, 'path'),
                    };
                    if (utils.hasChild(actionNode, 'mode')) {
                        action['mode'] = utils.parseIntChild(actionNode, 'mode');
                    }
                    this.actions.push(action);
                } else if (actionType === 'EXECUTE_JAVASCRIPT') {
                    const action: ExecuteJavaScriptAction = {
                        type: actionType,
                        embedded: utils.parseBooleanChild(actionNode, 'embedded'),
                    };
                    if (action.embedded) {
                        action.text = utils.parseStringChild(actionNode, 'scriptText');
                    } else {
                        action.path = utils.parseStringChild(actionNode, 'path');
                    }
                    this.actions.push(action);
                } else {
                    console.warn(`Unsupported action type ${actionType}`);
                    this.actions.push({ type: actionType });
                }
            }
        }
    }

    drawBorder(ctx: CanvasRenderingContext2D) {
        if (this.borderStyle === 0) { // No border
            // This is a weird one. When there is no border the widget
            // shrinks according to an inset of 2px. This only happens when
            // the border is alarm-sensitive.
            if (this.borderAlarmSensitive) {
                // anything TODO ?
            }
        } else if (this.borderStyle === 1) { // Line
            ctx.strokeStyle = this.borderColor.toString();
            ctx.lineWidth = this.borderWidth;
            const box = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, this.borderWidth);
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        } else if (this.borderStyle === 14) { // Round Rectangle Background
            let fillOpacity = 1;
            if (this.typeId === constants.TYPE_RECTANGLE || this.typeId === constants.TYPE_ROUNDED_RECTANGLE) {
                fillOpacity = 0; // Then nested widget appears to decide
            }

            ctx.globalAlpha = fillOpacity;
            ctx.fillStyle = this.backgroundColor.toString();
            ctx.strokeStyle = this.borderColor.toString();
            ctx.lineWidth = this.borderWidth;
            const box = toBorderBox(this.holderX, this.holderY, this.holderWidth, this.holderHeight, this.borderWidth);
            utils.roundRect(ctx, box.x, box.y, box.width, box.height, 4, 4);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            console.warn(`Unsupported border style: ${this.borderStyle}`);
        }
    }

    requestRepaint() {
        this.display.requestRepaint();
    }

    abstract draw(ctx: CanvasRenderingContext2D): void;
}
