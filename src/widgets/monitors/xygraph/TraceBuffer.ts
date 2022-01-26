
export interface Sample {
    x: number;
    y: number;
}

/**
 * Sample buffer that limits samples to a fixed total.
 * When the buffer is full, samples are dropped in FIFO order.
 */
class CircularBuffer {
    private pointer = 0;
    private samples: (Sample | undefined)[] = [];

    constructor(bufferSize: number) {
        this.samples = Array(bufferSize).fill(undefined);
    }

    /**
     * Adds a sample to this buffer. Samples may be added in non-chronological order.
     */
    push(x: number, y: number) {
        this.samples[this.pointer] = { x, y };
        this.pointer = (this.pointer + 1) % this.samples.length;
    }

    clear() {
        this.samples.fill(undefined);
        this.pointer = 0;
    }

    isFull() {
        const peek = (this.pointer + 1) % this.samples.length;
        return this.samples[peek] !== undefined;
    }

    isEmpty() {
        return this.tail() === undefined;
    }

    tail() {
        if (this.pointer === 0) {
            return this.samples[this.samples.length - 1];
        } else {
            return this.samples[this.pointer - 1];
        }
    }

    /**
     * Returns a copy of this buffer's current content.
     */
    snapshot(sort = false) {
        if (sort) {
            const result = this.samples.filter(s => s !== undefined) as Sample[];
            return result.sort((s1, s2) => s1.x - s2.x);
        } else {
            const oldest = this.samples.slice(this.pointer).filter(s => s !== undefined) as Sample[];
            const newest = this.samples.slice(0, this.pointer).filter(s => s !== undefined) as Sample[];
            return oldest.concat(newest);
        }
    }
}

export class TraceBuffer {

    private traceData: CircularBuffer;

    private x = 0;
    private xPending = false;
    private y = 0;
    private yTimestamp?= 0;
    private yPending = false;

    private xArray: number[] = [];
    private xArrayPending = false;
    private yArray: number[] = [];
    private yArrayPending = false;

    constructor(
        private bufferSize: number,
        private plotMode: number,
        private updateMode: number,
        private concatenateData: boolean,
        private chronological: boolean,
    ) {
        this.traceData = new CircularBuffer(bufferSize);
    }

    clear() {
        this.traceData.clear();
        this.x = 0;
        this.xPending = false;
        this.y = 0;
        this.yPending = false;
        this.yTimestamp = 0;
        this.xArray = [];
        this.xArrayPending = false;
        this.yArray = [];
        this.yArrayPending = false;
    }

    snapshot() {
        return this.traceData.snapshot();
    }

    updateX(x: number) {
        this.x = x;
        this.xPending = true;
        this.maybeAddPoint();
    }

    updateY(y: number, timestamp?: number) {
        this.y = y;
        this.yTimestamp = timestamp;
        this.yPending = true;
        this.maybeAddPoint();
    }

    updateXArray(xArray: number[]) {
        this.xArray = xArray;
        this.xArrayPending = true;
        this.maybeAddArray();
    }

    updateYArray(yArray: number[]) {
        this.yArray = yArray;
        this.yArrayPending = true;
        this.maybeAddArray();
    }

    private maybeAddPoint() {
        if (this.plotMode === 1 && this.traceData.isFull()) { // Plot n pts & stop
            return;
        }
        const { xPending, yPending, chronological, updateMode } = this;
        if (updateMode === 0) { // X or Y
            if ((chronological && yPending) || (!chronological && (xPending || yPending))) {
                this.addPoint();
            }
        } else if (updateMode === 1) { // X and Y
            if ((chronological && yPending) || (!chronological && (xPending && yPending))) {
                this.addPoint();
            }
        } else if (updateMode === 2) { // X
            if ((chronological && yPending) || (!chronological && xPending)) {
                this.addPoint();
            }
        } else if (updateMode === 3) { // Y
            if (this.yPending) {
                this.addPoint();
            }
        }
    }

    private maybeAddArray() {
        if (this.plotMode === 1 && this.traceData.isFull()) { // Plot n pts & stop
            return;
        }
        const { xArrayPending, yArrayPending, chronological, updateMode } = this;
        if (updateMode === 0) { // X or Y
            if ((chronological && yArrayPending)
                || (!chronological && (xArrayPending || yArrayPending))) {
                this.addArray();
            }
        } else if (updateMode === 1) { // X and Y
            if ((chronological && yArrayPending)
                || (!chronological && (xArrayPending && yArrayPending))) {
                this.addArray();
            }
        } else if (updateMode === 2) { // X
            if ((chronological && yArrayPending)
                || (!chronological && xArrayPending)) {
                this.addArray();
            }
        } else if (updateMode === 3) { // Y
            if (this.yArrayPending) {
                this.addArray();
            }
        }
    }

    private addPoint() {
        if (!this.concatenateData) {
            this.traceData.clear();
        }

        let xValue = this.x;
        if (this.chronological) {
            if (this.updateMode === 5) { // Trigger
                xValue = new Date().getTime();
            } else if (this.yTimestamp !== undefined) {
                xValue = this.yTimestamp!;
            } else { // X is a sequence counter
                const tail = this.traceData.tail();
                xValue = tail ? tail.x + 1 : 0;
            }
        }
        this.traceData.push(xValue, this.y);
        this.xPending = false;
        this.yPending = false;
    }

    private addArray() {
        if (!this.concatenateData) {
            this.traceData.clear();
        }

        let { xArray, yArray } = this;
        if (this.chronological) { // X is a sequence counter
            xArray = Array(yArray.length);
            if (this.traceData.isEmpty()) {
                for (let i = 0; i < yArray.length; i++) {
                    xArray[i] = i;
                }
            } else {
                const tail = this.traceData.tail()!;
                for (let i = 1; i < yArray.length; i++) {
                    xArray[i - 1] = tail.x + i;
                }
            }
        }

        let arrayLength = Math.min(xArray.length, yArray.length);
        let until = Math.min(arrayLength, this.bufferSize); // Ignore tail
        for (let i = 0; i < until; i++) {
            this.traceData.push(xArray[i], yArray[i]);
        }

        this.xArrayPending = false;
        this.yArrayPending = false;
    }
}
