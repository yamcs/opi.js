import { Display } from "../Display";

export class FileUtil {
  constructor(private display: Display) {}

  readTextFile(filePath: string) {
    const href = this.display.resolvePath(filePath);
    // Use XMLHTTPRequest because it can be used synchronously
    // (we may not return a promise from this method because it would break
    // the intended API).
    var request = new XMLHttpRequest();
    request.open("GET", href, false);
    request.send(null);
    if (request.status === 200) {
      return request.responseText;
    } else {
      throw Error(`Cannot open ${href}`);
    }
  }
}
