import { PV } from '../pv/PV';

export class PVWrapper {

    constructor(private pv: PV<any>) {
    }

    getName() {
        return this.pv.name;
    }

    getValue() {
        return this.pv.value;
    }

    setValue(value: any) {
        this.pv.value = value;
    }
}
