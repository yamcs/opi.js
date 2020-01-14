import { ActionSet, ExecuteCommandAction, ExecuteJavaScriptAction, OpenDisplayAction, OpenFileAction, OpenWebpageAction, PlaySoundAction, WritePVAction } from './actions';
import { Color } from './Color';
import { Font } from './Font';
import { MacroSet } from './macros';
import { BooleanExpression, RuleInput, RuleSet } from './rules';
import { ScriptInput, ScriptSet } from './scripts';

export class XMLNode {

    constructor(private node: Node) {
    }

    get name() {
        return this.node.nodeName;
    }

    static parseFromXML(xml: string): XMLNode {
        const xmlParser = new DOMParser();
        const doc = xmlParser.parseFromString(xml, 'text/xml') as XMLDocument;
        return new XMLNode(doc.documentElement);
    }

    /**
    * Searches for a direct child with the specified name.
    *
    * @throws when no such child was found
    */
    getNode(name: string): XMLNode {
        const node = this.findChild(name);
        return new XMLNode(node);
    }

    /**
    * Searches for all direct children with the specified name.
    * If this name is undefined, all children are returned.
    */
    getNodes(name?: string): XMLNode[] {
        const result = [];
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i] as Element;
            if (child.nodeType !== 3) { // Ignore text or whitespace
                if (!name || (child.nodeName === name)) {
                    result.push(new XMLNode(child));
                }
            }
        }
        return result;
    }

    hasNode(name: string) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === name) {
                return true;
            }
        }
        return false;
    }

    hasAttribute(name: string) {
        return (this.node as Element).hasAttribute(name);
    }

    /**
     * Returns the inner content of this node as a string
     */
    getTextContent(defaultValue?: string) {
        return this.node.textContent || defaultValue || '';
    }

    /**
     * Parses the child node contents of the given parent node as a string.
     *
     * @throws when no such child was found and defaultValue was undefined
     */
    getString(name: string, defaultValue?: string) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === name) {
                if (child.textContent !== null) {
                    return child.textContent;
                }
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        } else {
            throw new Error(`No child node named ${name} could be found`);
        }
    }

    getStringAttribute(name: string) {
        const attr = (this.node as Element).attributes.getNamedItem(name);
        if (attr === null) {
            throw new Error(`No attribute named ${name}`);
        } else {
            return attr.textContent || '';
        }
    }

    /**
     * Parses the child node contents of the given parent node as a float.
     *
     * @throws when no such child was found and defaultValue was undefined.
     */
    getFloat(name: string, defaultValue?: number) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === name) {
                if (child.textContent !== null) {
                    return parseFloat(child.textContent);
                }
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        } else {
            throw new Error(`No child node named ${name} could be found`);
        }
    }

    /**
     * Parses the child node contents of the given parent node as an integer.
     *
     * @throws when no such child was found and defaultValue was undefined.
     */
    getInt(name: string, defaultValue?: number) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === name) {
                if (child.textContent !== null) {
                    return parseInt(child.textContent, 10);
                }
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        } else {
            throw new Error(`No child node named ${name} could be found`);
        }
    }

    getIntAttribute(name: string) {
        const attr = (this.node as Element).attributes.getNamedItem(name);
        if (attr === null) {
            throw new Error(`No attribute named ${name}`);
        } else {
            return parseInt(attr.textContent || '', 10);
        }
    }

    /**
     * Parses the child node contents of the given parent node as a boolean.
     *
     * @throws when no such child was found and defaultValue was undefined.
     */
    getBoolean(name: string, defaultValue?: boolean) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === name) {
                return child.textContent === 'true';
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        } else {
            throw new Error(`No child node named ${name} could be found`);
        }
    }

    getBooleanAttribute(name: string) {
        const attr = (this.node as Element).attributes.getNamedItem(name);
        if (attr === null) {
            throw new Error(`No attribute named ${name}`);
        } else {
            return attr.textContent === 'true';
        }
    }

    /**
     * Parses the child node contents as a color.
     *
     * @throws when no such child was found and defaultValue was undefined.
     */
    getColor(name: string, defaultValue?: Color) {
        const parent = this.findChild(name);
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i] as Element;
            if (child.nodeName === 'color') {
                return this.parseColorNode(new XMLNode(child));
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        } else {
            throw new Error(`No child node named 'color' could be found`);
        }
    }

    /**
    * Parses the child node contents as a font.
    */
    getFont(name: string) {
        const parent = this.getNode(name);
        if (parent.hasNode('opifont.name')) {
            const fontNode = parent.getNode('opifont.name');
            const name = fontNode.getStringAttribute('fontName');
            const height = fontNode.getIntAttribute('height');
            const style = fontNode.getIntAttribute('style');
            let pixels = false;
            if (fontNode.hasAttribute('pixels')) {
                pixels = fontNode.getBooleanAttribute('pixels');
            }
            return new Font(name, height, style, pixels);
        } else {
            const fontNode = parent.getNode('fontdata');
            const name = fontNode.getStringAttribute('fontName');
            const height = fontNode.getIntAttribute('height');
            const style = fontNode.getIntAttribute('style');
            return new Font(name, height, style, false);
        }
    }

    getPoints(name: string) {
        const pointsNode = this.getNode(name);
        const points = [];
        for (const pointNode of pointsNode.getNodes('point')) {
            points.push({
                x: pointNode.getIntAttribute('x'),
                y: pointNode.getIntAttribute('y'),
            });
        }
        return points;
    }

    getScripts(name: string) {
        const scriptsNode = this.getNode(name);
        const scripts = new ScriptSet();
        for (const pathNode of scriptsNode.getNodes('path')) {
            const inputs: ScriptInput[] = [];
            for (const pvNode of pathNode.getNodes('pv')) {
                inputs.push({
                    pvName: pvNode.getTextContent(),
                    trigger: pvNode.getBooleanAttribute('trig'),
                });
            }
            scripts.scripts.push({
                path: pathNode.getStringAttribute('pathString'),
                checkConnect: pathNode.getBooleanAttribute('checkConnect'),
                skipFirstExecution: pathNode.getBooleanAttribute('sfe'),
                inputs,
            });
        }
        return scripts;
    }

    getRules(name: string) {
        const rulesNode = this.getNode(name);
        const rules = new RuleSet();
        for (const ruleNode of rulesNode.getNodes('rule')) {
            const inputs: RuleInput[] = [];
            for (const pvNode of ruleNode.getNodes('pv')) {
                inputs.push({
                    pvName: pvNode.getTextContent(),
                    trigger: pvNode.getBooleanAttribute('trig'),
                });
            }
            const expressions: BooleanExpression[] = [];
            for (const expNode of ruleNode.getNodes('exp')) {
                expressions.push({
                    expression: expNode.getStringAttribute('bool_exp'),
                    outputValue: expNode.getString('value'),
                });
            }
            rules.rules.push({
                name: ruleNode.getStringAttribute('name'),
                propertyName: ruleNode.getStringAttribute('prop_id'),
                outputExpression: ruleNode.getBooleanAttribute('out_exp'),
                inputs,
                expressions,
            });
        }
        return rules;
    }

    getMacros(name: string) {
        const macrosNode = this.getNode(name);
        const macros = new MacroSet();
        macros.includeParentMacros = macrosNode.getBoolean('include_parent_macros');
        for (const child of macrosNode.getNodes()) {
            if (child.name !== 'include_parent_macros') {
                macros.set(child.name, macrosNode.getString(child.name));
            }
        }
        return macros;
    }

    getActions(name: string) {
        const actionsNode = this.getNode(name);
        const actions = new ActionSet();

        actions.hookFirstActionToClick = actionsNode.getBooleanAttribute('hook');
        actions.hookAllActionsToClick = actionsNode.getBooleanAttribute('hook_all');
        for (const actionNode of actionsNode.getNodes('action')) {
            const actionType = actionNode.getStringAttribute('type');
            if (actionType === 'OPEN_DISPLAY') {
                const action = new OpenDisplayAction(actionNode.getString('path'));
                if (actionNode.hasNode('mode')) {
                    action['mode'] = actionNode.getInt('mode');
                }
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'OPEN_FILE') {
                const action = new OpenFileAction();
                action.path = actionNode.getString('path')
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'EXECUTE_CMD') {
                const action = new ExecuteCommandAction();
                action.command = actionNode.getString('command');
                action.commandDirectory = actionNode.getString('command_directory');
                action.waitTime = actionNode.getInt('wait_time');
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'EXECUTE_JAVASCRIPT') {
                const action = new ExecuteJavaScriptAction(
                    actionNode.getBoolean('embedded'),
                );
                if (action.embedded) {
                    action.text = actionNode.getString('scriptText');
                } else {
                    action.path = actionNode.getString('path');
                }
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'WRITE_PV') {
                const action = new WritePVAction(actionNode.getString('pv_name'),
                    actionNode.getString('value'));
                action.confirmMessage = actionNode.getString('confirm_message');
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'PLAY_SOUND') {
                const action = new PlaySoundAction();
                action.path = actionNode.getString('path');
                action.description = actionNode.getString('description');
                actions.add(action);
            } else if (actionType === 'OPEN_WEBPAGE') {
                const action = new OpenWebpageAction();
                action.hyperlink = actionNode.getString('hyperlink');
                action.description = actionNode.getString('description');
                actions.add(action);
            } else {
                console.warn(`Unsupported action type ${actionType}`);
                // Insert placeholder, because actions are triggered based on index.
                actions.add(null);
            }
        }

        return actions;
    }

    private parseColorNode(node: XMLNode) {
        const r = node.getIntAttribute('red');
        const g = node.getIntAttribute('green');
        const b = node.getIntAttribute('blue');
        return new Color(r, g, b);
    }

    private findChild(childNodeName: string) {
        for (let i = 0; i < this.node.childNodes.length; i++) {
            const child = this.node.childNodes[i];
            if (child.nodeName === childNodeName) {
                return child;
            }
        }

        throw new Error(`No child node named ${childNodeName} could be found`);
    }
}
