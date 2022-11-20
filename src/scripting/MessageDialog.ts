import { Display } from '../Display';

export class MessageDialog {

  constructor(private display: Display) {
  }

  openInformation(shell: any, title: string, message: string) {
    this.display.getDialogHandler().openInformationDialog(title, message);
  }

  openConfirm(shell: any, title: string, message: string) {
    return this.display.getDialogHandler().openConfirmDialog(title, message);
  }

  openError(shell: any, title: string, message: string) {
    this.display.getDialogHandler().openErrorDialog(title, message);
  }
}
