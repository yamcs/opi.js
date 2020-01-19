import { Color } from '../Color';
import { Font } from '../Font';

export class ColorFontUtil {

  static BLACK = Color.BLACK;
  static BLUE = Color.BLUE;
  static CYAN = Color.CYAN;
  static DARK_GRAY = Color.DARK_GRAY;
  static GRAY = Color.GRAY;
  static GREEN = Color.GREEN;
  static LIGHT_BLUE = Color.LIGHT_BLUE;
  static ORANGE = Color.ORANGE;
  static PINK = Color.PINK;
  static PURPLE = Color.PURPLE;
  static RED = Color.RED;
  static WHITE = Color.WHITE;
  static YELLOW = Color.YELLOW;

  getColorFromRGB(red: number, green: number, blue: number) {
    return new Color(red, green, blue);
  }

  getFont(name: string, height: number, style: number) {
    return new Font(name, height, style, false);
  }
}
