import { Display } from "./Display";

export interface ScriptLoader {
  load(path: string): Promise<string | null>;
}

interface CacheRecord {
  timestamp: number;
  text: string;
}

export class DefaultScriptLoader implements ScriptLoader {
  private cache = new Map<string, CacheRecord>();
  private ttl = 5000; // 5 seconds

  constructor(private display: Display) {}

  async load(path: string) {
    this.removeOldEntries();

    const cacheRecord = this.cache.get(path);
    if (cacheRecord) {
      return cacheRecord.text;
    }

    const response = await fetch(this.display.resolvePath(path), {
      // Send cookies too.
      // Old versions of Firefox do not do this automatically.
      credentials: "same-origin",
    });

    if (response.ok) {
      const text = await response.text();
      this.cache.set(path, { timestamp: Date.now(), text });
      return text;
    } else {
      return null;
    }
  }

  private removeOldEntries() {
    const now = Date.now();
    this.cache.forEach((record, key) => {
      if (record.timestamp + this.ttl <= now) {
        this.cache.delete(key);
      }
    });
  }
}
