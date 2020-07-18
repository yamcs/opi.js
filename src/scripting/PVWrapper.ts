import { PV } from '../pv/PV';

export class PVWrapper {

    constructor(readonly _pv: PV) {
    }

    getName() {
        return this._pv.name;
    }

    getValue() {
        return this._pv.value;
    }

    setValue(value: any) {
        this._pv.pvEngine.setValue(new Date(), this._pv.name, value);
    }
}
