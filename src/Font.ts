// FontFaceObserver only detects fonts loaded through @font-face, so we
// bypass it for "common" fonts.
const WEB_SAFE = [
  "Arial",
  "Arial Black",
  "Courier New",
  "Helvetica",
  "Tahoma",
  "Verdana",
];

export class Font {
  /**
   * If true, use legacy font-sizing when converting points to pixels.
   * This is less compatible with Yamcs Studio, but is preserved for
   * older displays that may have been designed for how to look on web
   * rather than on studio.
   *
   * Set this static property to true prior to creating a Display
   * instance.
   */
  public static LEGACY_FONT_SIZING = false;

  static ARIAL_9 = new Font("Arial", 9, 0, false);
  static ARIAL_10 = new Font("Arial", 10, 0, false);
  static ARIAL_11 = new Font("Arial", 11, 0, false);
  static ARIAL_12_BOLD = new Font("Arial", 12, 1, false);

  height: number; // pixels

  constructor(
    public name: string,
    height: number,
    public style: number,
    pixels: boolean,
  ) {
    if (pixels) {
      this.height = height;
    } else {
      if (Font.LEGACY_FONT_SIZING) {
        this.height = Math.round((height * 16) / 15);
      } else {
        this.height = Math.ceil((height * 4) / 3);
      }
    }
  }

  scale(scale: number) {
    return new Font(this.name, scale * this.height, this.style, true);
  }

  getFontString() {
    let fontName = this.name;
    if (fontName.indexOf(" ") !== -1) {
      fontName = `"${fontName}"`;
    }

    if (this.style === 1) {
      return `bold ${this.height}px ${fontName}`;
    } else if (this.style === 2) {
      return `italic ${this.height}px ${fontName}`;
    } else if (this.style === 3) {
      return `italic bold ${this.height}px ${fontName}`;
    } else {
      if (this.style !== 0) {
        console.warn(`Unsupported font style ${this.style}`);
      }
      return `normal ${this.height}px ${fontName}`;
    }
  }

  get bold() {
    return this.style === 1 || this.style === 3;
  }

  get italic() {
    return this.style === 2 || this.style === 3;
  }

  isWebSafe() {
    return WEB_SAFE.indexOf(this.name) !== -1;
  }
}
