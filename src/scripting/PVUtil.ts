import { PVEngine } from '../pv/PVEngine';
import { PVWrapper } from './PVWrapper';

export class PVUtil {

    constructor(private pvEngine: PVEngine) {
    }

    getDouble(pv: PVWrapper) {
        // It probably already is a float, but parseFloat again to emit error if it's not
        return parseFloat(pv.getValue());
    }
}
