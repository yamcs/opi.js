import { Formatter } from '../Formatter';
import { AlarmSeverity, PV } from "./PV";

export abstract class SimGenerator {
  private timer?: number;

  constructor(readonly pv: PV, private interval: number, initialValue?: any) {
    if (initialValue !== undefined) {
      pv.pvEngine.setValue(new Date(), pv.name, initialValue);
    }
    if (this.interval > 0) {
      this.timer = window.setInterval(() => {
        this.generateSample(new Date());
      }, interval);
    }
  }

  protected emit(time: Date, value: any) {
    let severity = AlarmSeverity.NONE;
    if (
      this.pv.lowerAlarmLimit !== undefined &&
      value < this.pv.lowerAlarmLimit
    ) {
      severity = AlarmSeverity.MAJOR;
    } else if (
      this.pv.upperAlarmLimit !== undefined &&
      value > this.pv.upperAlarmLimit
    ) {
      severity = AlarmSeverity.MAJOR;
    } else if (
      this.pv.lowerWarningLimit !== undefined &&
      value < this.pv.lowerWarningLimit
    ) {
      severity = AlarmSeverity.MINOR;
    } else if (
      this.pv.upperWarningLimit !== undefined &&
      value > this.pv.upperWarningLimit
    ) {
      severity = AlarmSeverity.MINOR;
    }
    this.pv.pvEngine.setValue(time, this.pv.name, value, severity);
  }

  stop() {
    window.clearInterval(this.timer);
  }

  abstract generateSample(time: Date): void;
}

export class ConstantGenerator extends SimGenerator {
  constructor(pv: PV, initialValue: any) {
    super(pv, -1, initialValue);
  }

  generateSample() { }
}

export class SysTime extends SimGenerator {

  constructor(pv: PV, private formatter: Formatter) {
    super(pv, 1000);
  }

  generateSample(time: Date) {
    const timeString = (
      this.formatter.formatDate(time, {
        year: true,
        month: true,
        day: true,
      }) + " " +
      this.formatter.formatTime(time, {
        hours: true,
        minutes: true,
        seconds: true,
        milliseconds: true,
      })
    );
    this.emit(time, timeString);
  }
}

/**
 * Generates an alternating boolean value
 */
export class Flipflop extends SimGenerator {
  private state = true;

  constructor(pv: PV, interval: number) {
    super(pv, interval);
  }

  generateSample(time: Date) {
    this.state = !this.state;
    this.emit(time, !this.state);
  }
}

/**
 * Generates random floats in the range [min, max]
 */
export class Noise extends SimGenerator {
  constructor(
    pv: PV,
    private min: number,
    private max: number,
    interval: number
  ) {
    super(pv, interval);
    const range = this.max - this.min;
    pv.units = "x";
    pv.lowerDisplayLimit = min;
    pv.lowerAlarmLimit = min + range * 0.1;
    pv.lowerWarningLimit = min + range * 0.2;
    pv.upperWarningLimit = min + range * 0.8;
    pv.upperAlarmLimit = min + range * 0.9;
    pv.upperDisplayLimit = max;
  }

  generateSample(time: Date) {
    const value = Math.random() * (this.max - this.min) + this.min;
    this.emit(time, value);
  }
}

/**
 * Generates random values in the range [min, max]
 */
export class GaussianNoise extends SimGenerator {
  constructor(
    pv: PV,
    private avg: number,
    private stddev: number,
    interval: number
  ) {
    super(pv, interval);
    pv.units = "x";
    pv.lowerDisplayLimit = avg - 4 * stddev;
    pv.lowerAlarmLimit = avg - 2 * stddev;
    pv.lowerWarningLimit = avg - stddev;
    pv.upperWarningLimit = avg + stddev;
    pv.upperAlarmLimit = avg + 2 * stddev;
    pv.upperDisplayLimit = avg + 4 * stddev;
  }

  generateSample(time: Date) {
    let x1;
    let x2;
    let rad;
    do {
      x1 = 2 * Math.random() - 1;
      x2 = 2 * Math.random() - 1;
      rad = x1 * x1 + x2 * x2;
    } while (rad >= 1 || rad === 0);
    const c = Math.sqrt((-2 * Math.log(rad)) / rad);
    const gaussian = x1 * c;
    this.emit(time, this.avg + gaussian * this.stddev);
  }
}

/**
 * Generate sine samples between min and max.
 * Warning limits are set at 80%, and alarm limits at 90%.
 */
export class Sine extends SimGenerator {
  private currentValue = 0;

  constructor(
    pv: PV,
    private min: number,
    private max: number,
    private samplesPerCycle: number,
    interval: number
  ) {
    super(pv, interval);
    const range = this.max - this.min;
    pv.units = "x";
    pv.lowerDisplayLimit = min;
    pv.lowerAlarmLimit = min + range * 0.1;
    pv.lowerWarningLimit = min + range * 0.2;
    pv.upperWarningLimit = min + range * 0.8;
    pv.upperAlarmLimit = min + range * 0.9;
    pv.upperDisplayLimit = max;
  }

  generateSample(time: Date) {
    const range = this.max - this.min;
    const value =
      (Math.sin((this.currentValue * 2 * Math.PI) / this.samplesPerCycle) *
        range) /
      2 +
      this.min +
      range / 2;
    this.currentValue++;
    this.emit(time, value);
  }
}

export class Ramp extends SimGenerator {
  private currentValue = 0;

  constructor(
    pv: PV,
    private min: number,
    private max: number,
    private inc: number,
    interval: number
  ) {
    super(pv, interval);
    if (inc >= 0) {
      this.currentValue = min - inc;
    } else {
      this.currentValue = max - inc;
    }
    const range = this.max - this.min;
    pv.units = "x";
    pv.lowerDisplayLimit = min;
    pv.lowerAlarmLimit = min + range * 0.1;
    pv.lowerWarningLimit = min + range * 0.2;
    pv.upperWarningLimit = min + range * 0.8;
    pv.upperAlarmLimit = min + range * 0.9;
    pv.upperDisplayLimit = max;
  }

  generateSample(time: Date) {
    this.currentValue = this.currentValue + this.inc;
    if (this.currentValue > this.max) {
      this.currentValue = this.min;
    }
    if (this.currentValue < this.min) {
      this.currentValue = this.max;
    }
    this.emit(time, this.currentValue);
  }
}
