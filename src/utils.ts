import { Bounds } from './Bounds';

/**
 * Resizes a canvas, but only if the new bounds are different.
 */
export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    if (canvas.width != width || canvas.height != height) { // Avoid performance hit when resetting width
        canvas.width = width;
        canvas.height = height;
    }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rx: number, ry: number) {
    ctx.beginPath();
    if (!rx && !ry) {
        ctx.rect(x, y, w, h);
    } else {
        if (w < 2 * rx) {
            rx = w / 2;
        }
        if (h < 2 * ry) {
            ry = h / 2;
        }
        ctx.moveTo(x + rx, y);
        ctx.lineTo(x + w - rx, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + ry);
        ctx.lineTo(x + w, y + h - ry);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
        ctx.lineTo(x + rx, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - ry);
        ctx.lineTo(x, y + ry);
        ctx.quadraticCurveTo(x, y, x + rx, y);
    }
}

export function outline(x: number, y: number, width: number, height: number, strokeWidth: number): Bounds {
    const inset = Math.max(1, strokeWidth) / 2.0;
    const inset1 = Math.floor(inset);
    const inset2 = Math.ceil(inset);
    return {
        x: x + inset1,
        y: y + inset1,
        width: width - inset1 - inset2,
        height: height - inset1 - inset2,
    };
}

export function normalizePath(base: string, relPath: string) {
    base = '/' + base;
    let nUpLn;
    let sDir = '';
    const sPath = base.replace(/[^\/]*$/, relPath.replace(/(\/|^)(?:\.?\/+)+/g, '$1'));
    let nStart = 0;
    for (let nEnd; nEnd = sPath.indexOf('/../', nStart), nEnd > -1; nStart = nEnd + nUpLn) {
        nUpLn = /^\/(?:\.\.\/)*/.exec(sPath.slice(nEnd))![0].length;
        sDir = (sDir + sPath.substring(nStart, nEnd)).replace(
            new RegExp('(?:\\\/+[^\\\/]*){0,' + ((nUpLn - 1) / 3) + '}$'), '/');
    }
    return (sDir + sPath.substr(nStart)).substr(1);
}
