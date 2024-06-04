import { Display } from '../Display';
import { AlarmSeverity } from "../pv/PV";
import { PVEngine } from "../pv/PVEngine";
import { formatValue } from "../utils";
import { PVWrapper } from "./PVWrapper";
import { WidgetWrapper } from "./WidgetWrapper";

const SUPPORTED_DATE_FORMAT_PATTERNS = [
  "yyyy",
  "MM",
  "dd",
  "HH",
  "mm",
  "ss",
  "nnnnnnnnn",
];

export class PVUtil {

  private pvEngine: PVEngine;

  constructor(private display: Display) {
    this.pvEngine = display.pvEngine;
  }

  private checkPVValue(pv: PVWrapper) {
    if (pv.getValue() === null) {
      throw new Error(`PV ${pv.getName()} has no value.`);
    }
  }

  createPV(pvName: string, widget: WidgetWrapper) {
    const pv = this.pvEngine.createPV(pvName);
    return new PVWrapper(pv);
  }

  getDouble(pv: PVWrapper) {
    this.checkPVValue(pv);
    // Note: for enumerations this should return the index
    const numberValue: any = pv._pv.toNumber();
    // It probably already is a float, but parseFloat again to emit error if it's not
    return parseFloat(numberValue ?? pv.getValue());
  }

  getLong(pv: PVWrapper) {
    this.checkPVValue(pv);
    // Note: for enumerations this should return the index
    let numberValue: any = pv._pv.toNumber();
    if (typeof numberValue === "number") {
      numberValue = Math.floor(numberValue);
    }
    // It probably already is an int, but parseInt again to emit error if it's not
    return parseInt(numberValue ?? pv.getValue(), 10);
  }

  getString(pv: PVWrapper) {
    this.checkPVValue(pv);
    return formatValue(pv._pv.value, 0, -1)
  }

  getStringArray(pv: PVWrapper) {
    this.checkPVValue(pv);
    const value = pv.getValue();
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    } else {
      return [String(value)];
    }
  }

  getTimeInMilliseconds(pv: PVWrapper) {
    this.checkPVValue(pv);
    const dt = pv._pv.time;
    return dt?.getTime() ?? 0;
  }

  getTimeString(pv: PVWrapper, format = "yyyy-MM-dd HH:mm:ss.nnnnnnnnn") {
    this.checkPVValue(pv);
    const dt = pv._pv.time;
    if (dt) {
      let result = format;
      for (const pattern of SUPPORTED_DATE_FORMAT_PATTERNS) {
        result = result.replace(pattern, this.formatDate(dt, pattern));
      }
      return result;
    }
    return null;
  }

  getSeverity(pv: PVWrapper) {
    this.checkPVValue(pv);
    switch (pv._pv.severity) {
      case AlarmSeverity.NONE:
        return 0;
      case AlarmSeverity.MAJOR:
        return 1;
      case AlarmSeverity.MINOR:
        return 2;
      default:
        return -1;
    }
  }

  getSeverityString(pv: PVWrapper) {
    this.checkPVValue(pv);
    return String(pv._pv.severity);
  }

  getStatus(pv: PVWrapper) {
    this.checkPVValue(pv);
    return pv._pv.alarmName;
  }

  private formatDate(date: Date, format: string) {
    const { utc } = this.display;
    if (format === "yyyy") {
      return String(utc ? date.getUTCFullYear() : date.getFullYear());
    } else if (format === "MM") {
      const m = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
      return m < 10 ? "0" + m : "" + m;
    } else if (format === "dd") {
      const d = (utc ? date.getUTCDate() : date.getDate());
      return d < 10 ? "0" + d : "" + d;
    } else if (format === "HH") {
      const h = (utc ? date.getUTCHours() : date.getHours());
      return h < 10 ? "0" + h : "" + h;
    } else if (format === "mm") {
      const m = (utc ? date.getUTCMinutes() : date.getMinutes());
      return m < 10 ? "0" + m : "" + m;
    } else if (format === "ss") {
      const s = (utc ? date.getUTCSeconds() : date.getSeconds());
      return s < 10 ? "0" + s : "" + s;
    } else if (format === "nnnnnnnnn") {
      const m = (utc ? date.getUTCMilliseconds() : date.getMilliseconds());
      if (m < 10) {
        return "00" + m;
      } else if (m < 100) {
        return "0" + m;
      } else {
        return "" + m;
      }
    } else {
      throw new Error(`Unexpected format '${format}'`);
    }
  }
}
