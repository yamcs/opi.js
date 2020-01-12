
export class Font {

  static ARIAL_11 = new Font('arial', 11, 0, false);
  static ARIAL_12_BOLD = new Font('arial', 12, 1, false);

  constructor(
    public name: string,
    public height: number,
    public style: number,
    public pixels: boolean,
  ) { }

  getFontString() {
    if (this.style === 1) {
      return `bold ${this.height}px ${this.name}`;
    } else {
      if (this.style !== 0) {
        console.warn(`Unsupported font style ${this.style}`);
      }
      return `normal ${this.height}px ${this.name}`;
    }
  }
}
