import { Display } from './Display';

export interface PathResolver {
    resolve(file: string): string;
}

export class DefaultPathResolver implements PathResolver {

    constructor(private display: Display) {
    }

    resolve(path: string) {
        if (path.startsWith('/')) {
            return `${this.display.absPrefix}${path.slice(1)}`;
        } else {
            return `${this.display.relPrefix}${path}`;
        }
    }
}
