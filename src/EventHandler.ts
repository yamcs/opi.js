import { Display } from './Display';
import { HitCanvas, HitRegion } from './HitCanvas';
import { Point } from './Point';

// Compare by id instead of references. HitRegions may be generated
// on each draw, whereas the "id" can be more long-term.
function regionMatches(region1?: HitRegion, region2?: HitRegion) {
    return region1 && region2 && region1.id === region2.id;
}

export class EventHandler {

    private prevEnteredRegion?: HitRegion;

    constructor(private display: Display, private canvas: HTMLCanvasElement, private hitCanvas: HitCanvas) {
        canvas.addEventListener('click', e => this.onClick(e), false);
        canvas.addEventListener('mousedown', e => this.onMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onMouseUp(e), false);
        canvas.addEventListener('mouseout', e => this.onMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onMouseMove(e), false);
    }

    private toPoint(event: MouseEvent): Point {
        const bbox = this.canvas.getBoundingClientRect();
        return { x: event.clientX - bbox.left, y: event.clientY - bbox.top };
    }

    private onClick(event: MouseEvent) {
        this.display.clearSelection();

        const point = this.toPoint(event);
        if (this.display.activeTool === 'edit') {
            this.selectSingleWidget(point.x, point.y);
        } else {
            const region = this.hitCanvas.getActiveRegion(point.x, point.y);
            if (region && region.click) {
                region.click();
            }
        }
    }

    private onMouseDown(event: MouseEvent) {
        if (this.display.activeTool === 'edit') {
            return;
        }

        const point = this.toPoint(event);
        const region = this.hitCanvas.getActiveRegion(point.x, point.y);
        if (region && region.mouseDown) {
            region.mouseDown();
        }
    }

    private onMouseUp(event: MouseEvent) {
        if (this.display.activeTool === 'edit') {
            return;
        }

        const point = this.toPoint(event);
        const region = this.hitCanvas.getActiveRegion(point.x, point.y);
        if (region && region.mouseUp) {
            region.mouseUp();
        }
    }

    private onMouseOut(event: MouseEvent) {
    }

    private onMouseMove(event: MouseEvent) {
        const point = this.toPoint(event);
        const region = this.hitCanvas.getActiveRegion(point.x, point.y);

        if (this.prevEnteredRegion && this.prevEnteredRegion.mouseOut) {
            if (!regionMatches(this.prevEnteredRegion, region)) {
                this.prevEnteredRegion.mouseOut();
            }
        }

        if (region && region.mouseEnter) {
            if (!regionMatches(this.prevEnteredRegion, region)) {
                region.mouseEnter();
            }
        }

        this.prevEnteredRegion = region;

        const cursor = (region && region.cursor) ? region.cursor : 'auto';
        if (cursor != this.canvas.style.cursor) {
            this.canvas.style.cursor = cursor;
        }
    }

    private selectSingleWidget(x: number, y: number) {
        for (const widget of this.display.widgets.slice().reverse()) {
            const x1 = widget.holderX;
            const y1 = widget.holderY;
            const x2 = widget.holderX + widget.holderWidth;
            const y2 = widget.holderY + widget.holderHeight;
            if (x1 < x && x < x2 && y1 < y && y < y2) {
                this.display.selection = [widget.wuid];
                return false;
            }
        }
    }
}
