import { Display } from './Display';

export class EventHandler {

    constructor(private display: Display, private canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', e => this.onClick(e), false);
        canvas.addEventListener('mousedown', e => this.onMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onMouseUp(e), false);
        canvas.addEventListener('mouseout', e => this.onMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onMouseMove(e), false);
    }

    private onClick(event: MouseEvent) {
        this.display.clearSelection();

        const bbox = this.canvas.getBoundingClientRect();
        const x = event.clientX - bbox.left;
        const y = event.clientY - bbox.top;

        if (this.display.activeTool === 'edit') {
            this.selectSingleWidget(x, y);
        }
    }

    private onMouseDown(event: MouseEvent) {
    }

    private onMouseUp(event: MouseEvent) {
    }

    private onMouseOut(event: MouseEvent) {
    }

    private onMouseMove(event: MouseEvent) {
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
