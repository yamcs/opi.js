import { Display } from '../../Display';
import { Graphics } from '../../Graphics';
import { IntProperty, StringProperty } from '../../properties';
import { XMLNode } from '../../XMLNode';
import { AbstractContainerWidget } from './AbstractContainerWidget';
import { DisplayWidget } from './DisplayWidget';

const PROP_GROUP_NAME = 'group_name';
const PROP_OPI_FILE = 'opi_file';
const PROP_RESIZE_BEHAVIOR = 'resize_behaviour';

export class LinkingContainer extends AbstractContainerWidget {

    private linkedDisplay?: DisplayWidget;

    constructor(display: Display, parent: AbstractContainerWidget) {
        super(display, parent);
        this.properties.add(new StringProperty(PROP_GROUP_NAME));
        this.properties.add(new StringProperty(PROP_OPI_FILE));
        this.properties.add(new IntProperty(PROP_RESIZE_BEHAVIOR, 0));
    }

    init() {
        if (this.opiFile) {
            fetch(this.display.baseUrl + this.opiFile, {
                // Send cookies too.
                // Old versions of Firefox do not do this automatically.
                credentials: 'same-origin'
            }).then(response => {
                if (response.ok) {
                    response.text().then(source => {
                        this.linkedDisplay = new DisplayWidget(this.display, this);
                        const displayNode = XMLNode.parseFromXML(source);
                        this.linkedDisplay.parseNode(displayNode);
                        this.requestRepaint();
                    });
                }
            });
        }
    }

    draw(g: Graphics) {
        if (!this.transparent) {
            g.fillRect({
                ... this.area,
                color: this.backgroundColor,
            });
        }

        const linkedWidget = this.getLinkedWidget();
        if (this.linkedDisplay && linkedWidget) {
            // Copy the opi background over the full container area
            g.fillRect({
                ... this.area,
                color: this.linkedDisplay.backgroundColor,
            });

            //if (linkedWidget) {
            // console.log('need to link to ', linkedWidget.name);
            //}

            // This is complicated. Notes for future self:
            // -------------------------------------------
            // 1) To be compatible with Yamcs Studio, we ignore the declared
            //    width/height of the linked display. Instead we measure
            //    the real content bounds.
            //
            // 2) Do not use canvas scaling. It leads to bad quality when resampling
            //    to the intended dimension. Instead scale all individual draw
            //    operations, and make sure the offscreen canvas can eventually
            //    be copied to the main canvas without needing a resampling.
            //
            // 3) Scaled drawing as described by (2) may need to be done in
            //    combination with an active scale at display level (for example
            //    user has zoomed in or out). Therefore, a relativeScale is calculated
            //    in comparison to bounds scaled only by display zoom.


            if (this.resizeBehavior === 0) { // FIT_OPI_TO_CONTAINER
                const contentBounds = this.linkedDisplay.measureContentBounds(false /* unscaled */);
                let { width: sw, height: sh } = contentBounds;

                // Scale using display zoom only. This avoids including relativeScale that
                // we set later.
                // TODO maybe this does not yet support nested linking containers.
                const zoom = this.display.scale;
                sw *= zoom;
                sh *= zoom;

                // Calculate fit pre-draw
                const ratio = sw / sh;
                let fitw = this.width;
                let fith = fitw / ratio;
                let relativeScale = fitw / sw;
                if (fith > this.height) {
                    fith = this.height;
                    fitw = fith * ratio;
                    relativeScale = fith / sw;
                }
                this.linkedDisplay.relativeScale = relativeScale;

                const offscreen = g.createChild(Math.ceil(fitw), Math.ceil(fith));
                offscreen.translate(contentBounds.x, contentBounds.y);
                this.linkedDisplay.draw(offscreen);
                g.copy(offscreen, this.x, this.y);
            } else if (this.resizeBehavior === 1) { // FIT_CONTAINER_TO_OPI
                console.warn('Unsupported resize behavior of LinkingContainer', this.resizeBehavior);
            } else if (this.resizeBehavior === 2) { // CROP OPI
                const contentBounds = this.linkedDisplay.measureContentBounds(true /* scaled */);
                const offscreen = g.createChild(contentBounds.width, contentBounds.height);
                offscreen.translate(contentBounds.x, contentBounds.y);

                this.linkedDisplay.draw(offscreen);
                g.copy(offscreen, this.x, this.y);
            } else if (this.resizeBehavior === 3) { // SCROLL OPI
                console.warn('Unsupported resize behavior of LinkingContainer', this.resizeBehavior);
            }
        }
    }

    getLinkedWidget() {
        if (this.linkedDisplay && this.groupName !== '') { // Careful, "0" is a valid group name.
            return this.linkedDisplay.findWidgetByName(this.groupName);
        }
        return this.linkedDisplay;
    }

    get widgets() { return this.linkedDisplay ? this.linkedDisplay.widgets : []; }
    get connections() { return this.linkedDisplay ? this.linkedDisplay.connections : []; }

    findWidget(wuid: string) {
        if (this.linkedDisplay) {
            return this.linkedDisplay.findWidget(wuid);
        }
    }

    get opiFile(): string { return this.properties.getValue(PROP_OPI_FILE); }
    get groupName(): string { return this.properties.getValue(PROP_GROUP_NAME); }
    get resizeBehavior(): number { return this.properties.getValue(PROP_RESIZE_BEHAVIOR); }
}
