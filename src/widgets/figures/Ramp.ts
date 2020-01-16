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
    lo = 25;
    loColor = Color.ORANGE;
    hi = 75;
    hiColor = Color.ORANGE;
    hihi = 90;
    hihiColor = Color.RED;

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

        // LOLO
        let startAngle;
        let endAngle;
        if (this.endAngle - this.startAngle > 0) { // Meter
            startAngle = this.startAngle - 90;
            endAngle = 360 - this.getValuePosition(this.lolo);
        } else { // Gauge
            startAngle = this.startAngle + 90;
            endAngle = 360 - this.getValuePosition(this.lolo);
        }
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

        // LO
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.lo);
        if (this.effect3d && this.gradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.lolo) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.lo) + RAMP_OVERLAP);
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

        const midNormal = (this.lo + this.hi) / 2;

        // NORMAL (left part)
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(midNormal);
        if (this.effect3d && this.gradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.lo) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(midNormal) + RAMP_OVERLAP);
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, this.loColor.toString());
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
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.hi);
        if (this.effect3d && this.gradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(midNormal) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.hi) + RAMP_OVERLAP);
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, Color.GREEN.toString());
            gradient.addColorStop(1, this.hiColor.toString());
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

        // HI
        startAngle = endAngle;
        endAngle = 360 - this.getValuePosition(this.hihi);
        if (this.effect3d && this.gradient) {
            const gradientLeftAngle = toRadians(this.getValuePosition(this.hi) - RAMP_OVERLAP);
            const gradientLeft = convertPolarToCartesian(area.width / 2, gradientLeftAngle, area);

            const gradientRightAngle = toRadians(this.getValuePosition(this.hihi) + RAMP_OVERLAP);
            const gradientRight = convertPolarToCartesian(area.width / 2, gradientRightAngle, area);
            const gradient = g.createLinearGradient(gradientLeft.x, gradientLeft.y, gradientRight.x, gradientRight.y);
            gradient.addColorStop(0, this.hiColor.toString());
            gradient.addColorStop(1, this.hihiColor.toString());
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
                color: this.hiColor,
            });
        }

        // HIHI
        startAngle = endAngle;
        endAngle = 360 - this.endAngle;
        g.strokeEllipse({
            cx,
            cy,
            rx: rx - this.rampWidth / 2,
            ry: ry - this.rampWidth / 2,
            lineWidth: this.rampWidth,
            startAngle: toRadians(startAngle),
            endAngle: toRadians(endAngle),
            color: this.hihiColor,
        });
    }

    getRadius() {
        return this.radius;
    }

    getValuePosition(v: number) {
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
