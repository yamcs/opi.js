import * as constants from '../../constants';
import { Display } from '../../Display';
import { IntProperty } from '../../properties';
import { Rectangle } from './Rectangle';

const PROP_CORNER_WIDTH = 'corner_width';
const PROP_CORNER_HEIGHT = 'corner_height';

export class RoundedRectangle extends Rectangle {

    kind = constants.TYPE_ROUNDED_RECTANGLE;

    constructor(display: Display) {
        super(display);
        this.addProperty(new IntProperty(PROP_CORNER_WIDTH));
        this.addProperty(new IntProperty(PROP_CORNER_HEIGHT));
    }

    init() {
        this.cornerWidth = this.getPropertyValue(PROP_CORNER_WIDTH);
        this.cornerHeight = this.getPropertyValue(PROP_CORNER_HEIGHT);
    }
}
