import { Color } from '../../Color';
import { Display } from '../../Display';
import { OpenPVEvent } from '../../events';
import { Font } from '../../Font';
import { Graphics, Path } from '../../Graphics';
import { HitRegionSpecification } from '../../HitCanvas';
import { Bounds, shrink, toBorderBox } from '../../positioning';
import { BooleanProperty, ColorProperty, FloatProperty, FontProperty, IntProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

interface State {
    label: string;
    color: Color;
    value?: number;
}

const PROP_BIT = 'bit';
const PROP_DATA_TYPE = 'data_type';
const PROP_EFFECT_3D = 'effect_3d';
const PROP_STATE_COUNT = 'state_count';
const PROP_SQUARE_LED = 'square_led';
const PROP_OFF_COLOR = 'off_color';
const PROP_OFF_LABEL = 'off_label';
const PROP_FONT = 'font';
const PROP_ON_COLOR = 'on_color';
const PROP_ON_LABEL = 'on_label';
const PROP_BULB_BORDER = 'bulb_border';
const PROP_BULB_BORDER_COLOR = 'bulb_border_color';
const PROP_STATE_COLOR_FALLBACK = 'state_color_fallback';
const PROP_STATE_LABEL_FALLBACK = 'state_label_fallback';
const PROP_SHOW_BOOLEAN_LABEL = 'show_boolean_label';

export class LED extends Widget {

    private areaRegion?: HitRegionSpecification;
    private states: State[] = [];

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new IntProperty(PROP_BIT));
        this.properties.add(new IntProperty(PROP_DATA_TYPE));
        this.properties.add(new BooleanProperty(PROP_EFFECT_3D));
        this.properties.add(new BooleanProperty(PROP_SQUARE_LED));
        this.properties.add(new IntProperty(PROP_STATE_COUNT, 2));
        this.properties.add(new ColorProperty(PROP_OFF_COLOR));
        this.properties.add(new StringProperty(PROP_OFF_LABEL));
        this.properties.add(new ColorProperty(PROP_ON_COLOR));
        this.properties.add(new StringProperty(PROP_ON_LABEL));
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new BooleanProperty(PROP_SHOW_BOOLEAN_LABEL));
        this.properties.add(new ColorProperty(PROP_STATE_COLOR_FALLBACK));
        this.properties.add(new StringProperty(PROP_STATE_LABEL_FALLBACK));

        // Old displays don't have these properties
        this.properties.add(new IntProperty(PROP_BULB_BORDER, 3));
        this.properties.add(new ColorProperty(PROP_BULB_BORDER_COLOR, Color.DARK_GRAY));
    }

    parseNode(node: XMLNode) {
        super.parseNode(node);
        if (this.stateCount > 2) {
            for (let i = 0; i < this.stateCount; i++) {
                const colorProperty = new ColorProperty(`state_color_${i}`);
                colorProperty.value = node.getColor(`state_color_${i}`);
                this.properties.add(colorProperty);

                const labelProperty = new StringProperty(`state_label_${i}`);
                labelProperty.value = node.getString(`state_label_${i}`);
                this.properties.add(labelProperty);

                const valueProperty = new FloatProperty(`state_value_${i}`);
                valueProperty.value = node.getFloat(`state_value_${i}`);
                this.properties.add(valueProperty);

                this.states.push({
                    label: this.properties.getValue(labelProperty.name),
                    color: this.properties.getValue(colorProperty.name),
                    value: this.properties.getValue(valueProperty.name),
                });
            }
        }
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            click: () => {
                const event: OpenPVEvent = { pvName: this.pvName! };
                this.display.fireEvent('openpv', event);
            },
            cursor: 'pointer',
        };
    }

    get booleanValue() {
        if (this.dataType === 0) { // Bit
            if (this.bit < 0) {
                return this.pv && this.pv.value !== 0;
            } else if (this.pv?.value !== undefined) {
                return ((this.pv?.value >> this.bit) & 1) > 0;
            } else {
                return false;
            }
        } else if (this.dataType === 1) { // Enum
            return false;
        } else {
            return false;
        }
    }

    get bulbColor(): Color {
        if (this.stateCount <= 2) {
            return this.booleanValue ? this.onColor : this.offColor;
        }

        for (const state of this.states) {
            if (state.value === this.pv?.value) {
                return state.color;
            }
        }
        return this.stateColorFallback;
    }

    get label(): string {
        if (this.stateCount === 2) {
            return this.booleanValue ? this.onLabel : this.offLabel;
        }

        for (const state of this.states) {
            if (state.value === this.pv?.value) {
                return state.label;
            }
        }
        return this.stateLabelFallback;
    }

    draw(g: Graphics) {
        const area = shrink(this.bounds, 3);
        if (this.squareLed) {
            if (this.effect3d) {
                this.drawSquare3d(g, area);
            } else {
                this.drawSquare2d(g, area);
            }
        } else {
            if (this.effect3d) {
                this.drawCircle3d(g, area);
            } else {
                this.drawCircle2d(g, area);
            }
        }

        if (this.showBooleanLabel) {
            g.fillText({
                x: area.x + area.width / 2,
                y: area.y + area.height / 2,
                font: this.font,
                baseline: 'middle',
                align: 'center',
                color: this.foregroundColor,
                text: this.label,
            });
        }
    }

    private drawCircle2d(g: Graphics, area: Bounds) {
        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        let rx = area.width / 2;
        let ry = area.height / 2;
        if (this.bulbBorder > 0) {
            rx -= (this.bulbBorder / 2.0);
            ry -= (this.bulbBorder / 2.0);
        }

        g.fillEllipse({ cx, cy, rx, ry, color: this.bulbColor });
        g.strokeEllipse({ cx, cy, rx, ry, color: this.bulbBorderColor, lineWidth: this.bulbBorder });

        if (this.pv && this.pv.navigable && !this.pv.disconnected) {
            const hitArea = g.addHitRegion(this.areaRegion!);
            hitArea.addEllipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        }
    }

    private drawCircle3d(g: Graphics, area: Bounds) {
        const cx = area.x + (area.width / 2);
        const cy = area.y + (area.height / 2);
        let rx = area.width / 2;
        let ry = area.height / 2;
        g.fillEllipse({ cx, cy, rx, ry, color: Color.WHITE });

        let gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, this.bulbBorderColor.toString());
        gradient.addColorStop(1, this.bulbBorderColor.withAlpha(0).toString());
        g.fillEllipse({ cx, cy, rx, ry, gradient });

        const innerWidth = area.width - (2 * this.bulbBorder);
        const innerHeight = area.height - (2 * this.bulbBorder);
        rx = innerWidth / 2;
        ry = innerHeight / 2;
        g.fillEllipse({ cx, cy, rx, ry, color: this.bulbColor });

        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, Color.WHITE.toString());
        gradient.addColorStop(1, this.bulbBorderColor.withAlpha(0).toString());
        g.fillEllipse({ cx, cy, rx, ry, gradient });

        if (this.pv && this.pv.navigable && !this.pv.disconnected) {
            const hitArea = g.addHitRegion(this.areaRegion!);
            hitArea.addEllipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        }
    }

    private drawSquare2d(g: Graphics, area: Bounds) {
        const box = toBorderBox(area.x, area.y, area.width, area.height, this.bulbBorder);
        g.fillRect({
            ...box,
            color: this.bulbColor,
        });
        g.strokeRect({
            ...box,
            color: this.bulbBorderColor,
            lineWidth: this.bulbBorder,
        });

        if (this.pv && this.pv.navigable && !this.pv.disconnected) {
            const hitArea = g.addHitRegion(this.areaRegion!);
            hitArea.addRect(area.x, area.y, area.width, area.height);
        }
    }

    private drawSquare3d(g: Graphics, area: Bounds) {
        g.fillRect({
            ...area,
            color: this.bulbBorderColor,
        });

        if (this.pv && this.pv.navigable && !this.pv.disconnected) {
            const hitArea = g.addHitRegion(this.areaRegion!);
            hitArea.addRect(area.x, area.y, area.width, area.height);
        }

        // Left border
        let gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y)
                .lineTo(area.x + this.bulbBorder, area.y + this.bulbBorder)
                .lineTo(area.x + this.bulbBorder, area.y + area.height - this.bulbBorder)
                .lineTo(area.x, area.y + area.height)
        });

        // Top border
        gradient = g.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.078)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y)
                .lineTo(area.x + this.bulbBorder, area.y + this.bulbBorder)
                .lineTo(area.x + area.width - this.bulbBorder, area.y + this.bulbBorder)
                .lineTo(area.x + area.width, area.y)
        });

        // Right border
        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x + area.width, area.y)
                .lineTo(area.x + area.width - this.bulbBorder, area.y + this.bulbBorder)
                .lineTo(area.x + area.width - this.bulbBorder, area.y + area.height - this.bulbBorder)
                .lineTo(area.x + area.width, area.y + area.height)
        });

        // Bottom border
        gradient = g.createLinearGradient(area.x, area.y, area.x, area.y + area.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.078)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.39)');
        g.fillPath({
            gradient,
            path: new Path(area.x, area.y + area.height)
                .lineTo(area.x + this.bulbBorder, area.y + area.height - this.bulbBorder)
                .lineTo(area.x + area.width - this.bulbBorder, area.y + area.height - this.bulbBorder)
                .lineTo(area.x + area.width, area.y + area.height)
        });

        // Bulb
        const x = area.x + this.bulbBorder;
        const y = area.y + this.bulbBorder;
        const width = area.width - (2 * this.bulbBorder);
        const height = area.height - (2 * this.bulbBorder);

        g.fillRect({ x, y, width, height, color: this.bulbColor });

        // Bulb gradient overlay
        gradient = g.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
        gradient.addColorStop(0, 'rgba(255,255,255,0.784)');
        gradient.addColorStop(1, this.bulbColor.withAlpha(0).toString());
        g.fillRect({ x, y, width, height, gradient });
    }

    get bit(): number { return this.properties.getValue(PROP_BIT); }
    get dataType(): number { return this.properties.getValue(PROP_DATA_TYPE); }
    get squareLed(): boolean { return this.properties.getValue(PROP_SQUARE_LED); }
    get showBooleanLabel(): boolean { return this.properties.getValue(PROP_SHOW_BOOLEAN_LABEL); }
    get font(): Font { return this.properties.getValue(PROP_FONT); }
    get effect3d(): boolean { return this.properties.getValue(PROP_EFFECT_3D); }
    get stateCount(): number { return this.properties.getValue(PROP_STATE_COUNT); }
    get bulbBorder(): number { return this.properties.getValue(PROP_BULB_BORDER); }
    get bulbBorderColor(): Color { return this.properties.getValue(PROP_BULB_BORDER_COLOR); }
    get offLabel(): string { return this.properties.getValue(PROP_OFF_LABEL); }
    get offColor(): Color { return this.properties.getValue(PROP_OFF_COLOR); }
    get onLabel(): string { return this.properties.getValue(PROP_ON_LABEL); }
    get onColor(): Color { return this.properties.getValue(PROP_ON_COLOR); }
    get stateLabelFallback(): string { return this.properties.getValue(PROP_STATE_LABEL_FALLBACK); }
    get stateColorFallback(): Color { return this.properties.getValue(PROP_STATE_COLOR_FALLBACK); }
}
