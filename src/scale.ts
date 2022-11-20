export class AutoScaleWidgets {
  constructor(
    /**
     * If true, ScaleOptions from widgets are applied.
     *
     * This is not the same as "scaling", but acts more like
     * a stretch to fillup some externally set dimension. It somehow
     * distributes space among all the widgets (repositioning x/y coordinates),
     * and then the widgets that mark themselves as "scalable", may also have
     * their dimensions changed (with mixed results).
     *
     * Seems decent in headers/footers. Not so sure about actual content,
     * because the x/y repositioning may cause the display to look a bit
     * messy.
     */
    readonly autoScaleWidgets: boolean,
    readonly minWidth: number,
    readonly minHeight: number
  ) {}
}

export class ScaleOptions {
  constructor(
    readonly widthScalable: boolean,
    readonly heightScalable: boolean,
    readonly keepWidthHeightRatio: boolean
  ) {}
}
