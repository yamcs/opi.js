export interface DialogHandler {
  openConfirmDialog(title: string, message: string): boolean;
  openInformationDialog(title: string, message: string): void;
  openWarningDialog(title: string, message: string): void;
  openErrorDialog(title: string, message: string): void;
  openPasswordDialog(title: string, message: string, password: string): boolean;
}

export class DefaultDialogHandler implements DialogHandler {
  openConfirmDialog(title: string, message: string) {
    return confirm(message);
  }

  openInformationDialog(title: string, message: string) {
    alert(message);
  }

  openWarningDialog(title: string, message: string) {
    alert(message);
  }

  openErrorDialog(title: string, message: string) {
    alert(message);
  }

  openPasswordDialog(title: string, message: string, password: string) {
    const answer = prompt(message);
    if (answer) {
      return answer === password;
    } else {
      return false;
    }
  }
}
