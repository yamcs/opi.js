
export abstract class PV<T> {

    value?: T;

    constructor(readonly name: string) {
    }

    abstract toString(): string;
}
