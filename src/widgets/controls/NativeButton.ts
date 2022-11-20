import { ActionButton } from "./ActionButton";

/**
 * This widget only exists in old displays.
 * On desktops, it's supposed to use the "native" OS widgets.
 *
 * Treating it like a regular ActionButton is good enough for us.
 */
export class NativeButton extends ActionButton {}
