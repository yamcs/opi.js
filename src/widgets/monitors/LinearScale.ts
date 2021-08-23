import { Color } from '../../Color';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';

export class LinearScale {

    private labels: string[] = [];
    private labelValues: number[] = [];
    private labelPositions: number[] = [];
    private labelVisibilities: boolean[] = [];
    private gridStepInPixel = 0;
    private horizontal = false;
    private length = 0;
    private x = 0;
    private y = 0;

    public margin = 0;

    constructor(
        private scale: number,
        private scaleFont: Font,
        private minimum: number,
        private maximum: number,
        private logScale: boolean,
        private majorTickStepHint: number,
        private foregroundColor: Color,
        private showMinorTicks: boolean,
        private showScale: boolean,
    ) { }

    getValuePosition(value: number) {
        let min = this.minimum;
        let max = this.maximum;
        if (min <= 0) {
            min = 0.1;
        }
        if (max <= min) {
            max = min + 100;
        }

        let pixelsToStart = 0;
        const l = this.length - (2 * this.margin);
        if (this.logScale) {
            if (value <= 0) {
                pixelsToStart = this.margin;
            } else {
                pixelsToStart = ((Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) * l) + this.margin;
            }
        } else {
            const f = Math.max(Math.abs(min), Math.abs(max));
            max /= f;
            min /= f;
            const t = max - min;
            pixelsToStart = ((value / f - min) / t * l) + this.margin;
        }

        return this.horizontal ? pixelsToStart + this.x : this.length - pixelsToStart + this.y;
    }

    drawHorizontal(g: Graphics, x: number, y: number, width: number) {
        this.x = x;
        this.y = y;
        this.length = width;
        this.horizontal = true;
        if (this.showScale) {
            const fm1 = g.measureText(this.format(this.minimum), this.scaleFont);
            const fm2 = g.measureText(this.format(this.maximum), this.scaleFont);
            this.margin = Math.ceil(Math.max(fm1.width, fm2.width) / 2);
        } else {
            this.margin = 0;
        }
        const l = width - (2 * this.margin);
        if (l > 0) {
            this.updateLabels(g, l);
        }
    }

    drawVertical(g: Graphics, x: number, y: number, height: number) {
        const { scale } = this;
        this.x = x;
        this.y = y;
        this.length = height;
        this.horizontal = false;
        if (this.showScale) {
            const fm1 = g.measureText(this.format(this.minimum), this.scaleFont);
            const fm2 = g.measureText(this.format(this.maximum), this.scaleFont);
            this.margin = Math.ceil(Math.max(fm1.height, fm2.height) / 2);
        } else {
            this.margin = 0;
        }
        const l = height - (2 * this.margin);
        if (l > 0) {
            this.updateLabels(g, l);
        }
        let maxWidth = 0;
        for (let i = 0; i < this.labels.length; i++) {
            const fm = g.measureText(this.labels[i], this.scaleFont);
            if (fm.width > maxWidth) {
                maxWidth = fm.width;
            }
        }

        if (this.logScale) {
            for (let i = 0; i < this.labelPositions.length; i++) {
                let tickLength;
                if (this.labelVisibilities[i]) {
                    tickLength = this.majorTickLength;
                } else {
                    tickLength = this.minorTickLength;
                }
                const startX = x + maxWidth + this.spaceBetweenMarkAndLabel
                    - (1 * scale) + this.majorTickLength - tickLength;
                const pathY = Math.round(y + height - this.labelPositions[i]) - (scale * 0.5);
                if (this.labelVisibilities[i] || this.showMinorTicks) {
                    g.strokePath({
                        path: new Path(startX, pathY).lineTo(startX + tickLength, pathY),
                        color: this.foregroundColor,
                        lineWidth: scale * 1,
                    });
                }
                if (this.labelVisibilities[i]) {
                    const textY = y + height - this.labelPositions[i];
                    g.fillText({
                        x,
                        y: textY,
                        align: 'left',
                        baseline: 'middle',
                        font: this.scaleFont,
                        color: this.foregroundColor,
                        text: this.labels[i],
                    });
                }
            }
        } else {
            for (let i = 0; i < this.labels.length; i++) {
                if (!this.labelVisibilities[i]) {
                    continue;
                }
                const textY = y + height - this.labelPositions[i];
                g.fillText({
                    x,
                    y: textY,
                    align: 'left',
                    baseline: 'middle',
                    font: this.scaleFont,
                    color: this.foregroundColor,
                    text: this.labels[i],
                });
                const startX = x + maxWidth + this.spaceBetweenMarkAndLabel - (scale * 1);
                const pathY = Math.round(textY) - (scale * 0.5);
                g.strokePath({
                    path: new Path(startX, pathY).lineTo(startX + this.majorTickLength, pathY),
                    color: this.foregroundColor,
                    lineWidth: scale * 1,
                });

                if (this.showMinorTicks) {
                    this.drawMinorYTicks(g, i, startX, y + height);
                }
            }
        }
        return this.showScale ? maxWidth + this.spaceBetweenMarkAndLabel + this.majorTickLength : 0;
    }

