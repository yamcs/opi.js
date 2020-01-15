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
            fetch(this.display.baseUrl + this.opiFile).then(response => {
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
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }

        const linkedWidget = this.getLinkedWidget();
        if (this.linkedDisplay && linkedWidget) {
            // Copy the opi background over the full container area
            g.fillRect({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                color: this.linkedDisplay.backgroundColor,
            });

            //if (linkedWidget) {
            // console.log('need to link to ', linkedWidget.name);
            //}

            const sw = this.linkedDisplay.holderWidth;
            const sh = this.linkedDisplay.holderHeight;
            const offscreen = g.createChild(sw, sh);
            this.linkedDisplay!.draw(offscreen);

            if (this.resizeBehavior === 0) { // FIT_OPI_TO_CONTAINER
                g.copyFitted(offscreen, this.x, this.y, this.width, this.height);
            } else if (this.resizeBehavior === 1) { // FIT_CONTAINER_TO_OPI
                console.warn('Unsupported resize behavior of LinkingContainer', this.resizeBehavior);
            } else if (this.resizeBehavior === 2) { // CROP OPI
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

    get widgets() { return this.linkedDisplay ? this.linkedDisplay.widgets : [] }
    get connections() { return this.linkedDisplay ? this.linkedDisplay.connections : [] }

    findWidget(wuid: string) {
        if (this.linkedDisplay) {
            return this.linkedDisplay.findWidget(wuid);
        }
    }

    get opiFile(): string { return this.properties.getValue(PROP_OPI_FILE); }
    get groupName(): string { return this.properties.getValue(PROP_GROUP_NAME); }
    get resizeBehavior(): number { return this.properties.getValue(PROP_RESIZE_BEHAVIOR); }
}
