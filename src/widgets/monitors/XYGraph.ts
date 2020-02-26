import Dygraph from 'dygraphs';
import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { Bounds, crispen, shrink } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { PV } from '../../pv/PV';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';
import { SampleBuffer } from './SampleBuffer';
import { generateCSS } from './XYGraphCSS';

const PROP_AXIS_COUNT = 'axis_count';
const PROP_PLOT_AREA_BACKGROUND_COLOR = 'plot_area_background_color';
const PROP_SHOW_PLOT_AREA_BORDER = 'show_plot_area_border';
const PROP_TITLE = 'title';
const PROP_TITLE_FONT = 'title_font';
const PROP_TRACE_COUNT = 'trace_count';

interface AxisData {
    axisTitle: string;
    axisColor: Color;
    gridColor: Color;
    minimum: number;
    maximum: number;
    logScale: boolean;
    autoScale: boolean;
    timeFormat: number;
    dashGridLine: boolean;
    scaleFont: Font;
    titleFont: Font;
}

interface TraceData {
    yPVName: string;
    yPV: PV;
    bufferSize: number;
    traceColor: Color;
    buffer: SampleBuffer;
    pointSize: number;
    pointStyle: number;
}

let ID_COUNTER = 0;

export class XYGraph extends Widget {

    private containerEl: HTMLDivElement;
    private containerId: string;
    private styleEl: HTMLStyleElement;
    private graphEl: HTMLDivElement;

    private axisDataSet: AxisData[] = [];
    private traceDataSet: TraceData[] = [];

    private initialized = false;

