import { StringProperty } from "../properties";
import { Widget } from "../Widget";
import { Action } from "./Action";

const PROP_PATH = "path";

export class PlaySoundAction extends Action {
  constructor() {
    super();
    this.properties.add(new StringProperty(PROP_PATH, ""));
  }

  execute(widget: Widget) {
    if (this.path) {
      const audio = new Audio(widget.display.resolvePath(this.path));
      audio.play();
    }
  }

  get path(): string {
    return this.properties.getValue(PROP_PATH);
  }

  toString() {
    return `Play WAV File ${this.path}`;
  }
}
