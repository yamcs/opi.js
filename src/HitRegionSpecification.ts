import { OpiGrabEvent, OpiMouseEvent } from "./EventHandler";

// Tooltips often contain dynamic macros, so their value
// must be provided non-static.
export type TooltipProvider = () => string | undefined;

export interface HitRegionSpecification {
  id: string;
  click?: (mouseEvent: OpiMouseEvent) => void;
  mouseEnter?: () => void;
  mouseMove?: () => void;
  mouseOut?: () => void;
  mouseDown?: (mouseEvent: OpiMouseEvent) => void;
  mouseUp?: () => void;
  grab?: (grabEvent: OpiGrabEvent) => void;
  grabEnd?: () => void;
  cursor?: string;
  tooltip?: TooltipProvider;
}
