import { Color } from '../../../Color';
import { Display } from '../../../Display';
import { Font } from '../../../Font';
import { Graphics, Path } from '../../../Graphics';
import { Bounds, crispen, intersect, Point, shrink } from '../../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty, IntProperty, PVValueProperty, StringProperty } from '../../../properties';
import { Range } from '../../../Range';
import { Widget } from '../../../Widget';
import { AbstractContainerWidget } from '../../others/AbstractContainerWidget';
import { LinearScale } from '../LinearScale';
import { Axis } from './Axis';
import { PlotAreaRegion } from './PlotAreaRegion';
import { Trace } from './Trace';
import { XYGraphToolbar } from './XYGraphToolbar';

const PROP_AXIS_COUNT = 'axis_count';
const PROP_PLOT_AREA_BACKGROUND_COLOR = 'plot_area_background_color';
const PROP_SHOW_LEGEND = 'show_legend';
const PROP_SHOW_PLOT_AREA_BORDER = 'show_plot_area_border';
const PROP_SHOW_TOOLBAR = 'show_toolbar';
const PROP_TITLE = 'title';
const PROP_TITLE_FONT = 'title_font';
const PROP_TRACE_COUNT = 'trace_count';
const PROP_TRANSPARENT = 'transparent';


export class XYGraph extends Widget {

    toolbar?: XYGraphToolbar;
    private plotAreaRegion?: PlotAreaRegion;
    private axes: Axis[] = [];
    private traces: Trace[] = [];

