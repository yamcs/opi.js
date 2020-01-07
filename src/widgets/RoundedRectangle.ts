import { Display } from '../Display';
import * as utils from '../utils';
import { Rectangle } from './Rectangle';

export class RoundedRectangle extends Rectangle {

    constructor(display: Display, node: Element) {
        super(display, node);
        this.cornerWidth = utils.parseIntChild(node, 'corner_width');
        this.cornerHeight = utils.parseIntChild(node, 'corner_height');
    }
}
