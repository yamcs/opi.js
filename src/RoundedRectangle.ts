import { Display } from './Display';
import { Rectangle } from './Rectangle';
import * as utils from './utils';

export class RoundedRectangle extends Rectangle {

    constructor(display: Display, node: Element) {
        super(display, node);
        this.cornerWidth = utils.parseIntChild(node, 'corner_width');
        this.cornerHeight = utils.parseIntChild(node, 'corner_height');
    }
}
