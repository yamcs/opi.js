import { PV } from '../pv/PV';
import { PVEngine } from '../pv/PVEngine';

export class PVUtil {

    constructor(private pvEngine: PVEngine) {
    }

    getDouble(pv: PV<any>) {
        // It probably already is a float, but parseFloat again to emit error if it's not
        return parseFloat(pv.value);
    }
}
