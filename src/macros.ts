export class MacroSet {
  includeParentMacros = true;
  macros: { [key: string]: string } = {};

  clear() {
    this.macros = {};
  }

  set(name: string, replacement: string) {
    this.macros[name] = replacement;
  }

  get(name: string) {
    if (name in this.macros) {
      return this.macros[name];
    }
  }
}
