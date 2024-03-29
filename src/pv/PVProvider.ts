import { HistoricalDataProvider } from "./HistoricalDataProvider";
import { PV } from "./PV";

export interface PVProvider {
  canProvide(pvName: string): boolean;

  startProviding(pvs: PV[]): void;

  stopProviding(pvs: PV[]): void;

  isNavigable(): boolean;

  createHistoricalDataProvider?(pvName: string): HistoricalDataProvider | void;

  shutdown(): void;
}
