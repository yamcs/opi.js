import { ScriptLoader } from "./ScriptLoader";

export class PostMessageScriptLoader implements ScriptLoader {
  private pending = new Map<string, (content: string | null) => void>();

  async load(path: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.pending.set(path, resolve);
      window.parent.postMessage({ type: "loadScript", path }, "*");
    });
  }

  receiveContent(path: string, content: string | null): void {
    const resolve = this.pending.get(path);
    if (resolve) {
      this.pending.delete(path);
      resolve(content);
    }
  }
}
