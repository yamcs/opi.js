import { Formatter } from "../Formatter";
import { PV } from "./PV";
import { PVProvider } from "./PVProvider";
import { ConstantGenerator, SimGenerator, SysTime } from "./sim";

const PV_PATTERN = /sys\:\/\/([a-zA-Z]+)/;

export class SystemPVProvider implements PVProvider {
  private pvs = new Map<string, SystemPV>();

  constructor(private formatter: Formatter) {}

  canProvide(pvName: string) {
    return pvName === "sys://time";
  }

  startProviding(pvs: PV[]) {
    for (const pv of pvs) {
      const wrapped = new SystemPV(pv, this.formatter);
      this.pvs.set(pv.name, wrapped);
    }
  }

  stopProviding(pvs: PV[]) {
    for (const pv of pvs) {
      const match = this.pvs.get(pv.name);
      if (match) {
        match.fn.stop();
        this.pvs.delete(pv.name);
      }
    }
  }

  isNavigable() {
    return false;
  }

  shutdown() {
    for (const pv of this.pvs.values()) {
      pv.fn.stop();
    }
  }
}

class SystemPV {
  fn: SimGenerator;

  constructor(
    readonly pv: PV,
    private formatter: Formatter,
  ) {
    const match = pv.name.match(PV_PATTERN);
    if (match) {
      this.fn = this.createGenerator(match[1]);
    } else {
      console.warn(`Unexpected pattern for PV ${pv.name}`);
      this.fn = new ConstantGenerator(pv, undefined);
    }
  }

  private createGenerator(fnName: string) {
    switch (fnName) {
      case "time":
        return new SysTime(this.pv, this.formatter);
      default:
        console.warn(`Unexpected function ${fnName} for PV ${this.pv.name}`);
        return new ConstantGenerator(this.pv, undefined);
    }
  }
}
