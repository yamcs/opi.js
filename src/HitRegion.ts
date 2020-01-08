export interface HitRegion {
    id: string;
    click?: () => void;
    mouseEnter?: () => void;
    mouseMove?: () => void;
    mouseOut?: () => void;
    mouseDown?: () => void;
    mouseUp?: () => void;
    cursor?: string;
}
