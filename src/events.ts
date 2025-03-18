export interface OPIEvent {
  detail?: any;
}

export interface OPIEventMap {
  [index: string]: OPIEvent;
  closedisplay: CloseDisplayEvent;
  opendisplay: OpenDisplayEvent;
  openpv: OpenPVEvent;
  runcommand: RunCommandEvent;
  runprocedure: RunProcedureEvent;
  runstack: RunStackEvent;
  selection: SelectionEvent;
  scale: ScaleEvent;
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
  args?: { [key: string]: string }
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
export interface CloseDisplayEvent extends OPIEvent { }

/**
 * A script or a button requested to run a command.
 */
export interface RunCommandEvent extends OPIEvent {
  command: string;
  args: { [key: string]: string };
}

/**
 * A script or a button requested to run a stack.
 */
export interface RunStackEvent extends OPIEvent {
  path: string;
}

/**
 * A script or a button requested to run a procedure.
 */
export interface RunProcedureEvent extends OPIEvent {
  procedure: string;
  args: { [key: string]: string };
}

/**
 * This display scale has changed.
 */
export interface ScaleEvent extends OPIEvent {
  scale: number;
}

export type OPIEventHandlers = {
  [index: string]: Array<(ev: OPIEvent) => void>;
};
