import { ActionSet, ExecuteJavaScriptAction, OpenDisplayAction, WritePVAction } from './actions';
import { Color } from './Color';
import { Font } from './Font';
import { Point } from './Point';
import * as utils from './utils';

export abstract class Property {

    value?: any;

    constructor(readonly name: string, readonly defaultValue?: any) {
        this.value = defaultValue;
    }

    abstract parseValue(node: Element): void;
}

export class StringProperty extends Property {

    value?: string;

    parseValue(node: Element) {
        if (node.textContent !== null) {
            this.value = node.textContent;
        }
    }
}

export class IntProperty extends Property {

    value?: number;

    parseValue(node: Element) {
        if (node.textContent !== null) {
            this.value = parseInt(node.textContent, 10);
        }
    }
}

export class FloatProperty extends Property {

    value?: number;

    parseValue(node: Element) {
        if (node.textContent !== null) {
            this.value = parseFloat(node.textContent);
        }
    }
}

export class BooleanProperty extends Property {

    value?: boolean;

    parseValue(node: Element) {
        if (node.textContent !== null) {
            this.value = (node.textContent === 'true');
        }
    }
}

export class ColorProperty extends Property {

    value?: Color;

    parseValue(node: Element) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i] as Element;
            if (child.nodeName === 'color') {
                this.value = utils.parseColorNode(child);
            }
        }
    }
}

export class FontProperty extends Property {

    value?: Font;

    parseValue(node: Element) {
        this.value = utils.parseFontNode(node);
    }
}

export class PointsProperty extends Property {

    value?: Point[];

    parseValue(node: Element) {
        this.value = [];
        for (const pointNode of utils.findChildren(node, 'point')) {
            this.value.push({
                x: utils.parseIntAttribute(pointNode, 'x'),
                y: utils.parseIntAttribute(pointNode, 'y'),
            });
        }
    }
}

export class ActionsProperty extends Property {

    actions?: ActionSet;

    parseValue(node: Element) {
        this.actions = new ActionSet();
        this.actions.hookFirstActionToClick = utils.parseBooleanAttribute(node, 'hook');
        this.actions.hookAllActionsToClick = utils.parseBooleanAttribute(node, 'hook_all');
        for (const actionNode of utils.findChildren(node, 'action')) {
            const actionType = utils.parseStringAttribute(actionNode, 'type');
            if (actionType === 'OPEN_DISPLAY') {
                const action: OpenDisplayAction = {
                    type: actionType,
                    path: utils.parseStringChild(actionNode, 'path'),
                };
                if (utils.hasChild(actionNode, 'mode')) {
                    action['mode'] = utils.parseIntChild(actionNode, 'mode');
                }
                this.actions.add(action);
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
                this.actions.add(action);
            } else if (actionType === 'WRITE_PV') {
                const action: WritePVAction = {
                    type: actionType,
                    pvName: utils.parseStringChild(actionNode, 'pv_name'),
                    value: utils.parseStringChild(actionNode, 'value'),
                    confirmMessage: utils.parseStringChild(actionNode, 'confirm_message'),
                    description: utils.parseStringChild(actionNode, 'description'),
                };
                this.actions.add(action);
            } else {
                console.warn(`Unsupported action type ${actionType}`);
                // Insert placeholder, because actions are triggered based on index.
                this.actions.add(null);
            }
        }
    }
}
