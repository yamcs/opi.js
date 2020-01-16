import { PV } from './PV';

export class LocalPV extends PV {

    constructor(name: string, readonly initializer?: string) {
        super(name);
    }

    isWritable() {
        return true;
    }

    toString() {
        if (this.value !== undefined) {
            return String(this.value);
        }
    }
}
