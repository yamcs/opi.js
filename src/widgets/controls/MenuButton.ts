import { Color } from '../../Color';
import { Display } from '../../Display';
import { Font } from '../../Font';
import { Graphics } from '../../Graphics';
import { HitRegionSpecification } from '../../HitRegionSpecification';
import { FontProperty, StringProperty } from '../../properties';
import { Widget } from '../../Widget';
import { AbstractContainerWidget } from '../others/AbstractContainerWidget';

const PROP_FONT = 'font';
const PROP_LABEL = 'label';

export class MenuButton extends Widget {

    private areaRegion?: HitRegionSpecification;
    private selectEl?: HTMLSelectElement;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new FontProperty(PROP_FONT));
        this.properties.add(new StringProperty(PROP_LABEL));
    }

    init() {
        this.areaRegion = {
            id: `${this.wuid}-area`,
            tooltip: () => this.tooltip,
            cursor: 'pointer'
        };

        this.selectEl = document.createElement('select');
        this.selectEl.style.display = 'block';
        this.selectEl.style.position = 'absolute';
        this.selectEl.style.boxSizing = 'border-box';

        // Hide the select, but allow it still to be 'clickable', so
        // that the browser will display the option menu upon widget click.
        this.selectEl.style.opacity = '0';

        this.selectEl.addEventListener('change', evt => {
            const value = this.selectEl?.value;
            if (value) {
                // Avoid checkbox moving
                this.selectEl!.selectedIndex = 0;
                const idx = Number(value.substring('action-'.length));
                this.executeActionByIndex(idx);
            }
        });

        const emptyOptionEl = document.createElement('option');
        emptyOptionEl.disabled = true;
        emptyOptionEl.value = '';
        emptyOptionEl.defaultSelected = true;
        emptyOptionEl.text = ' -- select an option -- ';
        this.selectEl.add(emptyOptionEl);

        const actions = this.actions.actions;
        for (let i = 0; i < actions.length; i++) {
            const optionEl = document.createElement('option');
            optionEl.value = `action-${i}`;
            optionEl.text = actions[i]?.toString() ?? '';
            this.selectEl.add(optionEl);
        }

        this.display.rootPanel.appendChild(this.selectEl);
    }

    draw(g: Graphics) {
        const bounds = this.display.measureAbsoluteArea(this);

        this.selectEl!.style.display = 'block';
        this.selectEl!.style.left = `${bounds.x}px`;
        this.selectEl!.style.top = `${bounds.y}px`;
        this.selectEl!.style.width = `${bounds.width}px`;
        this.selectEl!.style.height = `${bounds.height}px`;

        const ctx = g.ctx;

        g.fillRect({
            ...this.area,
            color: this.backgroundColor,
        });

        const hitRegion = g.addHitRegion(this.areaRegion!);
        hitRegion.addRect(this.x, this.y, this.width, this.height);

        const lines = this.label.split('\n');

        ctx.fillStyle = this.foregroundColor.toString();
        ctx.font = this.font.getFontString();

        // Calculate available space in height and width
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        let x = this.x + (this.width / 2);
        let y = this.y + (this.height / 2);

        ctx.fillText(lines[0], x, y);
    }

    hide() {
        if (this.selectEl) {
            this.selectEl.style.display = 'none';
        }
    }

    destroy() {
        if (this.selectEl) {
            this.display.rootPanel.removeChild(this.selectEl);
            this.selectEl = undefined;
        }
    }

    get font(): Font {
        return this.properties.getValue(PROP_FONT).scale(this.scale);
    }

    // Some widget instances don't seem to have this property and use a specific default.
    get backgroundColor(): Color {
        const prop = this.properties.getProperty('background_color');
        if (prop && prop.value !== Color.TRANSPARENT) {
            return prop.value;
        } else {
            return Color.BUTTON;
        }
    }

    get label(): string { return this.properties.getValue(PROP_LABEL); }
}