    private drawMinorYTicks(g: Graphics, i: number, x: number, scaleY2: number) {
        let minorTicksNumber;
        if (this.gridStepInPixel / 5 >= this.minorTickMarkStepHint) {
            minorTicksNumber = 5;
        } else if (this.gridStepInPixel / 4 >= this.minorTickMarkStepHint) {
            minorTicksNumber = 4;
        } else {
            minorTicksNumber = 2;
        }
        if (i > 0) {
            for (let j = 0; j < minorTicksNumber; j++) {
                let y = scaleY2 - this.labelPositions[i - 1]
                    - (this.labelPositions[i] - this.labelPositions[i - 1]) * j / minorTicksNumber;
                y = Math.round(y) - (this.scale * 0.5);
                g.strokePath({
                    path: new Path(x + this.majorTickLength - this.minorTickLength, y)
                        .lineTo(x + this.majorTickLength, y),
                    color: this.foregroundColor,
                    lineWidth: this.scale * 1,
                });
            }
        }
    }

    private updateLabels(g: Graphics, length: number) {
        this.labels = [];
        this.labelValues = [];
        this.labelPositions = [];
        if (this.showScale) {
            if (this.logScale) {
                this.updateLabelsForLogScale(this.minimum, this.maximum, length);
            } else {
                const gridStep = this.getGridStep(length, this.minimum, this.maximum);
                const f = Math.max(Math.abs(this.minimum), Math.abs(this.maximum));
                const t = this.maximum / f - this.minimum / f;
                this.gridStepInPixel = Math.floor(length * (gridStep / f) / t);
                this.updateLabelsForLinearScale(this.minimum, this.maximum, length, gridStep);
            }
        }
        this.updateVisibility(g);
    }

    private getGridStep(lengthInPixels: number, minimum: number, maximum: number): number {
        if (lengthInPixels <= 0) {
            lengthInPixels = 1;
        }
        let minBigger = false;
        if (minimum >= maximum) {
            if (maximum === minimum) {
                maximum++;
            } else {
                minBigger = true;
                const swap = minimum;
                minimum = maximum;
                maximum = swap;
            }
        }

        const length = Math.abs(maximum - minimum);

        let majorTickMarkStepHint = this.majorTickStepHint;
        if (majorTickMarkStepHint > lengthInPixels) {
            majorTickMarkStepHint = lengthInPixels;
        }
        let gridStepHint = length / lengthInPixels * majorTickMarkStepHint;

        let mantissa = gridStepHint;
        let exp = 0;
        if (mantissa < 1) {
            if (mantissa != 0)
                while (mantissa < 1) {
                    mantissa *= 10.0;
                    exp--;
                }
        } else {
            while (mantissa >= 10) {
                mantissa /= 10.0;
                exp++;
            }
        }

        let gridStep;
        if (mantissa > 7.5) {
            gridStep = 10 * Math.pow(10, exp);
        } else if (mantissa > 3.5) {
            gridStep = 5 * Math.pow(10, exp);
        } else if (mantissa > 1.5) {
            gridStep = 2 * Math.pow(10, exp);
        } else {
            gridStep = Math.pow(10, exp);
        }
        if (minBigger) {
            gridStep = -gridStep;
        }
        return gridStep;
    }

