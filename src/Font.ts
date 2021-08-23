import FontFaceObserver, { FontVariant } from 'fontfaceobserver';

// FontFaceObserver only detects fonts loaded through @font-face, so we
// bypass it for "common" fonts.
const WEB_SAFE = ['Arial', 'Arial Black', 'Courier New', 'Helvetica', 'Tahoma', 'Verdana'];

export class Font {

  static ARIAL_9 = new Font('Arial', 9, 0, false);
  static ARIAL_11 = new Font('Arial', 11, 0, false);
  static ARIAL_12_BOLD = new Font('Arial', 12, 1, false);

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
      // TODO. Would expect 1pt = 3/4px, but this ratio
      // appears to be more accurate with desktop s/w...
      // (on a 72 dpi screen)
      this.height = Math.round(height * 16 / 15);
    }
  }

  scale(scale: number) {
    return new Font(this.name, scale * this.height, this.style, true);
  }

  getFontString() {
    if (this.style === 1) {
      return `bold ${this.height}px ${this.name}`;
    } else if (this.style === 2) {
      return `italic ${this.height}px ${this.name}`;
    } else {
      if (this.style !== 0) {
        console.warn(`Unsupported font style ${this.style}`);
      }
      return `normal ${this.height}px ${this.name}`;
    }
  }

  preload() {
    if (WEB_SAFE.indexOf(this.name) !== -1) {
      return Promise.resolve();
    }

    let variant: FontVariant = { weight: 'normal', style: 'normal' };
    if (this.style === 1) {
      variant.weight = 'bold';
    } else if (this.style === 2) {
      variant.style = 'italic';
    }

    // Probably can be done without external library in about 5 years from now.
    // Follow browser support of this spec: https://www.w3.org/TR/css-font-loading-3/
    return new FontFaceObserver(this.name, variant).load();
  }
}
