export interface ConsoleHandler {
    writeInfo(message: string): void;
    writeError(message: string): void;
    writeWarning(message: string): void;
}

export class DefaultConsoleHandler implements ConsoleHandler {

    writeInfo(message: string) {
        console.log(message);
    }

    writeError(message: string) {
        console.error(message);
    }

    writeWarning(message: string) {
        console.warn(message);
    }
}