    private graph?: Dygraph;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_AXIS_COUNT));
        this.properties.add(new ColorProperty(PROP_PLOT_AREA_BACKGROUND_COLOR));
        this.properties.add(new BooleanProperty(PROP_SHOW_PLOT_AREA_BORDER));
        this.properties.add(new StringProperty(PROP_TITLE));
        this.properties.add(new FontProperty(PROP_TITLE_FONT));
        this.properties.add(new IntProperty(PROP_TRACE_COUNT));

        this.containerId = 'xygraph' + ID_COUNTER++;

        // First wrapper positions within the display
        this.containerEl = document.createElement('div');
        this.containerEl.id = this.containerId;
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.lineHeight = 'normal';

        // Second wrapper because Dygraphs will modify its style attributes
        this.graphEl = document.createElement('div');
        this.graphEl.style.backgroundColor = this.backgroundColor.toString();
        this.containerEl.appendChild(this.graphEl);

        // Some Dygraphs do not have a programmatic option. Use CSS instead
        this.styleEl = document.createElement('style');
        this.containerEl.appendChild(this.styleEl);

        this.display.rootPanel.appendChild(this.containerEl);
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);
        for (let i = 0; i < this.axisCount; i++) {
            const axisColorProperty = new ColorProperty(`axis_${i}_axis_color`);
            axisColorProperty.value = node.getColor(`axis_${i}_axis_color`);
            this.properties.add(axisColorProperty);

            const gridColorProperty = new ColorProperty(`axis_${i}_grid_color`);
            gridColorProperty.value = node.getColor(`axis_${i}_grid_color`);
            this.properties.add(gridColorProperty);

            const axisTitleProperty = new StringProperty(`axis_${i}_axis_title`);
            axisTitleProperty.value = node.getString(`axis_${i}_axis_title`);
            this.properties.add(axisTitleProperty);

            const scaleFontProperty = new FontProperty(`axis_${i}_scale_font`);
            scaleFontProperty.value = node.getFont(`axis_${i}_scale_font`);
            this.properties.add(scaleFontProperty);

            const titleFontProperty = new FontProperty(`axis_${i}_title_font`);
            titleFontProperty.value = node.getFont(`axis_${i}_title_font`);
            this.properties.add(titleFontProperty);

            const minimumProperty = new FloatProperty(`axis_${i}_minimum`);
            minimumProperty.value = node.getFloat(`axis_${i}_minimum`);
            this.properties.add(minimumProperty);

            const maximumProperty = new FloatProperty(`axis_${i}_maximum`);
            maximumProperty.value = node.getFloat(`axis_${i}_maximum`);
            this.properties.add(maximumProperty);

            const logScaleProperty = new BooleanProperty(`axis_${i}_log_scale`);
            logScaleProperty.value = node.getBoolean(`axis_${i}_log_scale`);
            this.properties.add(logScaleProperty);

            const autoScaleProperty = new BooleanProperty(`axis_${i}_auto_scale`);
            autoScaleProperty.value = node.getBoolean(`axis_${i}_auto_scale`);
            this.properties.add(autoScaleProperty);

            const timeFormatProperty = new IntProperty(`axis_${i}_time_format`);
            timeFormatProperty.value = node.getInt(`axis_${i}_time_format`);
            this.properties.add(timeFormatProperty);

            const dashGridLineProperty = new BooleanProperty(`axis_${i}_dash_grid_line`);
            dashGridLineProperty.value = node.getBoolean(`axis_${i}_dash_grid_line`);
            this.properties.add(dashGridLineProperty);

            this.axisDataSet.push({
                axisTitle: axisTitleProperty.value,
                axisColor: axisColorProperty.value,
                gridColor: gridColorProperty.value,
                minimum: minimumProperty.value,
                maximum: maximumProperty.value,
                logScale: logScaleProperty.value,
                autoScale: autoScaleProperty.value,
                timeFormat: timeFormatProperty.value,
                dashGridLine: dashGridLineProperty.value,
                scaleFont: scaleFontProperty.value,
                titleFont: titleFontProperty.value,
            });
        }
        for (let i = 0; i < this.traceCount; i++) {
            const traceColorProperty = new ColorProperty(`trace_${i}_trace_color`);
            traceColorProperty.value = node.getColor(`trace_${i}_trace_color`);
            this.properties.add(traceColorProperty);

            const bufferSizeProperty = new IntProperty(`trace_${i}_buffer_size`);
            bufferSizeProperty.value = node.getInt(`trace_${i}_buffer_size`);
            this.properties.add(bufferSizeProperty);

            const yPVProperty = new StringProperty(`trace_${i}_y_pv`);
            yPVProperty.value = node.getString(`trace_${i}_y_pv`);
            this.properties.add(yPVProperty);

            const pointSizeProperty = new IntProperty(`trace_${i}_point_size`);
            pointSizeProperty.value = node.getInt(`trace_${i}_point_size`);
            this.properties.add(pointSizeProperty);

            const pointStyleProperty = new IntProperty(`trace_${i}_point_style`);
            pointStyleProperty.value = node.getInt(`trace_${i}_point_style`);
            this.properties.add(pointStyleProperty);

            const pvName = this.expandMacro(yPVProperty.value);
            const pv = this.display.pvEngine.getPV(pvName);
            if (pv) {
                const buffer = new SampleBuffer(bufferSizeProperty.value);
                this.traceDataSet.push({
                    traceColor: traceColorProperty.value,
                    bufferSize: bufferSizeProperty.value,
                    pointSize: pointSizeProperty.value,
                    pointStyle: pointStyleProperty.value,
                    yPVName: pvName,
                    yPV: pv,
                    buffer,
                });
                pv.addListener(() => {
                    buffer.push([pv.time || new Date(), pv.value]);
                    this.updateGraph();
                });
            }
        }
    }

    private updateGraph() {
        if (!this.graph) {
            return;
        }

        const trace = this.traceDataSet[0];
        const samples = trace.buffer.snapshot();
        this.graph.updateOptions({
            file: samples.length ? samples : 'X\n',
        });
    }

    draw(g: Graphics) {
        if (!this.transparent) {
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }
        if (!this.initialized) {
            const area = crispen(shrink(this.absoluteArea, 2)); // Make room for alarm border
            this.containerEl.style.left = `${area.x}px`;
            this.containerEl.style.top = `${area.y}px`;
            this.containerEl.style.width = `${area.width}px`;
            this.containerEl.style.height = `${area.height}px`;
            this.initializeDygraphs(area);
            this.initialized = true;
        }
    }

    // We can only initialize when we know the target width/height
    private initializeDygraphs(area: Bounds) {
        /*
         * X-AXIS (DOMAIN)
         */
        const xAxis = this.axisDataSet[0];
        const xAxisOptions: { [key: string]: any; } = {
            axisLineColor: xAxis.axisColor,
            gridLineColor: xAxis.gridColor,
            axisLabelWidth: 70,
            drawGrid: true,
            logscale: xAxis.logScale,
        };
        if (xAxis.dashGridLine) {
            xAxisOptions.gridLinePattern = [1, 5];
        }

        /*
         * Y-AXIS (RANGE)
         */
        const yAxis = this.axisDataSet[1];
        const trace0 = this.traceDataSet[0];

        const series: { [key: string]: any; } = {};
        series[yAxis.axisTitle] = {
            drawPoints: true,
            strokeWidth: 1,
            pointSize: trace0.pointSize,
            color: trace0.traceColor.toString(),
        };

        const extraLabels: string[] = [];
        // TODO (from trace)

        const yAxisOptions: { [key: string]: any; } = {
            axisLineColor: yAxis.axisColor,
            gridLineColor: yAxis.gridColor,
            axisLabelFontSize: yAxis.scaleFont.height,
            yLabelHeight: yAxis.titleFont.height,
            // pixelsPerLabel: 12,
            valueRange: yAxis.autoScale ? [null, null] : [yAxis.minimum, yAxis.maximum],
            drawGrid: true,
            logscale: yAxis.logScale,
        };
        if (yAxis.dashGridLine) {
            yAxisOptions.gridLinePattern = [1, 5];
        }

        this.graph = new Dygraph(this.graphEl, 'X\n', {
            title: this.title,
            titleHeight: this.title ? this.titleFont.height : 0,
            fillGraph: false,
            interactionModel: {},
            width: area.width,
            height: area.height,
            xlabel: xAxis.axisTitle,
            ylabel: yAxis.axisTitle,
            xLabelHeight: xAxis.titleFont.height,
            yLabelWidth: yAxis.titleFont.height,
            labels: [xAxis.axisTitle, yAxis.axisTitle, ...extraLabels],
            series,
            labelsUTC: true,
            axes: {
                x: xAxisOptions,
                y: yAxisOptions,
            },
            underlayCallback: (ctx: CanvasRenderingContext2D, area: any, g: any) => {
                ctx.globalAlpha = 1;

                // Colorize plot area
                ctx.fillStyle = this.plotAreaBackgroundColor.toString();
                ctx.fillRect(area.x, area.y, area.w, area.h);

                if (this.showPlotAreaBorder) {
                    // Add plot area contours
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#000';

                    // Plot Area Top
                    ctx.beginPath();
                    ctx.moveTo(area.x, area.y);
                    ctx.lineTo(area.x + area.w, area.y);
                    ctx.stroke();

                    // Plot Area Right
                    ctx.beginPath();
                    ctx.moveTo(area.x + area.w, area.y);
                    ctx.lineTo(area.x + area.w, area.y + area.h);
                    ctx.stroke();
                }
            },
            drawPointCallback: (g: Dygraph, seriesName: string, ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, pointSize: number) => {
                const style = trace0.pointStyle;
                this.drawPoint(ctx, cx, cy, pointSize / 2, color, style);
            }
        });

        this.styleEl.innerHTML = generateCSS({
            id: this.containerId,
            titleColor: this.foregroundColor.toString(),
            titleFont: this.titleFont.getFontString(),
            xScaleFont: xAxis.scaleFont.getFontString(),
            xAxisColor: xAxis.axisColor.toString(),
            xLabelFont: xAxis.titleFont.getFontString(),
            xLabelColor: xAxis.axisColor.toString(),
            yScaleFont: yAxis.scaleFont.getFontString(),
            yAxisColor: yAxis.axisColor.toString(),
            yLabelFont: yAxis.titleFont.getFontString(),
            yLabelColor: yAxis.axisColor.toString(),
        });
    }

    private drawPoint(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, style: number) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        switch (style) {
            case 1: // Point
                ctx.beginPath();
                ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case 2: // Circle
                ctx.beginPath();
                ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 3: // Filled circle (same as point?)
                ctx.beginPath();
                ctx.ellipse(cx, cy, r, r, 0, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case 4: // Triangle
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - r, cy + r);
                ctx.lineTo(cx, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.closePath();
                ctx.stroke();
                break;
            case 5: // Filled triangle
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - r, cy + r);
                ctx.lineTo(cx, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.closePath();
                ctx.fill();
                break;
            case 6: // Square
                ctx.strokeRect(cx - r, cy - r, 2 * r, 2 * r);
                break;
            case 7: // Filled square
                ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                break;
            case 8: // Diamond
                ctx.beginPath();
                ctx.moveTo(cx - r, cy);
                ctx.lineTo(cx, cy - r);
                ctx.lineTo(cx + r, cy);
                ctx.lineTo(cx, cy + r);
                ctx.closePath();
                ctx.stroke();
                break;
            case 9: // Filled Diamond
                ctx.beginPath();
                ctx.moveTo(cx - r, cy);
                ctx.lineTo(cx, cy - r);
                ctx.lineTo(cx + r, cy);
                ctx.lineTo(cx, cy + r);
                ctx.closePath();
                ctx.stroke();
                break;
            case 10: // Cross (X)
                ctx.beginPath();
                ctx.moveTo(cx - r, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.moveTo(cx + r, cy - r);
                ctx.lineTo(cx - r, cy + r);
                ctx.stroke();
                break;
            case 11: // Cross (+)
                ctx.beginPath();
                ctx.moveTo(cx - r, cy);
                ctx.lineTo(cx + r, cy);
                ctx.moveTo(cx, cy - r);
                ctx.lineTo(cx, cy + r);
                ctx.stroke();
                break;
            case 12: // Bar
                ctx.beginPath();
                ctx.moveTo(cx, cy - r);
                ctx.lineTo(cx, cy + r);
                ctx.stroke();
        }
    }

    get axisCount(): number { return this.properties.getValue(PROP_AXIS_COUNT); }
    get title(): string { return this.properties.getValue(PROP_TITLE); }
    get titleFont(): Font { return this.properties.getValue(PROP_TITLE_FONT); }
    get traceCount(): number { return this.properties.getValue(PROP_TRACE_COUNT); }
    get plotAreaBackgroundColor(): Color {
        return this.properties.getValue(PROP_PLOT_AREA_BACKGROUND_COLOR);
    }
    get showPlotAreaBorder(): boolean {
        return this.properties.getValue(PROP_SHOW_PLOT_AREA_BORDER);
    }
}
