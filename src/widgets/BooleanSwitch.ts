import { Bounds } from '../Bounds';
import { Color } from '../Color';
import { Display } from '../Display';
import * as utils from '../utils';
import { Widget } from '../Widget';


export class BooleanSwitch extends Widget {

    private effect3d: boolean;
    private onColor: Color;
    private onLabel: string;
    private offColor: Color;
    private offLabel: string;

    private enabled = false;

    constructor(display: Display, node: Element) {
        super(display, node);
        this.effect3d = utils.parseBooleanChild(node, 'effect_3d');
        const onColorNode = utils.findChild(node, 'on_color');
        this.onColor = utils.parseColorChild(onColorNode);
        this.onLabel = utils.parseStringChild(node, 'on_label');
        const offColorNode = utils.findChild(node, 'off_color');
        this.offColor = utils.parseColorChild(offColorNode);
        this.offLabel = utils.parseStringChild(node, 'off_label');
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.width > this.height) {
            this.drawHorizontal(ctx);
        } else {
            this.drawVertical(ctx);
        }
    }

    private drawHorizontal(ctx: CanvasRenderingContext2D) {
        let areaWidth = this.width;
        let areaHeight = this.height;
        if (areaHeight > areaWidth / 2) {
            areaHeight = Math.floor(this.width / 2);
        } else {
            areaWidth = Math.floor(2 * this.height);
        }

        const pedBounds = {
            x: Math.floor((63.0 / 218.0) * areaWidth),
            y: 0,
            width: areaHeight / 2,
            height: areaHeight / 2,
        };
        this.drawPedestal(ctx, pedBounds);

        const largeWidth = Math.floor((35.0 / 218.0) * areaWidth);
        const largeHeight = Math.floor((45.0 / 105.0) * areaHeight);
        const smallWidth = Math.floor((43.0 / 218.0) * areaWidth);
        const smallHeight = Math.floor((35.0 / 105.0) * areaHeight);

        const smallMove = Math.floor((1.0 / 7.0) * pedBounds.width);

        if (this.enabled) {
            const onLargeBounds: Bounds = {
                x: 2 * pedBounds.x + pedBounds.width - largeWidth,
                y: pedBounds.height / 2 - largeHeight / 2,
                width: largeWidth,
                height: largeHeight
            };
            const onSmallBounds: Bounds = {
                x: pedBounds.x + pedBounds.width / 2 - smallWidth / 2 + smallMove,
                y: pedBounds.y + pedBounds.height / 2 - smallHeight / 2,
                width: smallWidth,
                height: smallHeight,
            };
            this.drawHorizontalBar(ctx, onSmallBounds, onLargeBounds, true);
        } else {
            const offLargeBounds: Bounds = {
                x: 0,
                y: pedBounds.height / 2 - largeHeight / 2,
                width: largeWidth,
                height: largeHeight,
            };
            const offSmallBounds: Bounds = {
                x: pedBounds.x + pedBounds.width / 2 - smallWidth / 2 - smallMove,
                y: pedBounds.y + pedBounds.height / 2 - smallHeight / 2,
                width: smallWidth,
                height: smallHeight,
            };
            this.drawHorizontalBar(ctx, offSmallBounds, offLargeBounds, false);
        }
    }

    private drawVertical(ctx: CanvasRenderingContext2D) {
        let areaWidth = this.width;
        let areaHeight = this.height;
        if (areaWidth > areaHeight / 2) {
            areaWidth = Math.floor(this.height / 2);
        } else {
            areaHeight = Math.floor(2 * this.width);
        }

        const pedBounds = {
            x: 0,
            y: Math.floor((63.0 / 218.0) * areaHeight),
            width: areaWidth / 2,
            height: areaWidth / 2,
        };
        this.drawPedestal(ctx, pedBounds);

        const largeWidth = Math.floor((45.0 / 105.0) * areaWidth);
        const largeHeight = Math.floor((35.0 / 218.0) * areaHeight);
        const smallWidth = Math.floor((35.0 / 105.0) * areaWidth);
        const smallHeight = Math.floor((43.0 / 218.0) * areaHeight);

        if (this.enabled) {
            const onLargeBounds: Bounds = {
                x: pedBounds.width / 2 - largeWidth / 2,
                y: 0,
                width: largeWidth,
                height: largeHeight
            };
            const onSmallBounds: Bounds = {
                x: pedBounds.x + pedBounds.width / 2 - smallWidth / 2,
                y: pedBounds.y + pedBounds.height / 2 - smallHeight / 2,
                width: smallWidth,
                height: smallHeight,
            };
            onSmallBounds.y -= Math.floor((1.0 / 7.0) * pedBounds.height);
            this.drawVerticalBar(ctx, onSmallBounds, onLargeBounds, true);
        } else {
            const barHeight = pedBounds.y + pedBounds.height / 2 + smallHeight / 2 + 2;
            const offLargeBounds: Bounds = {
                x: pedBounds.width / 2 - largeWidth / 2,
                y: pedBounds.y + pedBounds.height / 2 - smallHeight / 2 + barHeight - largeHeight,
                width: largeWidth,
                height: largeHeight,
            };
            const offSmallBounds: Bounds = {
                x: pedBounds.x + pedBounds.width / 2 - smallWidth / 2,
                y: pedBounds.y + pedBounds.height / 2 - smallHeight / 2,
                width: smallWidth,
                height: smallHeight,
            };
            offSmallBounds.y += Math.floor((1.0 / 7.0) * pedBounds.height);
            this.drawVerticalBar(ctx, offSmallBounds, offLargeBounds, false);
        }
    }

    private drawPedestal(ctx: CanvasRenderingContext2D, bounds: Bounds) {
        let cx = this.x + bounds.x + (bounds.width / 2);
        let cy = this.y + bounds.y + (bounds.height / 2);
        let rx = bounds.width / 2;
        let ry = bounds.height / 2;
        ctx.fillStyle = this.effect3d ? Color.WHITE.toString() : Color.GRAY.toString();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();

        if (this.effect3d) {
            const gradient = ctx.createLinearGradient(this.x + bounds.x, this.y + bounds.y,
                this.x + bounds.x + bounds.width, this.y + bounds.y + bounds.height);

            if (this.enabled) {
                gradient.addColorStop(0, `rgba(255,255,255,${10 / 255})`);
                gradient.addColorStop(1, `rgba(0,0,0,${100 / 255})`);
            } else {
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, `rgba(0,0,0,${150 / 255})`);
            }
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    private drawHorizontalBar(ctx: CanvasRenderingContext2D, sm: Bounds, lg: Bounds, booleanValue: boolean) {
        let stopOpacity1 = (booleanValue ? 0 : 10) / 255;
        let stopOpacity2 = (booleanValue ? 150 : 220) / 255;

        const gradient = ctx.createLinearGradient(this.x + lg.x, this.y + lg.y, this.x + lg.x, this.y + lg.y + lg.height);
        gradient.addColorStop(0, `rgba(0,0,0,${stopOpacity1})`);
        gradient.addColorStop(1, `rgba(0,0,0,${stopOpacity2})`);

        /*
         * Small end
         */
        let cx = this.x + sm.x + (sm.width / 2);
        let cy = this.y + sm.y + (sm.height / 2);
        let rx = sm.width / 2;
        let ry = sm.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);

        ctx.fillStyle = booleanValue ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        /*
         * Bar
         */
        ctx.beginPath();
        ctx.moveTo(Math.round(this.x + lg.x + lg.width / 2), Math.round(this.y + lg.y));
        ctx.lineTo(Math.round(this.x + lg.x + lg.width / 2), Math.round(this.y + lg.y + lg.height));
        ctx.lineTo(Math.round(this.x + sm.x + sm.width / 2), Math.round(this.y + sm.y + sm.height));
        ctx.lineTo(Math.round(this.x + sm.x + sm.width / 2), Math.round(this.y + sm.y));
        ctx.closePath();

        ctx.fillStyle = booleanValue ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        /*
         * Large end
         */
        cx = this.x + lg.x + (lg.width / 2);
        cy = this.y + lg.y + (lg.height / 2);
        rx = lg.width / 2;
        ry = lg.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);

        ctx.fillStyle = booleanValue ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            const w = Math.sqrt(rx * rx + ry * ry);
            const wp = ry - rx;
            const x1 = this.x + lg.x + rx + (wp - w) / 2 - 1;
            const y1 = this.x + lg.y + ry - (wp + w) / 2 - 1;
            const x2 = this.x + lg.x + rx + (wp + w) / 2 + 5;
            const y2 = this.x + lg.y + ry - (wp - w) / 2 + 5;
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(0,0,0,${stopOpacity1})`);
            gradient.addColorStop(1, `rgba(0,0,0,${stopOpacity2})`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    private drawVerticalBar(ctx: CanvasRenderingContext2D, sm: Bounds, lg: Bounds, booleanValue: boolean) {
        const gradient = ctx.createLinearGradient(this.x + lg.x, this.y + lg.y, this.x + lg.x + lg.width, this.y + lg.y);
        gradient.addColorStop(0, `rgba(0,0,0,${10 / 255})`);
        gradient.addColorStop(1, `rgba(0,0,0,${booleanValue ? 210 / 255 : 160 / 255})`);

        /*
         * Small end
         */
        let cx = this.x + sm.x + (sm.width / 2);
        let cy = this.y + sm.y + (sm.height / 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, sm.width / 2, sm.height / 2, 0, 0, 2 * Math.PI);

        ctx.fillStyle = (booleanValue) ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        /*
         * Bar
         */
        ctx.beginPath();
        ctx.moveTo(Math.round(this.x + lg.x), Math.round(this.y + lg.y + lg.height / 2));
        ctx.lineTo(Math.round(this.x + lg.x + lg.width), Math.round(this.y + lg.y + lg.height / 2));
        ctx.lineTo(Math.round(this.x + sm.x + sm.width), Math.round(this.y + sm.y + sm.height / 2));
        ctx.lineTo(Math.round(this.x + sm.x), Math.round(this.y + sm.y + sm.height / 2));
        ctx.closePath();

        ctx.fillStyle = (booleanValue) ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        /*
         * Large end
         */
        cx = this.x + lg.x + (lg.width / 2);
        cy = this.y + lg.y + (lg.height / 2);
        const rx = lg.width / 2;
        const ry = lg.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);

        ctx.fillStyle = (booleanValue) ? this.onColor.toString() : this.offColor.toString();
        ctx.fill();
        if (this.effect3d) {
            const gradient = ctx.createLinearGradient(this.x + lg.x, this.y + lg.y, this.x + lg.width, this.y + lg.height);
            gradient.addColorStop(0, `rgba(0,0,0,${(booleanValue ? 5 : 10) / 255})`);
            gradient.addColorStop(1, `rgba(0,0,0,${(booleanValue ? 180 : 160) / 255})`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
}
