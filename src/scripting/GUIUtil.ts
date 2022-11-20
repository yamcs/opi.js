import { Display } from "../Display";

export class GUIUtil {
  constructor(private display: Display) {}

  fullScreen() {
    document.documentElement.requestFullscreen();
  }

  openConfirmDialog(message: string): boolean {
    return this.display
      .getDialogHandler()
      .openConfirmDialog("Confirm Dialog", message);
  }

  openInformationDialog(message: string) {
    this.display
      .getDialogHandler()
      .openInformationDialog("Information", message);
  }

  openWarningDialog(message: string) {
    this.display.getDialogHandler().openWarningDialog("Warning", message);
  }

  openErrorDialog(message: string) {
    this.display.getDialogHandler().openErrorDialog("Error", message);
  }

  openPasswordDialog(message: string, password: string): boolean {
    return this.display
      .getDialogHandler()
      .openPasswordDialog("Password Input Dialog", message, password);
  }
}
