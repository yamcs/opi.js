import { ImageLoader } from "./ImageLoader";

/**
 * ImageLoader for use inside the sandboxed display iframe.
 * Requests the outer frame to fetch images with credentials and return data URLs.
 */
export class PostMessageImageLoader implements ImageLoader {
  private pending = new Map<string, Array<(result: string) => void>>();

  load(url: string): Promise<string> {
    return new Promise((resolve) => {
      const waiters = this.pending.get(url);
      if (waiters) {
        waiters.push(resolve);
      } else {
        this.pending.set(url, [resolve]);
        window.parent.postMessage({ type: "loadImage", url }, "*");
      }
    });
  }

  receiveData(url: string, dataUrl: string | null) {
    const waiters = this.pending.get(url) ?? [];
    this.pending.delete(url);
    const result = dataUrl ?? url;
    for (const resolve of waiters) {
      resolve(result);
    }
  }
}
