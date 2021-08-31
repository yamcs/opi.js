type rgb = [number, number, number];

export class ColorMap {

    // These are not guaranteed to be
    // sorted (in case of custom color map).
    private values: number[] = [];
    private colors: rgb[] = [];

    // Sorted array of [value, color] tuples.
    // This data is only set (or updated) when
    // compile() is called.
    private entries: Array<[number, rgb]> = [];

    private dirty = true;

    constructor(
        readonly code: number,
        private interpolate: boolean,
        readonly autoscale: boolean,
    ) {
        if (code === 0) { // Custom
            // Set by XML parser
        } else if (code === 1) { // GrayScale
            this.values = [0, 1];
            this.colors = [
                [0, 0, 0],
                [255, 255, 255],
            ];
        } else if (code === 2) { // JET
            this.values = [0, 0.111, 0.365, 0.619, 0.873, 1];
            this.colors = [
                [0, 0, 143],
                [0, 0, 255],
                [0, 255, 255],
                [255, 255, 0],
                [255, 0, 0],
                [128, 0, 0],
            ];
        } else if (code === 3) { // ColorSpectrum
            this.values = [0, 0.126, 0.251, 0.375, 0.5, 0.625, 0.749, 0.874, 1];
            this.colors = [
                [0, 0, 0],
                [255, 0, 255],
                [0, 0, 255],
                [0, 255, 255],
                [0, 255, 0],
                [255, 255, 0],
                [255, 128, 0],
                [255, 0, 0],
                [255, 255, 255],
            ];
        } else if (code === 4) { // Hot
            this.values = [0, 0.365, 0.746, 1];
            this.colors = [
                [11, 0, 0],
                [255, 0, 0],
                [255, 255, 0],
                [255, 255, 255],
            ];
        } else if (code === 5) { // Cool
            this.values = [0, 1];
            this.colors = [
                [0, 255, 255],
                [255, 0, 255],
            ];
        } else if (code === 6) { // Shaded
            this.values = [0, 0.5, 1];
            this.colors = [
                [0, 0, 0],
                [255, 0, 0],
                [255, 255, 255],
            ];
        }
    }

    addMapping(value: number, red: number, green: number, blue: number) {
        this.values.push(value);
        this.colors.push([red, green, blue]);
        this.dirty = true;
    }

    private compile() {
        // Put the mapping in a structure suited for sorting
        this.entries.length = 0;
        for (let i = 0; i < this.values.length; i++) {
            this.entries.push([this.values[i], this.colors[i]]);
        }

        // Sort by value
        this.entries.sort((a, b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0));
    }

    lookup(value: number): rgb {
        if (this.dirty) {
            this.compile();
            this.dirty = false;
        }

        let idx = this.binarySearch(value);
        if (idx >= 0) {
            return this.entries[idx][1];
        } else { // No direct match
            idx = -idx - 1;
            if (idx === 0) {
                return this.entries[idx][1];
            } else if (idx === this.entries.length) {
                return this.entries[idx - 1][1];
            } else if (this.interpolate) {
                const [start, startColor] = this.entries[idx - 1];
                const [stop, stopColor] = this.entries[idx];
                const f = (value - start) / (stop - start);
                const r = Math.floor((stopColor[0] - startColor[0]) * f + startColor[0]);
                const g = Math.floor((stopColor[1] - startColor[1]) * f + startColor[1]);
                const b = Math.floor((stopColor[2] - startColor[2]) * f + startColor[2]);
                return [r, g, b];
            } else {
                return this.entries[idx - 1][1];
            }
        }
    }

    getMinMax() {
        const min = Math.min.apply(Math, this.values);
        const max = Math.max.apply(Math, this.values);
        return [min, max];
    }

    /**
     * Returns the index of the value in the sorted entry list.
     * If the value is not found, returns a negative number
     * describing which (when negated), tells the insert
     * position of the provide value.
     */
    private binarySearch(value: number): number {
        let m = 0;
        let n = this.entries.length;
        while (m <= n) {
            const k = (n + m) >> 1;
            if (value > this.entries[k][0]) {
                m = k + 1;
            } else if (value < this.entries[k][0]) {
                n = k - 1;
            } else {
                return k;
            }
        }
        return -m - 1;
    }
}
