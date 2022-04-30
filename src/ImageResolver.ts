import { Display } from './Display';

export interface ImageResolver {
    resolve(file: string): string;
}

export class DefaultImageResolver implements ImageResolver {

    constructor(private display: Display) {
    }

    resolve(file: string) {
        return this.display.resolvePath(file);
    }
}
