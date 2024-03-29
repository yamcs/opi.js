import { Color } from "../../Color";
import { DecimalFormat } from "../../DecimalFormat";
import { Font } from "../../Font";
import { Graphics, Path } from "../../Graphics";
import { Range } from "../../Range";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface FormatDateOptions {
  year: boolean;
  month: boolean;
  day: boolean;
}

interface FormatTimeOptions {
  hours: boolean;
  minutes: boolean;
  seconds: boolean;
  milliseconds: boolean;
}

export class LinearScale {
  private labels: string[] = [];
  private labelValues: number[] = [];
  private labelPositions: number[] = [];
  private labelVisibilities: boolean[] = [];
  private gridStepInPixel = 0;
  private horizontal = false;
  private x = 0;
  private y = 0;

  public scaleFormat = "";
  public timeFormat = 0;
  public length = 0;
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
    private showScale: boolean
  ) { }

  get scaleLength() {
    return this.length - 2 * this.margin;
  }

  /** Only available post-draw */
  getX() {
    return this.x;
  }

  /** Only available post-draw */
  getY() {
    return this.y;
  }

  /** Only available post-draw */
  getGridPositions() {
    let result = [...this.labelPositions];
    if (!this.horizontal) {
      result = result.map((pos) => this.length - pos);
    }
    result.pop();
    result.shift();
    return result;
  }

  /**
   * Use only when the scale is not drawn, but you still need
   * getValuePosition to work.
   */
  setDimensions(x: number, y: number, length: number, horizontal: boolean) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.horizontal = horizontal;
  }

  getValuePosition(value: number) {
    let { start: min, stop: max } = this.getMinMax();

    let pixelsToStart = 0;
    const l = this.length - 2 * this.margin;
    if (this.logScale) {
      if (value <= 0) {
        pixelsToStart = this.margin;
      } else {
        pixelsToStart =
          ((Math.log10(value) - Math.log10(min)) /
            (Math.log10(max) - Math.log10(min))) *
          l +
          this.margin;
      }
    } else {
      const f = Math.max(Math.abs(min), Math.abs(max));
      max /= f;
      min /= f;
      const t = max - min;
      pixelsToStart = ((value / f - min) / t) * l + this.margin;
    }

    return this.horizontal
      ? pixelsToStart + this.x
      : this.length - pixelsToStart + this.y;
  }

  getMinMax(): Range {
    let start = this.minimum;
    let stop = this.maximum;
    if (this.logScale) {
      if (start <= 0) {
        start = 0.1;
      }
      if (stop <= start) {
        stop = start + 100;
      }
    }
    return { start, stop };
  }

  getPositionValue(absolutePosition: number) {
    const range = this.getMinMax();
    let { start: min, stop: max } = range;

    const pixelsToStart = this.horizontal
      ? absolutePosition - this.x
      : this.length + this.y - absolutePosition;
    const l = this.length - 2 * this.margin;

    let value;
    if (this.logScale) {
      value = Math.pow(
        10,
        ((pixelsToStart - this.margin) * (Math.log10(max) - Math.log10(min))) /
        l +
        Math.log10(min)
      );
    } else {
      const f = Math.max(Math.abs(min), Math.abs(max));
      max /= f;
      min /= f;
      const t = max - min;
      value = (((pixelsToStart - this.margin) / l) * t + min) * f;
    }

    return value;
  }

  calculateMargin(g: Graphics, horizontal: boolean) {
    if (this.showScale) {
      const fm1 = g.measureText(this.format(this.minimum), this.scaleFont);
      const fm2 = g.measureText(this.format(this.maximum), this.scaleFont);
      if (horizontal) {
        return Math.ceil(Math.max(fm1.width, fm2.width) / 2);
      } else {
        return Math.ceil(Math.max(fm1.height, fm2.height) / 2);
      }
    } else {
      return 0;
    }
  }

  measureHorizontalHeight(g: Graphics) {
    const fm = g.measureText("dummy", this.scaleFont);
    return this.showScale
      ? fm.height + this.spaceBetweenMarkAndLabel + this.majorTickLength
      : 0;
  }

  // (x, y) is coordinate of bottom-left corner
  drawHorizontal(g: Graphics, x: number, y: number, width: number) {
    const { scale } = this;
    this.length = width;
    this.horizontal = true;
    this.margin = this.calculateMargin(g, this.horizontal);
    const l = width - 2 * this.margin;
    if (l > 0) {
      this.updateLabels(g, l);
    }
    let maxHeight = 0;
    for (let i = 0; i < this.labels.length; i++) {
      const fm = g.measureText(this.labels[i], this.scaleFont);
      if (fm.height > maxHeight) {
        maxHeight = fm.height;
      }
    }

    const scaleHeight = this.showScale
      ? maxHeight + this.spaceBetweenMarkAndLabel + this.majorTickLength
      : 0;
    y = y - scaleHeight;
    this.x = x;
    this.y = y;

    if (this.logScale) {
      for (let i = 0; i < this.labelPositions.length; i++) {
        const x = this.x + this.labelPositions[i];
        const y = this.y;
        let tickLength = 0;
        if (this.labelVisibilities[i]) {
          tickLength = this.majorTickLength;
        } else {
          tickLength = this.minorTickLength;
        }

        if (this.labelVisibilities[i] || this.showMinorTicks) {
          const pathX = Math.round(x) - scale * 0.5;
          g.strokePath({
            path: new Path(pathX, y).lineTo(pathX, y + tickLength),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
        if (this.labelVisibilities[i]) {
          g.fillText({
            x,
            y: this.y + this.spaceBetweenMarkAndLabel + this.majorTickLength,
            align: "center",
            baseline: "top",
            font: this.scaleFont,
            color: this.foregroundColor,
            text: this.labels[i],
          });
        }
      }
    } else {
      for (let i = 0; i < this.labels.length; i++) {
        const textX = x + this.labelPositions[i];
        if (this.labelVisibilities[i]) {
          g.fillText({
            x: textX,
            y: y + this.majorTickLength + this.spaceBetweenMarkAndLabel,
            align: "center",
            baseline: "top",
            font: this.scaleFont,
            color: this.foregroundColor,
            text: this.labels[i],
          });
        }
        const pathX = Math.round(textX) - scale * 0.5;
        g.strokePath({
          path: new Path(pathX, y).lineTo(pathX, y + this.majorTickLength),
          color: this.foregroundColor,
          lineWidth: scale * 1,
          opacity: 100 / 255,
        });

        if (this.showMinorTicks) {
          this.drawMinorXTicks(g, i, x, y);
        }
      }
    }
    return scaleHeight;
  }

  // If leftCoordinate, the provided (x, y) is used as the fixed top left corner.
  // Else, the provided (x, y) is used as the fixed top right corner.
  drawVertical(
    g: Graphics,
    x: number,
    y: number,
    height: number,
    leftCoordinate: boolean,
    ticksLeft = false
  ) {
    const { scale } = this;
    this.length = height;
    this.horizontal = false;
    this.margin = this.calculateMargin(g, this.horizontal);
    const l = height - 2 * this.margin;
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

    const scaleWidth = this.showScale
      ? maxWidth + this.spaceBetweenMarkAndLabel + this.majorTickLength
      : 0;
    if (!leftCoordinate) {
      x = x - scaleWidth;
    }
    this.x = x;
    this.y = y;

    if (this.logScale) {
      for (let i = 0; i < this.labelPositions.length; i++) {
        let tickLength;
        if (this.labelVisibilities[i]) {
          tickLength = this.majorTickLength;
        } else {
          tickLength = this.minorTickLength;
        }
        const startX =
          x +
          maxWidth +
          this.spaceBetweenMarkAndLabel -
          1 * scale +
          this.majorTickLength -
          tickLength;
        const pathY =
          Math.round(y + height - this.labelPositions[i]) - scale * 0.5;
        if (this.labelVisibilities[i] || this.showMinorTicks) {
          g.strokePath({
            path: new Path(startX, pathY).lineTo(startX + tickLength, pathY),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
        if (this.labelVisibilities[i]) {
          const textY = y + height - this.labelPositions[i];
          g.fillText({
            x,
            y: textY,
            align: "left",
            baseline: "middle",
            font: this.scaleFont,
            color: this.foregroundColor,
            text: this.labels[i],
          });
        }
      }
    } else {
      for (let i = 0; i < this.labels.length; i++) {
        const textY = y + height - this.labelPositions[i];
        const pathY = Math.round(textY) - scale * 0.5;
        if (ticksLeft) {
          g.strokePath({
            path: new Path(x, pathY).lineTo(x + this.majorTickLength, pathY),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
          if (this.labelVisibilities[i]) {
            const textX =
              x + this.majorTickLength + this.spaceBetweenMarkAndLabel;
            g.fillText({
              x: textX,
              y: textY,
              align: "left",
              baseline: "middle",
              font: this.scaleFont,
              color: this.foregroundColor,
              text: this.labels[i],
            });
          }
        } else {
          if (this.labelVisibilities[i]) {
            g.fillText({
              x,
              y: textY,
              align: "left",
              baseline: "middle",
              font: this.scaleFont,
              color: this.foregroundColor,
              text: this.labels[i],
            });
          }
          const startX =
            x + maxWidth + this.spaceBetweenMarkAndLabel - scale * 1;
          g.strokePath({
            path: new Path(startX, pathY).lineTo(
              startX + this.majorTickLength,
              pathY
            ),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });

          if (this.showMinorTicks) {
            this.drawMinorYTicks(g, i, startX, y + height);
          }
        }
      }
    }
    return scaleWidth;
  }

  private drawMinorXTicks(g: Graphics, i: number, x0: number, y: number) {
    const { gridStepInPixel } = this;
    let minorTicksNumber;
    let minorGridStepInPixel;
    if (gridStepInPixel / 5 >= this.minorTickMarkStepHint) {
      minorTicksNumber = 5;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 5);
    } else if (gridStepInPixel / 4 >= this.minorTickMarkStepHint) {
      minorTicksNumber = 4;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 4);
    } else {
      minorTicksNumber = 2;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 2);
    }

    const { labelPositions, minorTickLength, scale } = this;
    if (i > 0) {
      // First and last step sometimes don't need all ticks.
      if (i === 1 && labelPositions[1] - labelPositions[0] < gridStepInPixel) {
        let x = labelPositions[1];
        while (x - labelPositions[0] > minorGridStepInPixel + 3 * scale) {
          x = x - minorGridStepInPixel;
          const tickX = Math.round(x0 + x) - scale * 0.5;
          g.strokePath({
            path: new Path(tickX, y).lineTo(tickX, y + minorTickLength),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
      } else if (
        i === labelPositions.length - 1 &&
        labelPositions[i] - labelPositions[i - 1] < gridStepInPixel
      ) {
        let x = labelPositions[i - 1];
        while (labelPositions[i] - x > minorGridStepInPixel + 3 * scale) {
          x = x + minorGridStepInPixel;
          const tickX = Math.round(x0 + x) - scale * 0.5;
          g.strokePath({
            path: new Path(tickX, y).lineTo(tickX, y + minorTickLength),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
      } else {
        // Normal step
        for (let j = 0; j < minorTicksNumber; j++) {
          let tickX =
            x0 +
            labelPositions[i - 1] +
            ((labelPositions[i] - labelPositions[i - 1]) * j) /
            minorTicksNumber;
          tickX = Math.round(tickX) - scale * 0.5;
          g.strokePath({
            path: new Path(tickX, y).lineTo(tickX, y + minorTickLength),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
      }
    }
  }

  private drawMinorYTicks(g: Graphics, i: number, x: number, scaleY2: number) {
    const { gridStepInPixel } = this;
    let minorTicksNumber;
    let minorGridStepInPixel;
    if (gridStepInPixel / 5 >= this.minorTickMarkStepHint) {
      minorTicksNumber = 5;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 5);
    } else if (gridStepInPixel / 4 >= this.minorTickMarkStepHint) {
      minorTicksNumber = 4;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 4);
    } else {
      minorTicksNumber = 2;
      minorGridStepInPixel = Math.floor(gridStepInPixel / 2);
    }

    const { labelPositions, minorTickLength, majorTickLength, scale } = this;
    if (i > 0) {
      // First and last step sometimes don't need all ticks.
      if (i === 1 && labelPositions[1] - labelPositions[0] < gridStepInPixel) {
        let y = labelPositions[1];
        while (y - labelPositions[0] > minorGridStepInPixel + 3 * scale) {
          y -= minorGridStepInPixel;
          const pathY = Math.round(scaleY2 - y) - scale * 0.5;
          g.strokePath({
            path: new Path(x + majorTickLength - minorTickLength, pathY).lineTo(
              x + majorTickLength,
              pathY
            ),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
      } else if (
        i === labelPositions.length - 1 &&
        labelPositions[i] - labelPositions[i - 1] < gridStepInPixel
      ) {
        let y = labelPositions[i - 1];
        while (labelPositions[i] - y > minorGridStepInPixel + 3 * scale) {
          y += minorGridStepInPixel;
          const pathY = Math.round(scaleY2 - y) - scale * 0.5;
          g.strokePath({
            path: new Path(x + majorTickLength - minorTickLength, pathY).lineTo(
              x + majorTickLength,
              pathY
            ),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
      } else {
        // Normal step
        for (let j = 0; j < minorTicksNumber; j++) {
          let y =
            scaleY2 -
            labelPositions[i - 1] -
            ((labelPositions[i] - labelPositions[i - 1]) * j) /
            minorTicksNumber;
          y = Math.round(y) - scale * 0.5;
          g.strokePath({
            path: new Path(x + majorTickLength - minorTickLength, y).lineTo(
              x + majorTickLength,
              y
            ),
            color: this.foregroundColor,
            lineWidth: scale * 1,
            opacity: 100 / 255,
          });
        }
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
        this.gridStepInPixel = Math.floor((length * (gridStep / f)) / t);
        this.updateLabelsForLinearScale(
          this.minimum,
          this.maximum,
          length,
          gridStep
        );
      }
    }
    this.updateVisibility(g);
  }

  private getGridStep(
    lengthInPixels: number,
    minimum: number,
    maximum: number
  ): number {
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
    let gridStepHint = (length / lengthInPixels) * majorTickMarkStepHint;

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

    if (min % tickStep <= 0) {
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

    for (
      let i = minLogDigit;
      minBigger ? i >= maxLogDigit : i <= maxLogDigit;
      i += minBigger ? -1 : 1
    ) {
      // if the range is too big skip minor ticks
      if (Math.abs(maxLogDigit - minLogDigit) > 20) {
        const v = Math.pow(10, i);
        if (v > max) {
          break;
        }
        this.addTickInfo(v, max, logMin, length);
      } else {
        for (
          let j = firstPosition;
          minBigger ? j >= Math.pow(10, i - 1) : j <= Math.pow(10, i);
          j = minBigger ? j - tickStep : j + tickStep
        ) {
          if (minBigger ? j < max : j > max) {
            break;
          }
          this.addTickInfo(j, max, logMin, length);
        }
        tickStep = minBigger
          ? tickStep / Math.pow(10, 1)
          : tickStep * Math.pow(10, 1);
        firstPosition = minBigger
          ? Math.pow(10, i - 1)
          : tickStep + Math.pow(10, i);
      }
    }

    if (
      minBigger
        ? max < this.labelValues[this.labelValues.length - 1]
        : max > this.labelValues[this.labelValues.length - 1]
    ) {
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
    const labelPosition =
      Math.floor(
        ((Math.log10(d) - logMin) / (Math.log10(max) - logMin)) * length
      ) + this.margin;
    this.labelPositions.push(labelPosition);
    this.labelValues.push(d);
  }

  private updateLabelsForLinearScale(
    min: number,
    max: number,
    length: number,
    tickStep: number
  ) {
    const minBigger = max < min;
    let firstPosition;

    // make firstPosition as the right most of min based on tickStep
    if (min % tickStep <= 0) {
      firstPosition = min - (min % tickStep);
    } else {
      firstPosition = min - (min % tickStep) + tickStep;
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
    for (
      let p = firstPosition;
      max >= min ? p < max : p > max;
      p = firstPosition + i++ * tickStep
    ) {
      const b = p * f;
      this.labels.push(this.format(b));
      this.labelValues.push(b);

      const tickLabelPosition =
        Math.floor(((p - min) / t) * length) + this.margin;
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
        hasSpaceToDraw = this.hasSpaceToDraw(
          g,
          previousPosition,
          currentPosition,
          previousLabel || "",
          currentLabel
        );
      }

      const isRepeatSameTickAndNotEnd =
        currentLabel === previousLabel &&
        i !== 0 &&
        i !== this.labelPositions.length - 1;

      let isMajorTickOrEnd = true;
      if (this.logScale) {
        const prettyNumber = Number(this.labels[i]);
        isMajorTickOrEnd =
          this.isMajorTick(prettyNumber) ||
          i === 0 ||
          i === this.labelPositions.length - 1;
      }

      if (!hasSpaceToDraw || isRepeatSameTickAndNotEnd || !isMajorTickOrEnd) {
        this.labelVisibilities[i] = false;
      } else {
        previousPosition = currentPosition;
        previousLabel = currentLabel;
      }
    }
  }

  private hasSpaceToDraw(
    g: Graphics,
    previousPosition: number,
    tickLabelPosition: number,
    previousTickLabel: string,
    tickLabel: string
  ) {
    const tickLabelSize = g.measureText(tickLabel, this.scaleFont);
    const previousTickLabelSize = g.measureText(
      previousTickLabel,
      this.scaleFont
    );
    let interval = tickLabelPosition - previousPosition;
    let textLength = Math.floor(
      this.horizontal
        ? tickLabelSize.width / 2.0 + previousTickLabelSize.width / 2.0
        : tickLabelSize.height
    );
    let noLapOnPrevious = true;
    let noLapOnEnd = true;
    // if it is not the end tick label
    if (
      tickLabelPosition != this.labelPositions[this.labelPositions.length - 1]
    ) {
      noLapOnPrevious = interval > textLength + this.tickLabelGap;
      const endTickLabelSize = g.measureText(
        this.labels[this.labels.length - 1],
        this.scaleFont
      );
      interval =
        this.labelPositions[this.labelPositions.length - 1] - tickLabelPosition;
      textLength = Math.floor(
        this.horizontal
          ? tickLabelSize.width / 2.0 + endTickLabelSize.width / 2.0
          : tickLabelSize.height
      );
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
    if (this.timeFormat === 0) {
      if (this.scaleFormat) {
        return new DecimalFormat(this.scaleFormat).format(v);
      } else {
        return String(Number(v.toFixed(2)));
      }
    }

    const dt = new Date(v);
    switch (this.timeFormat) {
      case 1: // yyyy-MM-dd HH:mm:ss
        return (
          this.formatDate(dt, {
            year: true,
            month: true,
            day: true,
          }) +
          "\n" +
          this.formatTime(dt, {
            hours: true,
            minutes: true,
            seconds: true,
            milliseconds: false,
          })
        );
      case 2: // yyyy-MM-dd HH:mm:ss.SSS
        return (
          this.formatDate(dt, {
            year: true,
            month: true,
            day: true,
          }) +
          "\n" +
          this.formatTime(dt, {
            hours: true,
            minutes: true,
            seconds: true,
            milliseconds: true,
          })
        );
      case 3: // HH:mm:ss
        return this.formatTime(dt, {
          hours: true,
          minutes: true,
          seconds: true,
          milliseconds: false,
        });
      case 4: // HH:mm:ss.SSS
        return this.formatTime(dt, {
          hours: true,
          minutes: true,
          seconds: true,
          milliseconds: true,
        });
      case 5: // HH:mm
        return this.formatTime(dt, {
          hours: true,
          minutes: true,
          seconds: false,
          milliseconds: false,
        });
      case 6: // yyyy-MM-dd
        return this.formatDate(dt, {
          year: true,
          month: true,
          day: true,
        });
      case 7: // MMMMM d
        const mmmmm = months[dt.getUTCMonth()];
        const d = dt.getUTCDate();
        return `${mmmmm} ${d}`;
      case 8: // Auto
        const length = Math.abs(this.maximum - this.minimum);
        if (length <= 5000) {
          // ss.SSS
          return this.formatTime(dt, {
            hours: false,
            minutes: false,
            seconds: true,
            milliseconds: true,
          });
        } else if (length <= 1800000) {
          // HH:mm:ss
          return this.formatTime(dt, {
            hours: true,
            minutes: true,
            seconds: true,
            milliseconds: false,
          });
        } else if (length <= 86400000) {
          // HH:mm
          return this.formatTime(dt, {
            hours: true,
            minutes: true,
            seconds: false,
            milliseconds: false,
          });
        } else if (length <= 604800000) {
          // MM-dd HH:mm
          return (
            this.formatDate(dt, {
              year: false,
              month: true,
              day: true,
            }) +
            "\n" +
            this.formatTime(dt, {
              hours: true,
              minutes: true,
              seconds: false,
              milliseconds: false,
            })
          );
        } else if (length <= 2592000000) {
          // MM-dd
          return this.formatDate(dt, {
            year: false,
            month: true,
            day: true,
          });
        } else {
          // yyyy-MM-dd
          return this.formatDate(dt, {
            year: true,
            month: true,
            day: true,
          });
        }
    }
    return "";
  }

  private formatDate(dt: Date, opts: FormatDateOptions) {
    let result = "";
    if (opts.year) {
      result += dt.getUTCFullYear();
    }
    if (opts.month) {
      if (opts.year) {
        result += "-";
      }
      const month = dt.getUTCMonth();
      result += (month < 10 ? "0" : "") + month;
    }
    if (opts.day) {
      if (opts.month) {
        result += "-";
      }
      const day = dt.getUTCDate();
      result += (day < 10 ? "0" : "") + day;
    }
    return result;
  }

  private formatTime(dt: Date, opts: FormatTimeOptions) {
    let result = "";
    if (opts.hours) {
      const h = dt.getUTCHours();
      result += (h < 10 ? "0" : "") + h;
    }
    if (opts.minutes) {
      if (opts.hours) {
        result += ":";
      }
      const m = dt.getUTCMinutes();
      result += (m < 10 ? "0" : "") + m;
    }
    if (opts.seconds) {
      if (opts.minutes) {
        result += ":";
      }
      const s = dt.getUTCSeconds();
      result += (s < 10 ? "0" : "") + s;
    }
    if (opts.milliseconds) {
      if (opts.seconds) {
        result += ".";
      }
      const ms = dt.getUTCMilliseconds();
      result += (ms < 10 ? "00" : ms < 100 ? "0" : "") + ms;
    }
    return result;
  }

  get spaceBetweenMarkAndLabel() {
    return this.scale * 2;
  }
  get majorTickLength() {
    return this.scale * 6;
  }
  get minorTickLength() {
    return this.scale * 3;
  }
  get minorTickMarkStepHint() {
    return this.scale * 4;
  }
  get tickLabelGap() {
    return this.scale * 2;
  }
}
