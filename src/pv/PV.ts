
export abstract class PV<T> {

    value?: T;

    constructor(readonly name: string) {
    }

    abstract isWritable(): boolean;

    abstract toString(): string | undefined;
}
