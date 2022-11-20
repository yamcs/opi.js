import { PV } from "./PV";
import { PVEngine } from "./PVEngine";
import { Sample } from "./Sample";

function parsesAsFloat(value: any) {
  return (
    !isNaN(value) && (Number.isInteger(parseFloat(value)) || value % 1 !== 0)
  );
}

function convertToFloat(value: any) {
  if (parsesAsFloat(value)) {
    return parseFloat(value);
  } else {
    console.warn(`Not a valid float: ${value}`);
    return value;
  }
}

function convertToString(value: any) {
  if (value !== null && value !== undefined) {
    return String(value);
  } else {
    return value;
  }
}

export type LocalPVType =
  | "VDouble"
  | "VDoubleArray"
  | "VString"
  | "VStringArray";

export class LocalPV extends PV {
  constructor(
    name: string,
    pvEngine: PVEngine,
    public type?: LocalPVType,
    readonly initializer?: any
  ) {
    super(name, pvEngine);
    this.writable = true;
  }

  setSample(sample: Sample) {
    if (this.type === "VDouble") {
      sample.value = convertToFloat(sample.value);
    } else if (this.type === "VDoubleArray") {
      for (let i = 0; i < sample.value.length; i++) {
        sample.value[i] = convertToFloat(sample.value);
      }
    } else if (this.type === "VString") {
      sample.value = convertToString(sample.value);
    } else if (this.type === "VStringArray") {
      for (let i = 0; i < sample.value.length; i++) {
        sample.value[i] = convertToString(sample.value);
      }
    } else if (
      typeof sample.value === "string" &&
      parsesAsFloat(sample.value)
    ) {
      // If the string looks like a number, convert it.
      sample.value = parseFloat(sample.value);
    }

    super.setSample(sample);
  }
}
