export class ScriptSet {
    scripts: Script[] = [];
}

export interface Script {
    embedded: boolean;

    path?: string;
    text?: string;

    /**
     * If true, the script may only run if all PVs are connected
     */
    checkConnect: boolean;

    skipFirstExecution: boolean;

    inputs: ScriptInput[];
}

export interface ScriptInput {
    pvName: string;
    trigger: boolean;
}
