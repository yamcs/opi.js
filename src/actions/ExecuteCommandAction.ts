import { IntProperty, StringProperty } from '../properties';
import { Widget } from '../Widget';
import { Action } from './Action';

const PROP_COMMAND = 'command';
const PROP_COMMAND_DIRECTORY = 'command_directory';
const PROP_WAIT_TIME = 'wait_time';

export class ExecuteCommandAction extends Action {

    constructor() {
        super();
        this.properties.add(new StringProperty(PROP_COMMAND, ''));
        this.properties.add(new StringProperty(PROP_COMMAND_DIRECTORY, '$(user.home)'));
        this.properties.add(new IntProperty(PROP_WAIT_TIME, 10));
    }

    execute(widget: Widget): void {
        throw new Error('Unsupported action EXECUTE_CMD');
    }

    get command(): string { return this.properties.getValue(PROP_COMMAND); }
    get commandDirectory(): string { return this.properties.getValue(PROP_COMMAND_DIRECTORY); }
    get waitTime(): number { return this.properties.getValue(PROP_WAIT_TIME); }

    toString() {
        return `Execute Command ${this.command}`;
    }
}
