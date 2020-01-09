import { ActionSet } from './actions';
import { Color } from './Color';
import { Font } from './Font';
import { Point } from './Point';

export abstract class Property<T> {

    value?: T;

    constructor(readonly name: string, readonly defaultValue?: T) {
        this.value = defaultValue;
    }
}

export class StringProperty extends Property<string> {
}

export class IntProperty extends Property<number> {
}

export class FloatProperty extends Property<number> {
}

export class BooleanProperty extends Property<boolean> {
}

export class ColorProperty extends Property<Color> {
}

export class FontProperty extends Property<Font> {
}

export class PointsProperty extends Property<Point[]> {
}

export class ActionsProperty extends Property<ActionSet> {
}
