export interface FormatDateOptions {
  year: boolean;
  month: boolean;
  day: boolean;
}

export interface FormatTimeOptions {
  hours: boolean;
  minutes: boolean;
  seconds: boolean;
  milliseconds: boolean;
}

export class Formatter {
  constructor(public utc: boolean) {}

  formatDate(dt: Date, opts: FormatDateOptions) {
    const utc = this.utc;
    let result = "";
    if (opts.year) {
      result += utc ? dt.getUTCFullYear() : dt.getFullYear();
    }
    if (opts.month) {
      if (opts.year) {
        result += "-";
      }
      const month = (utc ? dt.getUTCMonth() : dt.getMonth()) + 1;
      result += (month < 10 ? "0" : "") + month;
    }
    if (opts.day) {
      if (opts.month) {
        result += "-";
      }
      const day = utc ? dt.getUTCDate() : dt.getDate();
      result += (day < 10 ? "0" : "") + day;
    }
    return result;
  }

  formatTime(dt: Date, opts: FormatTimeOptions) {
    const utc = this.utc;
    let result = "";
    if (opts.hours) {
      const h = utc ? dt.getUTCHours() : dt.getHours();
      result += (h < 10 ? "0" : "") + h;
    }
    if (opts.minutes) {
      if (opts.hours) {
        result += ":";
      }
      const m = utc ? dt.getUTCMinutes() : dt.getMinutes();
      result += (m < 10 ? "0" : "") + m;
    }
    if (opts.seconds) {
      if (opts.minutes) {
        result += ":";
      }
      const s = utc ? dt.getUTCSeconds() : dt.getSeconds();
      result += (s < 10 ? "0" : "") + s;
    }
    if (opts.milliseconds) {
      if (opts.seconds) {
        result += ".";
      }
      const ms = utc ? dt.getUTCMilliseconds() : dt.getMilliseconds();
      result += (ms < 10 ? "00" : ms < 100 ? "0" : "") + ms;
    }
    return result;
  }
}
