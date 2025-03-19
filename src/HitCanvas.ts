import { HitRegionSpecification } from "./HitRegionSpecification";

const WHITE = "rgb(255,255,255)";
const IS_BRAVE = !!(navigator as any).brave;

export class HitCanvas {
  readonly ctx: CanvasRenderingContext2D;
  private regionsByColor = new Map<string, HitRegionSpecification>();

  // If present, use the root instead of the local regions map.
  // This avoids color collisions.
  private root?: HitCanvas;

  constructor(
    private parent?: HitCanvas,
    width?: number,
    height?: number,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = width ?? canvas.width;
    canvas.height = height ?? canvas.height;
    this.ctx = canvas.getContext("2d", {
      // Hint to use a software canvas, instead of hardware-accelerated.
      // Recommended due to frequent getImageData().
      willReadFrequently: true,
    })!;
    this.root = parent?.root || parent;
  }

  clear() {
    this.regionsByColor.clear();
    this.ctx.fillStyle = WHITE;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  beginHitRegion(hitRegion: HitRegionSpecification) {
    const color = (this.root || this).generateUniqueColor(hitRegion);

    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    return color;
  }

  getActiveRegion(x: number, y: number): HitRegionSpecification | undefined {
    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
    return this.regionsByColor.get(color) || undefined;
  }

  createChild(width: number, height: number) {
    // Dimensions are needed for redraw onto a parent HitCanvas.
    return new HitCanvas(this, width, height);
  }

  transferToParent(dx: number, dy: number, dw: number, dh: number) {
    if (!this.parent) {
      throw new Error("No parent to transfer to");
    }
    this.parent.ctx.drawImage(this.ctx.canvas, dx, dy, dw, dh);
  }

  private generateUniqueColor(hitRegion: HitRegionSpecification): string {
    while (true) {
      const r = Math.round(Math.random() * 255);
      const g = Math.round(Math.random() * 255);
      const b = Math.round(Math.random() * 255);
      const color = `rgb(${r},${g},${b})`;

      if (!this.regionsByColor.has(color) && color !== WHITE) {
        if (IS_BRAVE) {
          // Work around farbling-based fingerprinting defenses
          this.regionsByColor.set(`rgb(${r - 1},${g - 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g - 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g - 1},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g + 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g + 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r - 1},${g + 1},${b + 1})`, hitRegion);

          this.regionsByColor.set(`rgb(${r},${g - 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g - 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g - 1},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g + 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g + 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r},${g + 1},${b + 1})`, hitRegion);

          this.regionsByColor.set(`rgb(${r + 1},${g - 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g - 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g - 1},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g},${b + 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g + 1},${b - 1})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g + 1},${b})`, hitRegion);
          this.regionsByColor.set(`rgb(${r + 1},${g + 1},${b + 1})`, hitRegion);
        } else {
          this.regionsByColor.set(color, hitRegion);
        }

        return color;
      }
    }
  }
}
