import { Color } from "../Color";
import { Font } from "../Font";

export class ColorFontUtil {
  BLACK = Color.BLACK;
  BLUE = Color.BLUE;
  CYAN = Color.CYAN;
  DARK_GRAY = Color.DARK_GRAY;
  GRAY = Color.GRAY;
  GREEN = Color.GREEN;
  LIGHT_BLUE = Color.LIGHT_BLUE;
  ORANGE = Color.ORANGE;
  PINK = Color.PINK;
  PURPLE = Color.PURPLE;
  RED = Color.RED;
  WHITE = Color.WHITE;
  YELLOW = Color.YELLOW;

  getColorFromRGB(red: number, green: number, blue: number) {
    return new Color(red, green, blue);
  }

  getFont(name: string, height: number, style: number) {
    return new Font(name, height, style, false);
  }
}
