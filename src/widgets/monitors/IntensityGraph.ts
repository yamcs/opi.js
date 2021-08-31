import { Color } from '../../Color';
import { ColorMap } from '../../ColorMap';
import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { ColorMapProperty, FloatProperty, IntProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_COLOR_MAP = 'color_map';
const PROP_DATA_HEIGHT = 'data_height';
const PROP_DATA_WIDTH = 'data_width';
const PROP_GRAPH_AREA_HEIGHT = 'graph_area_height';
const PROP_GRAPH_AREA_WIDTH = 'graph_area_width';
const PROP_MAXIMUM = 'maximum';
const PROP_MINIMUM = 'minimum';

export class IntensityGraph extends Widget {

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new ColorMapProperty(PROP_COLOR_MAP));
        this.properties.add(new IntProperty(PROP_DATA_HEIGHT));
        this.properties.add(new IntProperty(PROP_DATA_WIDTH));
        this.properties.add(new IntProperty(PROP_GRAPH_AREA_HEIGHT));
        this.properties.add(new IntProperty(PROP_GRAPH_AREA_WIDTH));
        this.properties.add(new FloatProperty(PROP_MAXIMUM));
        this.properties.add(new FloatProperty(PROP_MINIMUM));
    }

    draw(g: Graphics) {
        g.fillRect({
            ...this.area,
            color: Color.PINK,
        });

        if (this.value && this.value.length) {
            const { dataWidth, dataHeight, colorMap } = this;
            const { minimum: min, maximum: max } = this;
            const [mapMin, mapMax] = colorMap.getMinMax();

            const offscreen = document.createElement('canvas');
            offscreen.width = this.dataWidth;
            offscreen.height = this.dataHeight;
            const offscreenCtx = offscreen.getContext('2d')!;

            // Note: fillRect appears to be more efficient
            // than working with imageData.
            for (let x = 0; x < dataWidth; x++) {
                for (let y = 0; y < dataHeight; y++) {
                    let value = this.value[y * dataWidth + x];
                    if (colorMap.autoscale) {
                        const ratio = (value - min) / (max - min);
                        value = mapMin + (ratio * (mapMax - mapMin));
                    }
                    const [red, green, blue] = colorMap.lookup(value);
                    offscreenCtx.fillStyle = `rgb(${red},${green},${blue})`;
                    offscreenCtx.fillRect(x, y, 1, 1);
                }
            }

            g.ctx.drawImage(offscreen, this.x, this.y, this.graphAreaWidth, this.graphAreaHeight);
        }
    }

    get colorMap(): ColorMap { return this.properties.getValue(PROP_COLOR_MAP); }
    get dataHeight(): number { return this.properties.getValue(PROP_DATA_HEIGHT); }
    get dataWidth(): number { return this.properties.getValue(PROP_DATA_WIDTH); }
    get graphAreaHeight(): number {
        return this.scale * this.properties.getValue(PROP_GRAPH_AREA_HEIGHT);
    }
    get graphAreaWidth(): number {
        return this.scale * this.properties.getValue(PROP_GRAPH_AREA_WIDTH);
    }
    get maximum(): number { return this.properties.getValue(PROP_MAXIMUM); }
    get minimum(): number { return this.properties.getValue(PROP_MINIMUM); }
}