    private updateLabelsForLogScale(min: number, max: number, length: number) {
        if (min <= 0) {
            min = 0.1;
        }
        if (max <= min) {
            max = min + 100;
        }

        const minBigger = max < min;

        const logMin = Math.log10(min);
        const minLogDigit = Math.ceil(logMin);
        const maxLogDigit = Math.ceil(Math.log10(max));

        let tickStep = Math.pow(10, minLogDigit - 1);
        let firstPosition;

        if ((min % tickStep) <= 0) {
            firstPosition = min - (min % tickStep);
        } else {
            if (minBigger) {
                firstPosition = min - (min % tickStep);
            } else {
                firstPosition = min - (min % tickStep) + tickStep;
            }
        }

        if (minBigger && min > firstPosition) {
            this.addMinMaxTickInfo(min, length, true);
        } else if (!minBigger && min < firstPosition) {
            this.addMinMaxTickInfo(min, length, true);
        }

        for (let i = minLogDigit; minBigger ? i >= maxLogDigit : i <= maxLogDigit; i += minBigger ? -1 : 1) {
            // if the range is too big skip minor ticks
            if (Math.abs(maxLogDigit - minLogDigit) > 20) {
                const v = Math.pow(10, i);
                if (v > max) {
                    break;
                }
                this.addTickInfo(v, max, logMin, length);
            } else {
                for (let j = firstPosition; minBigger ? j >= Math.pow(10, i - 1)
                    : j <= Math.pow(10, i); j = minBigger ? (j - tickStep) : (j + tickStep)) {
                    if (minBigger ? j < max : j > max) {
                        break;
                    }
                    this.addTickInfo(j, max, logMin, length);
                }
                tickStep = minBigger ? (tickStep / Math.pow(10, 1)) : (tickStep * Math.pow(10, 1));
                firstPosition = minBigger ? Math.pow(10, i - 1) : (tickStep + Math.pow(10, i));
            }
        }

        if (minBigger ? max < this.labelValues[this.labelValues.length - 1]
            : max > this.labelValues[this.labelValues.length - 1]) {
            this.addMinMaxTickInfo(max, length, false);
        }
    }

    private addMinMaxTickInfo(value: number, length: number, isMin: boolean) {
        if (isMin) {
            this.labelValues.push(value);
            this.labels.push(this.format(value));
            this.labelPositions.push(this.margin);
        } else {
            this.labelValues.push(value);
            this.labels.push(this.format(value));
            this.labelPositions.push(this.margin + length);
        }
    }

    private addTickInfo(d: number, max: number, logMin: number, length: number) {
        this.labels.push(this.format(d));
        const labelPosition = Math.floor((Math.log10(d) - logMin) / (Math.log10(max) - logMin) * length)
            + this.margin;
        this.labelPositions.push(labelPosition);
        this.labelValues.push(d);
    }

