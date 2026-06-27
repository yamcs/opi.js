import { Widget } from "../Widget";
import { HistoricalDataProvider } from "./HistoricalDataProvider";
import { PostMessageHistoricalDataProvider } from "./PostMessageHistoricalDataProvider";
import { PV } from "./PV";
import { PVProvider } from "./PVProvider";

export class PostMessagePVProvider implements PVProvider {
  canProvide(_pvName: string): boolean {
    return true;
  }

  startProviding(pvs: PV[]): void {
    window.parent.postMessage(
      { type: "subscribe", pvNames: pvs.map((pv) => pv.name) },
      "*",
    );
  }

  stopProviding(pvs: PV[]): void {
    window.parent.postMessage(
      { type: "unsubscribe", pvNames: pvs.map((pv) => pv.name) },
      "*",
    );
  }

  isNavigable(): boolean {
    return true;
  }

  writeValue(pvName: string, value: any): void {
    window.parent.postMessage({ type: "write", pvName, value }, "*");
  }

  createHistoricalDataProvider(
    pvName: string,
    widget: Widget,
  ): HistoricalDataProvider | void {
    return new PostMessageHistoricalDataProvider(pvName, widget);
  }

  shutdown(): void {}
}
