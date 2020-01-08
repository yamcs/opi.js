export interface HitRegion {
    id: string;
    click?: () => void;
    mouseEnter?: () => void;
    mouseMove?: () => void;
    mouseOut?: () => void;
    mouseDown?: () => void;
    mouseUp?: () => void;
    cursor?: string;
}

export class HitCanvas {

    private BACKGROUND = 'rgb(255,255,255)';

    readonly ctx: CanvasRenderingContext2D;
    private regions: { [key: string]: HitRegion } = {};

    constructor() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d')!;
    }

    clear() {
        this.regions = {};
        this.ctx.fillStyle = this.BACKGROUND;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    beginHitRegion(hitRegion: HitRegion) {
        const color = this.generateUniqueColor();
        this.regions[color] = hitRegion;

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        return color;
    }

    getActiveRegion(x: number, y: number): HitRegion | undefined {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        return this.regions[color] || undefined;
    }

    private generateUniqueColor() {
        while (true) {
            const r = Math.round(Math.random() * 255);
            const g = Math.round(Math.random() * 255);
            const b = Math.round(Math.random() * 255);
            const color = `rgb(${r},${g},${b})`;

            if (!this.regions[color] && color != this.BACKGROUND) {
                return color;
            }
        }
    }
}