    // Set to false, when the active tool changes
    // to one of the zoom types.
    autoScaleAllowed = true;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);

        this.properties.add(new IntProperty(PROP_AXIS_COUNT));
        this.properties.add(new ColorProperty(PROP_PLOT_AREA_BACKGROUND_COLOR));
        this.properties.add(new BooleanProperty(PROP_SHOW_LEGEND));
        this.properties.add(new BooleanProperty(PROP_SHOW_PLOT_AREA_BORDER));
        this.properties.add(new BooleanProperty(PROP_SHOW_TOOLBAR));
        this.properties.add(new StringProperty(PROP_TITLE));
        this.properties.add(new FontProperty(PROP_TITLE_FONT));
        this.properties.add(new IntProperty(PROP_TRACE_COUNT));
        this.properties.add(new BooleanProperty(PROP_TRANSPARENT));

        this.properties.addGenerator(() => {
            const moreProperties = [];

            this.axes = [];
            const axisCount = this.properties.getValue(PROP_AXIS_COUNT) as number;
            for (let i = 0; i < axisCount; i++) {
                this.axes.push(new Axis(this, i));
                moreProperties.push(...[
                    new BooleanProperty(`axis_${i}_auto_scale`),
                    new FloatProperty(`axis_${i}_auto_scale_treshold`),
                    new ColorProperty(`axis_${i}_axis_color`),
                    new StringProperty(`axis_${i}_axis_title`),
                    new BooleanProperty(`axis_${i}_dash_grid_line`),
                    new ColorProperty(`axis_${i}_grid_color`),
                    new BooleanProperty(`axis_${i}_log_scale`),
                    new FloatProperty(`axis_${i}_maximum`),
                    new FloatProperty(`axis_${i}_minimum`),
                    new FontProperty(`axis_${i}_scale_font`),
                    new StringProperty(`axis_${i}_scale_format`),
                    new BooleanProperty(`axis_${i}_show_grid`),
                    new IntProperty(`axis_${i}_time_format`),
                    new FontProperty(`axis_${i}_title_font`),
                    new BooleanProperty(`axis_${i}_visible`),
                ]);
                if (i > 1) { // 0 is primary X, 1 is primary Y
                    moreProperties.push(...[
                        new BooleanProperty(`axis_${i}_left_bottom_side`),
                        new BooleanProperty(`axis_${i}_y_axis`),
                    ]);
                }
            }

            this.traces = [];
            const traceCount = this.properties.getValue(PROP_TRACE_COUNT) as number;
            for (let i = 0; i < traceCount; i++) {
                this.traces.push(new Trace(this, i));
                moreProperties.push(...[
                    new BooleanProperty(`trace_${i}_anti_alias`),
                    new IntProperty(`trace_${i}_buffer_size`),
                    new BooleanProperty(`trace_${i}_concatenate_data`),
                    new IntProperty(`trace_${i}_line_width`),
                    new StringProperty(`trace_${i}_name`),
                    new IntProperty(`trace_${i}_plot_mode`),
                    new IntProperty(`trace_${i}_point_size`),
                    new IntProperty(`trace_${i}_point_style`),
                    new ColorProperty(`trace_${i}_trace_color`),
                    new IntProperty(`trace_${i}_trace_type`),
                    new IntProperty(`trace_${i}_update_delay`),
                    new IntProperty(`trace_${i}_update_mode`),
                    new BooleanProperty(`trace_${i}_visible`),
                    new IntProperty(`trace_${i}_x_axis_index`),
                    new StringProperty(`trace_${i}_x_pv`),
                    new PVValueProperty(`trace_${i}_x_pv_value`, `trace_${i}_x_pv`),
                    new IntProperty(`trace_${i}_y_axis_index`),
                    new StringProperty(`trace_${i}_y_pv`),
                    new PVValueProperty(`trace_${i}_y_pv_value`, `trace_${i}_y_pv`),
                ]);
            }

            return moreProperties;
        });
    }

    init() {
        this.plotAreaRegion = new PlotAreaRegion(`${this.wuid}-plotarea`, this);
        this.traces.forEach(trace => trace.init());
    }

    draw(g: Graphics) {
        const { scale } = this;
        let area = this.area;
        if (this.borderAlarmSensitive) {
            area = shrink(this.area, 2 * scale);
        }

        if (!this.transparent) {
            const backgroundColor = this.alarmSensitiveBackgroundColor;
            g.fillRect({ ...area, color: backgroundColor });
        }

        if (this.showToolbar) {
            this.drawToolbar(g, area);
        }

        if (this.title) {
            this.drawTitle(g, area);
        }

        // Initialize rulers
        for (const axis of this.axes) {
            if (axis.autoScale && this.autoScaleAllowed) {
                const range = this.calculateAutoscaledRange(axis);
                if (range) {
                    axis.effectiveMinimum = range.start;
                    axis.effectiveMaximum = range.stop;
                }
            }
            const min = axis.effectiveMinimum;
            const max = axis.effectiveMaximum;
            axis.linearScale = new LinearScale(scale, axis.scaleFont, min,
                max, axis.logScale, 50 * scale, axis.axisColor, true, axis.visible);
            axis.linearScale.scaleFormat = axis.scaleFormat;
            axis.linearScale.timeFormat = axis.timeFormat;
        }

        if (this.showLegend) {
            this.drawLegend(g, area);
        }

        g.addHitRegion(this.plotAreaRegion!).addRect(area.x, area.y, area.width, area.height);

        const plotArea = this.drawAxes(g, area);
        this.drawPlotArea(g, plotArea);

        const selection = this.plotAreaRegion?.selection;
        if (selection) {
            this.drawZoomSelection(g, plotArea, intersect(plotArea, selection));
        }
    }

    private drawToolbar(g: Graphics, area: Bounds) {
        if (!this.toolbar) {
            this.toolbar = new XYGraphToolbar(this);
        }
        const toolbarMargin = 3 * this.scale;
        const toolbarArea = shrink(area, toolbarMargin);
        const toolbarHeight = this.toolbar.draw(g, toolbarArea);
        area.y += toolbarMargin + toolbarHeight + toolbarMargin;
        area.height -= toolbarMargin + toolbarHeight + toolbarMargin;
    }

    private drawTitle(g: Graphics, area: Bounds) {
        const titleHeight = g.measureText(this.title, this.titleFont).height;
        g.fillText({
            x: area.x + area.width / 2,
            y: area.y + titleHeight / 2,
            align: 'center',
            baseline: 'middle',
            color: this.alarmSensitiveForegroundColor,
            font: this.titleFont,
            text: this.title,
        });
        const gap = 2 * this.scale;
        area.y += titleHeight + gap;
        area.height -= titleHeight + gap;
    }

    private drawAxes(g: Graphics, area: Bounds) {
        const { scale } = this;
        const gap = 5 * scale;
        const plotArea = { ...area };

        // Measure (don't draw) space required for X axes.
        let combinedXTitleHeight = 0;
        let combinedXScaleHeight = 0;
        for (const axis of this.getXAxes()) {
            if (axis.visible) {
                let titleHeight = 0;
                if (axis.axisTitle) {
                    titleHeight = gap + g.measureText(axis.axisTitle, axis.titleFont).height;
                }
                combinedXTitleHeight += titleHeight;
                combinedXScaleHeight += titleHeight + axis.linearScale!.measureHorizontalHeight(g);
            }
        }

        let combinedYScaleWidth = 0;
        let topMargin = 0;
        // Iterate Y axis in reverse order (drawn left to right)
        for (const axis of this.getYAxes().reverse()) {
            const linearScale = axis.linearScale!;
            if (axis.visible) {
                const yScaleMargin = linearScale.calculateMargin(g, false);
                const height = plotArea.height
                    - combinedXScaleHeight
                    + (combinedXScaleHeight > 0 ? yScaleMargin : 0);


                let titleHeight = 0;
                if (axis.axisTitle) {
                    titleHeight = g.measureText(axis.axisTitle, axis.titleFont).height;
                    g.ctx.save();
                    g.ctx.translate(plotArea.x + gap + (titleHeight / 2), area.y + (height / 2));
                    g.ctx.rotate(-Math.PI / 2);
                    g.fillText({
                        x: 0,
                        y: 0,
                        align: 'center',
                        baseline: 'middle',
                        font: axis.titleFont,
                        color: axis.axisColor,
                        text: axis.axisTitle,
                    });
                    g.ctx.restore();
                    titleHeight += gap;
                }

                const scaleWidth = titleHeight + linearScale.drawVertical(
                    g, plotArea.x + titleHeight, area.y, height, true, false);
                plotArea.x += scaleWidth;
                plotArea.width -= scaleWidth;
                combinedYScaleWidth += scaleWidth;

                const axisMargin = linearScale.margin;
                topMargin = (topMargin === 0) ? axisMargin : Math.min(topMargin, axisMargin);

                const lineWidth = scale * 1;
                const verticalLineX = Math.round(plotArea.x) - (lineWidth / 2);
                const verticalLineY = Math.round(area.y + yScaleMargin) - (lineWidth / 2);
                g.strokePath({
                    path: new Path(verticalLineX, verticalLineY)
                        .lineTo(verticalLineX, verticalLineY + height - (2 * yScaleMargin)),
                    color: axis.axisColor,
                    opacity: 100 / 255,
                    lineWidth,
                });
            } else {
                const length = plotArea.height - combinedXScaleHeight;
                linearScale.setDimensions(0, area.y, length, false);
            }
        }

        // X Axis (drawn bottom-up)
        let leftMargin = 0;
        for (const axis of this.getXAxes().reverse()) {
            const linearScale = axis.linearScale!;
            if (axis.visible) {
                const xScaleMargin = linearScale.calculateMargin(g, true);
                const xOffset = combinedYScaleWidth - xScaleMargin;

                let titleHeight = 0;
                if (axis.axisTitle) {
                    titleHeight = g.measureText(axis.axisTitle, axis.titleFont).height;
                    const textX = area.x + combinedYScaleWidth + (area.width - combinedYScaleWidth) / 2;
                    g.fillText({
                        x: textX,
                        y: plotArea.y + plotArea.height - (titleHeight / 2),
                        align: 'center',
                        baseline: 'middle',
                        font: axis.titleFont,
                        color: axis.axisColor,
                        text: axis.axisTitle,
                    });
                    titleHeight += gap;
                }

                const scaleHeight = titleHeight + linearScale.drawHorizontal(
                    g, area.x + xOffset, plotArea.y + plotArea.height - titleHeight, area.width - xOffset);
                plotArea.height -= scaleHeight;

                const axisMargin = linearScale.margin;
                leftMargin = (leftMargin === 0) ? axisMargin : Math.min(leftMargin, axisMargin);

                const lineWidth = scale * 1;
                const horizontalLineX = Math.round(
                    area.x + xOffset + xScaleMargin) - (lineWidth / 2);
                const horizontalLineY = Math.round(
                    plotArea.y + plotArea.height) - (lineWidth / 2);
                g.strokePath({
                    path: new Path(horizontalLineX, horizontalLineY)
                        .lineTo(horizontalLineX + plotArea.width - xScaleMargin, horizontalLineY),
                    color: axis.axisColor,
                    opacity: 100 / 255,
                    lineWidth,
                });
            } else {
                const x = area.x + combinedYScaleWidth;
                const width = area.width - combinedYScaleWidth;
                linearScale.setDimensions(x, 0, width, true);
            }
        }

        plotArea.y += topMargin;
        plotArea.width -= leftMargin;
        if (combinedXScaleHeight > 0) {
            plotArea.height -= topMargin; // Only once: margins shared between y and x are collapsed
        } else {
            plotArea.height -= (2 * topMargin);
        }
        return plotArea;
    }

    private drawPlotArea(g: Graphics, area: Bounds) {
        const { scale } = this;
        const lineWidth = 1 * scale;

        g.fillRect({ ...area, color: this.plotAreaBackgroundColor });
        if (this.showPlotAreaBorder) {
            const { x, y, width, height } = shrink(area, lineWidth / 2);
            g.strokePath({
                path: new Path(x, y).lineTo(x + width, y).lineTo(x + width, y + height),
                color: Color.BLACK,
                lineWidth,
            });
        }

        for (const axis of this.axes.filter(a => a.visible && a.showGrid)) {
            const linearScale = axis.linearScale!;
            if (axis.isHorizontal()) { // X Axis
                for (const x of linearScale.getGridPositions()) {
                    const pathX = Math.round(linearScale.getX() + x) - (lineWidth / 2);
                    g.strokePath({
                        path: new Path(pathX, area.y).lineTo(pathX, area.y + area.height),
                        color: axis.gridColor,
                        lineWidth,
                        dash: axis.dashGridLine ? [6 * scale, 2 * scale] : undefined,
                    });
                }
            } else { // Y Axis
                for (const y of linearScale.getGridPositions()) {
                    const pathY = Math.round(linearScale.getY() + y) - (lineWidth / 2);
                    g.strokePath({
                        path: new Path(area.x, pathY).lineTo(area.x + area.width, pathY),
                        color: axis.gridColor,
                        lineWidth,
                        dash: axis.dashGridLine ? [6 * scale, 2 * scale] : undefined,
                    });
                }
            }
        }

        // Create a clip
        g.ctx.save();
        g.ctx.beginPath();
        g.ctx.rect(area.x, area.y, area.width, area.height);
        g.ctx.clip();
        for (const trace of this.traces.filter(t => t.visible)) {
            const xAxis = this.getAxis(trace.xAxisIndex).linearScale!;
            const yAxis = this.getAxis(trace.yAxisIndex).linearScale!;
            const points: Point[] = [];
            for (const sample of trace.snapshot()) {
                const x = xAxis.getValuePosition(sample.x);
                const y = yAxis.getValuePosition(sample.y);
                points.push({ x, y });
            }
            if (points.length) {
                trace.drawTrace(g, points);
                for (const point of points) {
                    trace.drawPoint(g, point);
                }
            }
        }
        g.ctx.restore(); // Reset clip
    }

    private drawZoomSelection(g: Graphics, plotArea: Bounds, selection: Bounds) {
        const { scale } = this;
        switch (this.toolbar?.currentTool) {
            case 'rubberband-zoom':
                g.strokeRect({
                    ...selection,
                    color: Color.BLACK,
                    lineWidth: 1 * scale,
                });
                break;
            case 'horizontal-zoom':
                const hZoom = selection;
                hZoom.y = plotArea.y;
                hZoom.height = plotArea.height;
                g.strokeRect({
                    ...crispen(hZoom),
                    color: Color.BLACK,
                    lineWidth: 1 * scale,
                });
                break;
            case 'vertical-zoom':
                const vZoom = selection;
                vZoom.x = plotArea.x;
                vZoom.width = plotArea.width;
                g.strokeRect({
                    ...crispen(vZoom),
                    color: Color.BLACK,
                    lineWidth: 1 * scale,
                });
                break;
        }
    }

    private drawLegend(g: Graphics, area: Bounds) {
        const { scale } = this;
        const iconSize = 25 * scale;
        const innerGap = 2 * scale;
        const outGap = 5 * scale;
        const font = Font.ARIAL_10.scale(scale);
        for (const axis of this.getYAxes()) {
            const traces = this.traces.filter(t => t.visible && t.yAxisIndex === axis.index);
            const lines: Trace[][] = [];

            // Wrap legend symbols over the available area
            let currentLine: Trace[] = [];
            let lineWidth = 0;
            let legendWidth = 0;
            for (const trace of traces) {
                let legendWidth = iconSize + innerGap + outGap;
                if (trace.name) {
                    legendWidth += g.measureText(trace.name, font).width;
                }
                if (lineWidth + legendWidth < area.width) {
                    currentLine.push(trace);
                    lineWidth += legendWidth;
                } else {
                    lines.push(currentLine);
                    legendWidth = Math.max(legendWidth, lineWidth);
                    currentLine = [trace];
                    lineWidth = legendWidth;
                }
            }
            if (currentLine.length) {
                lines.push(currentLine);
                legendWidth = Math.max(legendWidth, lineWidth);
            }
            if (!lines.length) {
                continue;
            }

            const legendHeight = iconSize * lines.length;
            const legendArea: Bounds = {
                x: Math.round(area.x + (area.width - legendWidth) / 2),
                y: Math.round(area.y + area.height - legendHeight),
                width: legendWidth,
                height: legendHeight,
            };
            area.height -= legendArea.height;
            g.fillRect({
                ...legendArea,
                color: this.plotAreaBackgroundColor,
            });
            g.strokeRect({
                ...shrink(legendArea, 1 * scale / 2),
                color: axis.axisColor,
            });

            let x = legendArea.x;
            let y = legendArea.y;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const topY = y + (i * iconSize);
                const midY = topY + iconSize / 2;
                for (const trace of line) {
                    const maxSize = (trace.pointSize > Math.floor((iconSize - outGap) / 2))
                        ? Math.floor(iconSize - outGap) : trace.pointSize;
                    switch (trace.traceType) {
                        case 3: // Bar
                            const barX = x + iconSize / 2;
                            g.strokePath({
                                path: new Path(barX, topY + maxSize).lineTo(barX, topY + iconSize),
                                lineWidth: trace.lineWidth,
                                color: trace.traceColor,
                                opacity: 100 / 255,
                            });
                            trace.drawPoint(g, { x: barX, y: topY + maxSize });
                            break;
                        case 4: // Area
                        case 5: // Line Area
                            const points = [
                                { x, y: topY + iconSize / 2 },
                                { x: x + iconSize / 2, y: topY + maxSize },
                                { x: x + iconSize, y: topY + iconSize / 2 },
                                { x: x + iconSize, y: topY + iconSize },
                                { x, y: topY + iconSize },
                            ];
                            g.fillPath({
                                path: Path.fromPoints(points),
                                color: trace.traceColor,
                                opacity: 100 / 255,
                            });
                            if (trace.traceType === 5) {
                                g.strokePath({
                                    path: Path.fromPoints(points.slice(0, 3)),
                                    color: trace.traceColor,
                                    lineWidth: 1 * scale,
                                });
                            }
                            trace.drawPoint(g, { x: x + iconSize / 2, y: topY + maxSize });
                            break;
                        default:
                            trace.drawTrace(g, [{ x, y: midY, }, { x: x + iconSize, y: midY }])
                            trace.drawPoint(g, { x: x + iconSize / 2, y: midY });
                    }
                    x += iconSize + innerGap;
                    if (trace.name) {
                        g.fillText({
                            x,
                            y: midY,
                            align: 'left',
                            baseline: 'middle',
                            color: trace.traceColor,
                            font,
                            text: trace.name,
                        });
                        x += g.measureText(trace.name, font).width;
                    }
                    x += outGap;
                }
            }
        }
    }

    public setCursor(cursor: string | undefined) {
        this.plotAreaRegion!.cursor = cursor;
    }

    calculateAutoscaledRange(axis: Axis): Range | undefined {
        let start: number | undefined;
        let stop: number | undefined;
        const logScale = axis.logScale;
        for (const trace of this.traces) {
            if (!trace.visible) {
                continue;
            }
            if (this.axes[trace.xAxisIndex] !== axis && this.axes[trace.yAxisIndex] !== axis) {
                continue;
            }

            for (const sample of trace.snapshot()) {
                const value = axis.isHorizontal() ? sample.x : sample.y;
                if (start === undefined || start > value) {
                    if (!logScale || value > 0) {
                        start = value;
                    }
                }
                if (stop === undefined || stop < value) {
                    if (!logScale || value > 0) {
                        stop = value;
                    }
                }
            }
        }
        if (start !== undefined && stop !== undefined) {
            return { start, stop };
        }
    }

    performAutoScale() {
        for (const axis of this.axes) {
            if (axis.visible) {
                axis.performAutoScale();
            }
        }
    }

    clearGraph() {
        for (const trace of this.traces) {
            trace.clearData();
        }
        this.requestRepaint();
    }

    getAxes() {
        return [...this.axes];
    }

    getXAxes() {
        return this.axes.filter(axis => axis.isHorizontal());
    }

    getYAxes() {
        return this.axes.filter(axis => axis.isVertical());
    }

    getAxis(index: number) {
        return this.axes[index];
    }

    getTrace(index: number) {
        return this.traces[index];
    }

    get axisCount(): number { return this.properties.getValue(PROP_AXIS_COUNT); }
    get plotAreaBackgroundColor(): Color { return this.properties.getValue(PROP_PLOT_AREA_BACKGROUND_COLOR); }
    get showLegend(): boolean { return this.properties.getValue(PROP_SHOW_LEGEND); }
    get showPlotAreaBorder(): boolean { return this.properties.getValue(PROP_SHOW_PLOT_AREA_BORDER); }
    get showToolbar(): boolean { return this.properties.getValue(PROP_SHOW_TOOLBAR); }
    get title(): string { return this.properties.getValue(PROP_TITLE); }
    get titleFont(): Font { return this.properties.getValue(PROP_TITLE_FONT).scale(this.scale); }
    get traceCount(): number { return this.properties.getValue(PROP_TRACE_COUNT); }
    get transparent(): boolean { return this.properties.getValue(PROP_TRANSPARENT); }
}
