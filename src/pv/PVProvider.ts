import { Widget } from "../Widget";
import { HistoricalDataProvider } from "./HistoricalDataProvider";
import { PV } from "./PV";

export interface PVProvider {
  canProvide(pvName: string): boolean;

  startProviding(pvs: PV[]): void;

  stopProviding(pvs: PV[]): void;

  isNavigable(): boolean;

  writeValue?(pvName: string, value: any): void;

  createHistoricalDataProvider?(
    pvName: string,
    widget: Widget,
  ): HistoricalDataProvider | void;

  shutdown(): void;
}
