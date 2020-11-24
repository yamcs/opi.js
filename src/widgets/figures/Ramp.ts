import { Color } from '../../Color';
import { Graphics } from '../../Graphics';
import { Bounds, convertPolarToCartesian, toRadians } from '../../positioning';

const SPACE_BTW_MARK_LABEL = 1;
const MAJOR_TICK_LENGTH = 8;

// In degrees
const RAMP_OVERLAP = 2;

export class Ramp {

    lolo = 10;
    loloColor = Color.RED;
    showLoLo = true;

    lo = 25;
    loColor = Color.ORANGE;
    showLo = true;

    hi = 75;
    hiColor = Color.ORANGE;
    showHi = true;

    hihi = 90;
    hihiColor = Color.RED;
    showHiHi = true;

    minimum = 0;
    maximum = 100;
    gradient = true;
    logScale = false;
    effect3d = true;
    labelsOutside = true;

    // Calculated when drawn
    private range: Range = { min: this.minimum, max: this.maximum };
    private lengthInDegrees = 0;
    private radius = 0;

    constructor(private rampWidth: number, private startAngle: number, private endAngle: number) {
    }

    draw(g: Graphics, scaleArea: Bounds, rampArea: Bounds) {
        if (this.labelsOutside) {
            // set an estimated radius first
            const estimatedDonutWidth = SPACE_BTW_MARK_LABEL + MAJOR_TICK_LENGTH;
            this.radius = scaleArea.width / 2 - estimatedDonutWidth;

            // adjust the radius so the tick labels have enough space to
            // be drawn inside the bounds
            // radius -= tickLabels.getTickLabelMaxOutLength();
        } else {
            this.radius = scaleArea.width / 2 - 1;
        }

        this.range = this.getRenderedRange();
        if (this.endAngle - this.startAngle > 0) {
            this.lengthInDegrees = 360 - (this.endAngle - this.startAngle);
        } else {
            this.lengthInDegrees = this.startAngle - this.endAngle;
        }

        this.drawRamp(g, rampArea);
    }

