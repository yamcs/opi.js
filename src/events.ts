export interface OPIEvent {
    detail?: any;
}

export interface OPIEventMap {
    [index: string]: OPIEvent;
    'closedisplay': CloseDisplayEvent;
    'opendisplay': OpenDisplayEvent;
    'openpv': OpenPVEvent;
    'selection': SelectionEvent;
    'zoom': ZoomEvent;
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
 * The user has selected a widget with a navigable PV.
 */
export interface OpenPVEvent extends OPIEvent {
    pvName: string;
}

/**
 * A script or a button requested to close the current display.
 */
export interface CloseDisplayEvent extends OPIEvent {
}

/**
 * This display zoom level has changed.
 */
export interface ZoomEvent extends OPIEvent {
    zoom: number;
}

export type OPIEventHandlers = {
    [index: string]: Array<(ev: OPIEvent) => void>;
};
