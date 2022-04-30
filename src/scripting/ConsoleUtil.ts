import { Display } from '../Display';

export class ConsoleUtil {

  constructor(private display: Display) {
  }

  writeInfo(message: string) {
    this.display.getConsoleHandler().writeInfo(message);
  }

  writeError(message: string) {
    this.display.getConsoleHandler().writeError(message);
  }

  writeWarning(message: string) {
    this.display.getConsoleHandler().writeWarning(message);
  }
}
