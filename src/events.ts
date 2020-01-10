export interface OPIEvent {
    detail?: any;
}

export interface OPIEventMap {
    [index: string]: OPIEvent;
    'selection': SelectionEvent;
}

export interface SelectionEvent extends OPIEvent {
    selected: string[];
}

export type OPIEventHandlers = {
    [index: string]: Array<(ev: OPIEvent) => void>;
}
