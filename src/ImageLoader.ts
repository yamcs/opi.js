export interface ImageLoader {
  /** Resolves a URL to a src value suitable for an HTMLImageElement. */
  load(url: string): Promise<string>;
}

/** Default implementation: passes the URL through unchanged. */
export class DefaultImageLoader implements ImageLoader {
  load(url: string): Promise<string> {
    return Promise.resolve(url);
  }
}
