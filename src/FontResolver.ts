import { Font } from "./Font";

export interface FontResolver {
  resolve(font: Font): FontFace | undefined;
}
