export interface OPIEvent {
    detail?: any;
}

export interface OPIEventMap {
    [index: string]: OPIEvent;
    'opendisplay': OpenDisplayEvent;
    'selection': SelectionEvent;
}

export interface SelectionEvent extends OPIEvent {
    selected: string[];
}

export interface OpenDisplayEvent extends OPIEvent {
    path: string;
    replace: boolean; // Whether the new display should "replace" the current one.
}

export type OPIEventHandlers = {
    [index: string]: Array<(ev: OPIEvent) => void>;
}
