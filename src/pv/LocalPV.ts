import { PV } from './PV';

export class LocalPV extends PV<any> {

    constructor(name: string) {
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
