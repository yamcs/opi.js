export class MacroSet {

    includeParentMacros = true;
    private macros: { [key: string]: string } = {};

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

    expandMacro(macro: string) {
        if (macro.indexOf('$') === -1) {
            return macro;
        } else {
            let expanded = macro;
            for (const key in this.macros) {
                // Both ${pv_name} and $(pv_name) notations are accepted
                expanded = expanded.replace(`$(${key})`, this.macros[key]);
                expanded = expanded.replace(`\${${key}}`, this.macros[key]);
            }
            return expanded;
        }
    }
}
