import { PV } from '../pv/PV';

export class PVWrapper {

    constructor(readonly _pv: PV) {
    }

    getName() {
        return this._pv.name;
    }

    getValue() {
        return this._pv.value ?? null;
    }

    setValue(value: any) {
        this._pv.pvEngine.setValue(new Date(), this._pv.name, value);
    }

    isConnected() {
        return !this._pv.disconnected;
    }

    isWriteAllowed() {
        return this._pv.writable;
    }

    addListener(listener: any /* org.yamcs.studio.data.IPVListener */) {
        this._pv.addListener(() => {
            listener.valueChanged(this);
        });
    }
}
