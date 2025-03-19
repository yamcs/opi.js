export function colorFromCssColor(cssColor: string): Color {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = cssColor;
  const hex = String(ctx.fillStyle);

  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? new Color(
        parseInt(match[1], 16),
        parseInt(match[2], 16),
        parseInt(match[3], 16),
      )
    : Color.BLACK;
}

export class Color {
  static TRANSPARENT = new Color(0, 0, 0, 0);

  static BLACK = new Color(0, 0, 0);
  static BLUE = new Color(0, 0, 255);
  static CYAN = new Color(0, 255, 255);
  static DARK_GRAY = new Color(150, 150, 150);
  static GRAY = new Color(200, 200, 200);
  static GREEN = new Color(0, 255, 0);
  static LIGHT_BLUE = new Color(153, 186, 243);
  static ORANGE = new Color(255, 128, 0);
  static PINK = new Color(255, 0, 255);
  static PURPLE = new Color(128, 0, 255);
  static RED = new Color(255, 0, 0);
  static WHITE = new Color(255, 255, 255);
  static YELLOW = new Color(255, 255, 0);

  static BUTTON = new Color(239, 240, 241);
  static BUTTON_DARKER = new Color(164, 168, 172);
  static BUTTON_DARKEST = Color.BLACK;
  static BUTTON_LIGHTEST = Color.WHITE;

  constructor(
    public red: number,
    public green: number,
    public blue: number,
    public alpha = 255,
  ) {}

  withAlpha(alpha: number) {
    return new Color(this.red, this.green, this.blue, alpha);
  }

  mixWith(color: Color, weight: number) {
    const r = Math.floor(this.red * weight + color.red * (1 - weight));
    const g = Math.floor(this.green * weight + color.green * (1 - weight));
    const b = Math.floor(this.blue * weight + color.blue * (1 - weight));
    return new Color(r, g, b);
  }

  brighter() {
    let { red: r, green: g, blue: b } = this;

    const i = Math.floor(1.0 / (1.0 - 0.7));
    if (r === 0 && g === 0 && b === 0) {
      return new Color(i, i, i);
    }
    if (r > 0 && r < i) {
      r = i;
    }
    if (g > 0 && g < i) {
      g = i;
    }
    if (b > 0 && b < i) {
      b = i;
    }

    return new Color(
      Math.min(Math.floor(this.red / 0.7), 255),
      Math.min(Math.floor(this.green / 0.7), 255),
      Math.min(Math.floor(this.blue / 0.7), 255),
    );
  }

  darker() {
    return new Color(
      Math.max(Math.floor(this.red * 0.7), 0),
      Math.max(Math.floor(this.green * 0.7), 0),
      Math.max(Math.floor(this.blue * 0.7), 0),
    );
  }

  contrast() {
    return new Color(this.red, 255 - this.green, 255 - this.blue);
  }

  hex() {
    let r = this.red.toString(16);
    r = r.length == 1 ? "0" + r : r;
    let g = this.green.toString(16);
    g = g.length == 1 ? "0" + g : g;
    let b = this.blue.toString(16);
    b = b.length == 1 ? "0" + b : b;
    let a = this.alpha.toString(16);
    a = a.length == 1 ? "0" + a : a;
    return `#${r}${g}${b}${a}`;
  }

  /** @scriptapi */
  getRGBValue() {
    return this;
  }

  /** @scriptapi */
  equals(other: Color) {
    return other && this.toString() === other.toString();
  }

  toString() {
    return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
  }
}
