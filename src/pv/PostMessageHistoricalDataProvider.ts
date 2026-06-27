import { NullablePoint } from "../positioning";
import { Widget } from "../Widget";
import { HistoricalDataProvider } from "./HistoricalDataProvider";

// Module-level registry: pvName → providers. Enables deduplication of
// historySubscribe messages when multiple widgets share the same pvName.
const registry = new Map<string, PostMessageHistoricalDataProvider[]>();

export function handleHistorySamples(pvName: string, samples: NullablePoint[]) {
  for (const provider of registry.get(pvName) ?? []) {
    provider.updateSamples(samples);
  }
}

export class PostMessageHistoricalDataProvider implements HistoricalDataProvider {
  private samples: NullablePoint[] = [];

  constructor(
    private pvName: string,
    private widget: Widget,
  ) {
    const list = registry.get(pvName) ?? [];
    const alreadySubscribed = list.length > 0;
    list.push(this);
    registry.set(pvName, list);
    if (!alreadySubscribed) {
      window.parent.postMessage({ type: "historySubscribe", pvName }, "*");
    }
  }

  getSamples(): NullablePoint[] {
    return this.samples;
  }

  updateSamples(samples: NullablePoint[]) {
    this.samples = samples;
    this.widget.requestRepaint();
  }

  disconnect(): void {
    const list = registry.get(this.pvName) ?? [];
    const idx = list.indexOf(this);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) {
      registry.delete(this.pvName);
      window.parent.postMessage(
        { type: "historyUnsubscribe", pvName: this.pvName },
        "*",
      );
    }
  }
}
