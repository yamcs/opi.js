export interface OPIEvent {
    detail?: any;
}

export interface OPIEventMap {
    [index: string]: OPIEvent;
    'closedisplay': CloseDisplayEvent;
    'opendisplay': OpenDisplayEvent;
    'selection': SelectionEvent;
}

export interface SelectionEvent extends OPIEvent {
    selected: string[];
}

/**
 * A script or a button requested to open another display.
 */
export interface OpenDisplayEvent extends OPIEvent {
    path: string;
    replace: boolean; // Whether the new display should "replace" the current one.
}

/**
 * A script or a button requested to close the current display.
 */
export interface CloseDisplayEvent extends OPIEvent {
}

export type OPIEventHandlers = {
    [index: string]: Array<(ev: OPIEvent) => void>;
};
