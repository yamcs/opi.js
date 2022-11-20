import { Display } from "./Display";
import { Widget } from "./Widget";
import { LinkingContainer } from "./widgets/others/LinkingContainer";

export interface PathResolver {
  resolve(file: string, widget?: Widget): string;
}

export class DefaultPathResolver implements PathResolver {
  constructor(private display: Display) {}

  resolve(path: string, widget?: Widget) {
    if (path.startsWith("/")) {
      return `${this.display.absPrefix}${path.slice(1)}`;
    } else if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    } else {
      if (widget) {
        let parent = widget.parent;
        while (parent) {
          if (parent instanceof LinkingContainer) {
            const opiFile = parent.resolvedOpiFile!;
            const idx = opiFile.lastIndexOf("/") + 1;
            const relPrefix = opiFile.substring(0, idx);
            return `${relPrefix}${path}`;
          }
          parent = parent.parent;
        }
      }
      return `${this.display.relPrefix}${path}`;
    }
  }
}