    drawRamp(g: Graphics, area: Bounds) {
        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        const rx = area.width / 2;
        const ry = area.height / 2;

        // Convert angles
        let leftMostAngle;
        let rightMostAngle = 360 - this.endAngle;
        if (this.endAngle - this.startAngle > 0) { // Gauge
            leftMostAngle = this.startAngle - 90;
        } else { // Meter
            leftMostAngle = this.startAngle + 90;
        }

        // LOLO
        if (this.showLoLo) {
            let startAngle = leftMostAngle;
            let endAngle = 360 - this.getValuePosition(this.lolo, true);
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: this.loloColor,
            });
        }

        // LO
        if (this.showLo) {
            let loLeft;
            if (this.showLoLo) {
                loLeft = this.lolo;
            } else {
                loLeft = this.minimum;
            }
            const startAngle = 360 - this.getValuePosition(loLeft, true);
            const endAngle = 360 - this.getValuePosition(this.lo, true);

            if (this.effect3d && this.gradient && this.showLoLo) {
                const gradientLeftAngle = toRadians(this.getValuePosition(loLeft, true) - RAMP_OVERLAP);
                const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

                const gradientRightAngle = toRadians(this.getValuePosition(this.lo, true) + RAMP_OVERLAP);
                const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
                const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
                gradient.addColorStop(0, this.loloColor.toString());
                gradient.addColorStop(1, this.loColor.toString());
                g.strokeEllipse({
                    cx,
                    cy,
                    rx: rx - this.rampWidth / 2,
                    ry: ry - this.rampWidth / 2,
                    lineWidth: this.rampWidth,
                    startAngle: toRadians(startAngle - RAMP_OVERLAP / 2),
                    endAngle: toRadians(endAngle + RAMP_OVERLAP / 2),
                    gradient,
                });
            } else {
                g.strokeEllipse({
                    cx,
                    cy,
                    rx: rx - this.rampWidth / 2,
                    ry: ry - this.rampWidth / 2,
                    lineWidth: this.rampWidth,
                    startAngle: toRadians(startAngle),
                    endAngle: toRadians(endAngle),
                    color: this.loColor,
                });
            }
        }

        let midLeft = this.minimum;
        if (this.showLo) {
            midLeft = this.lo;
        } else if (this.showLoLo) {
            midLeft = this.lolo;
        }

        let midRight = this.maximum;
        if (this.showHi) {
            midRight = this.hi;
        } else if (this.showHiHi) {
            midRight = this.hihi;
        }

        const midNormal = (midLeft + midRight) / 2;

        // NORMAL (left part)
        let startAngle = 360 - this.getValuePosition(midLeft, true);
        let endAngle = 360 - this.getValuePosition(midNormal, true);
        if (this.effect3d && this.gradient && (this.showLoLo || this.showLo)) {
            const gradientLeftAngle = toRadians(this.getValuePosition(midLeft, true) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(midNormal, true) + RAMP_OVERLAP);
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, (this.showLo ? this.loColor : this.loloColor).toString());
            gradient.addColorStop(1, Color.GREEN.toString());
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle - RAMP_OVERLAP / 2),
                endAngle: toRadians(endAngle + RAMP_OVERLAP / 2),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: Color.GREEN,
            });
        }

        // NORMAL (right part)
        startAngle = 360 - this.getValuePosition(midNormal, true);
        endAngle = 360 - this.getValuePosition(midRight, true);
        if (this.effect3d && this.gradient && (this.showHi || this.showHiHi)) {
            const gradientLeftAngle = toRadians(this.getValuePosition(midNormal, true) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(midRight, true) + RAMP_OVERLAP);
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, Color.GREEN.toString());
            gradient.addColorStop(1, (this.showHi ? this.hiColor : this.hihiColor).toString());
            const overlap = endAngle !== rightMostAngle ? RAMP_OVERLAP / 2 : 0;
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle - RAMP_OVERLAP / 2),
                endAngle: toRadians(endAngle + overlap),
                gradient,
            });
        } else {
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle),
                color: Color.GREEN,
            });
        }

        // HI
        if (this.showHi) {
            let hiRight;
            if (this.showHiHi) {
                hiRight = this.hihi;
            } else {
                hiRight = this.maximum;
            }
            const startAngle = 360 - this.getValuePosition(this.hi, true);
            const endAngle = 360 - this.getValuePosition(hiRight, true);

            if (this.effect3d && this.gradient && this.showHiHi) {
                const gradientLeftAngle = toRadians(this.getValuePosition(this.hi, true) - RAMP_OVERLAP);
                const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

                const gradientRightAngle = toRadians(this.getValuePosition(hiRight, true) + RAMP_OVERLAP);
                const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
                const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
                gradient.addColorStop(0, this.hiColor.toString());
                gradient.addColorStop(1, this.hihiColor.toString());
                const overlap = endAngle !== rightMostAngle ? RAMP_OVERLAP / 2 : 0;
                g.strokeEllipse({
                    cx,
                    cy,
                    rx: rx - this.rampWidth / 2,
                    ry: ry - this.rampWidth / 2,
                    lineWidth: this.rampWidth,
                    startAngle: toRadians(startAngle - RAMP_OVERLAP / 2),
                    endAngle: toRadians(endAngle + overlap),
                    gradient,
                });
            } else {
                g.strokeEllipse({
                    cx,
                    cy,
                    rx: rx - this.rampWidth / 2,
                    ry: ry - this.rampWidth / 2,
                    lineWidth: this.rampWidth,
                    startAngle: toRadians(startAngle),
                    endAngle: toRadians(endAngle),
                    color: this.hiColor,
                });
            }
        }

        // HIHI
        if (this.showHiHi) {
            startAngle = 360 - this.getValuePosition(this.hihi, true);
            endAngle = rightMostAngle;
            const overlap = this.gradient ? RAMP_OVERLAP / 2 : 0;
            g.strokeEllipse({
                cx,
                cy,
                rx: rx - this.rampWidth / 2,
                ry: ry - this.rampWidth / 2,
                lineWidth: this.rampWidth,
                startAngle: toRadians(startAngle - overlap),
                endAngle: toRadians(endAngle),
                color: this.hihiColor,
            });
        }
    }

    getRadius() {
        return this.radius;
    }

    getValuePosition(v: number, limit = false) {
        if (limit) {
            v = this.getValueInRange(v);
        }

        let valuePosition;
        if (this.logScale) {
            valuePosition = this.startAngle - ((Math.log10(v) - Math.log10(this.range.min))
                / (Math.log10(this.range.max) - Math.log10(this.range.min)) * this.lengthInDegrees);
        } else {
            valuePosition = this.startAngle - ((v - this.range.min) / (this.range.max - this.range.min) * this.lengthInDegrees);
        }

        if (valuePosition < 0) {
            valuePosition += 360;
        }

        return valuePosition;
    }

    getValueInRange(v: number) {
        if (this.range.min <= v && v <= this.range.max) {
            return v;
        } else {
            return v > this.range.max ? this.range.max : this.range.min;
        }
    }

    private getRenderedRange(): Range {
        const range = { min: this.minimum, max: this.maximum };
        if (this.logScale) {
            if (this.minimum <= 0) {
                range.min = 0.1;
            }
            if (range.max <= this.minimum) {
                range.max = range.min + 100;
            }
        }
        return range;
    }
}

interface Range {
    min: number;
    max: number;
}
