import { AlarmSeverity } from "./PV";
import { TypeHint } from './TypeHint';

export interface Sample {
  time: Date;
  value: any;
  severity: AlarmSeverity;

  /**
   * In case of enum, this value is used
   * to render in plots.
   */
  valueIndex?: number;

  /**
   * Engineering units
   */
  units?: string;

  /**
   * Optional type hint for values that are
   * not JavaScript primitives.
   */
  typeHint?: TypeHint;
}