    private updateLabelsForLinearScale(min: number, max: number, length: number, tickStep: number) {
        const minBigger = max < min;
        let firstPosition;

        // make firstPosition as the right most of min based on tickStep
        if (min % tickStep <= 0) {
            firstPosition = min - min % tickStep;
        } else {
            firstPosition = min - min % tickStep + tickStep;
        }

        if (min > firstPosition == minBigger) {
            this.labelValues.push(min);
            this.labels.push(this.format(min));
            this.labelPositions.push(this.margin);
        }

        let i = 1;
        const f = Math.max(Math.abs(min), Math.abs(max));
        max /= f;
        min /= f;
        tickStep /= f;
        firstPosition /= f;
        const t = max - min;
        for (let p = firstPosition; max >= min ? p < max : p > max; p = firstPosition + i++ * tickStep) {
            const b = p * f;
            this.labels.push(this.format(b));
            this.labelValues.push(b);

            const tickLabelPosition = Math.floor((p - min) / t * length) + this.margin;
            this.labelPositions.push(tickLabelPosition);
        }

        max *= f;
        this.labelValues.push(max);
        this.labels.push(this.format(max));
        this.labelPositions.push(this.margin + length);
    }

    private updateVisibility(g: Graphics) {
        this.labelVisibilities = [];
        if (!this.labelPositions.length) {
            return;
        }

        for (let i = 0; i < this.labelPositions.length; i++) {
            this.labelVisibilities.push(true);
        }

        // set the tick label visibility
        let previousPosition = 0;
        let previousLabel = null;
        for (let i = 0; i < this.labelPositions.length; i++) {
            let hasSpaceToDraw = true;
            const currentLabel = this.labels[i];
            const currentPosition = this.labelPositions[i];
            if (i !== 0) {
                hasSpaceToDraw = this.hasSpaceToDraw(g, previousPosition, currentPosition, previousLabel || '', currentLabel);
            }

            const isRepeatSameTickAndNotEnd = (currentLabel === previousLabel)
                && (i !== 0 && i !== this.labelPositions.length - 1);

            let isMajorTickOrEnd = true;
            if (this.logScale) {
                const prettyNumber = Number(this.labels[i]);
                isMajorTickOrEnd = this.isMajorTick(prettyNumber) || i === 0 || i === this.labelPositions.length - 1;
            }

            if (!hasSpaceToDraw || isRepeatSameTickAndNotEnd || !isMajorTickOrEnd) {
                this.labelVisibilities[i] = false;
            } else {
                previousPosition = currentPosition;
                previousLabel = currentLabel;
            }
        }
    }

    private hasSpaceToDraw(g: Graphics, previousPosition: number, tickLabelPosition: number, previousTickLabel: string, tickLabel: string) {
        const tickLabelSize = g.measureText(tickLabel, this.scaleFont);
        const previousTickLabelSize = g.measureText(previousTickLabel, this.scaleFont);
        let interval = tickLabelPosition - previousPosition;
        let textLength = Math.floor(this.horizontal ? (tickLabelSize.width / 2.0 + previousTickLabelSize.width / 2.0)
            : tickLabelSize.height);
        let noLapOnPrevious = true;
        let noLapOnEnd = true;
        // if it is not the end tick label
        if (tickLabelPosition != this.labelPositions[this.labelPositions.length - 1]) {
            noLapOnPrevious = interval > (textLength + this.tickLabelGap);
            const endTickLabelSize = g.measureText(this.labels[this.labels.length - 1], this.scaleFont);
            interval = this.labelPositions[this.labelPositions.length - 1] - tickLabelPosition;
            textLength = Math.floor(this.horizontal ? (tickLabelSize.width / 2.0 + endTickLabelSize.width / 2.0)
                : tickLabelSize.height);
            noLapOnEnd = interval > textLength + this.tickLabelGap;
        }
        return noLapOnPrevious && noLapOnEnd;
    }

    private isMajorTick(tickValue: number) {
        if (!this.logScale) {
            return true;
        }

        const log10 = Math.log10(tickValue);
        if (log10 === Math.round(log10)) {
            return true;
        }

        return false;
    }

    private format(v: number) {
        return String(Number(v.toFixed(2)));
    }

    get spaceBetweenMarkAndLabel() { return this.scale * 2; }
    get majorTickLength() { return this.scale * 6; }
    get minorTickLength() { return this.scale * 3; }
    get minorTickMarkStepHint() { return this.scale * 4; }
    get tickLabelGap() { return this.scale * 2; }
}
