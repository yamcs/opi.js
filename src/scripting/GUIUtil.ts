export class GUIUtil {

  fullScreen() {
    document.documentElement.requestFullscreen();
  }

  openConfirmDialog(message: string) {
    return confirm(message);
  }

  openInformationDialog(message: string) {
    alert(message);
  }

  openWarningDialog(message: string) {
    alert(message);
  }

  openErrorDialog(message: string) {
    alert(message);
  }

  openPasswordDialog(message: string, password: string) {
    let answer = prompt(message);
    if (answer) {
      return answer === password;
    }
  }
}
