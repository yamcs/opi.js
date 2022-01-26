export class DecimalFormat {

    private prefix = '';
    private suffix = '';
    /**
     * Grouping size
     */
    private comma = 0;
    /**
     * Minimum integer digits to be displayed
     */
    private minInt = 1;
    /**
     * Minimum fractional digits to be displayed
     */
    private minFrac = 0;
    /**
     * Maximum fractional digits to be displayed
     */
    private maxFrac = 0;

    constructor(formatStr: string) {
        for (let i = 0; i < formatStr.length; i++) {
            if (formatStr.charAt(i) == '#' || formatStr.charAt(i) == '0') {
                this.prefix = formatStr.substring(0, i);
                formatStr = formatStr.substring(i);
                break;
            }
        }

        this.suffix = formatStr.replace(/[#]|[0]|[,]|[.]/g, '');

        const numberStr = formatStr.replace(/[^0#,.]/g, '');
        let intStr = '';
        let fracStr = '';
        const point = numberStr.indexOf('.');
        if (point !== -1) {
            intStr = numberStr.substring(0, point);
            fracStr = numberStr.substring(point + 1);
        }
        else {
            intStr = numberStr;
        }

        const commaPos = intStr.lastIndexOf(',');
        if (commaPos !== -1) {
            this.comma = intStr.length - 1 - commaPos;
        }

        intStr = intStr.replace(/[,]/g, ''); // remove commas

        fracStr = fracStr.replace(/[,]|[.]+/g, '');

        this.maxFrac = fracStr.length;
        let tmp = intStr.replace(/[^0]/g, ''); // remove all except zero
        if (tmp.length > this.minInt)
            this.minInt = tmp.length;
        tmp = fracStr.replace(/[^0]/g, '');
        this.minFrac = tmp.length;
    }

    /**
     * 1223.06 --> $1,223.06
     */
    format(numStr: any) {
        // remove prefix, suffix and commas
        let numberStr = this.formatBack(numStr).toLowerCase();

        // do not format if not a number
        if (isNaN(numberStr) || numberStr.length == 0)
            return numStr;

        //scientific numbers
        if (numberStr.indexOf("e") != -1) {
            const n = Number(numberStr);
            if (n === Infinity || n === -Infinity) return numberStr;
            numberStr = n + "";
            if (numberStr.indexOf('e') !== -1) return numberStr;
        }

        let negative = false;
        // remove sign
        if (numberStr.charAt(0) === '-') {
            negative = true;
            numberStr = numberStr.substring(1);
        }
        else if (numberStr.charAt(0) === '+') {
            numberStr = numberStr.substring(1);
        }

        const point = numberStr.indexOf('.'); // position of point character
        let intStr = '';
        let fracStr = '';
        if (point != -1) {
            intStr = numberStr.substring(0, point);
            fracStr = numberStr.substring(point + 1);
        }
        else {
            intStr = numberStr;
        }
        fracStr = fracStr.replace(/[.]/, ''); // remove other point characters

        const isPercentage = this.suffix && this.suffix.charAt(0) === '%';
        // if percentage, number will be multiplied by 100.
        let minInt = this.minInt, minFrac = this.minFrac, maxFrac = this.maxFrac;
        if (isPercentage) {
            minInt -= 2;
            minFrac += 2;
            maxFrac += 2;
        }

        if (fracStr.length > maxFrac) { // round
            //case 6143
            let num: any = Number('0.' + fracStr);
            num = (maxFrac == 0) ? Math.round(num) : num.toFixed(maxFrac);
            // toFixed method has bugs on IE (0.7 --> 0)
            fracStr = num.toString(10).substr(2);
            let c = (num >= 1) ? 1 : 0; //carry
            let x, i = intStr.length - 1;
            while (c) { //increment intStr
                if (i == -1) {
                    intStr = '1' + intStr;
                    break;
                }
                else {
                    x = Number(intStr.charAt(i));
                    if (x === 9) { x = '0'; c = 1; }
                    else { x = (++x) + ''; c = 0; }
                    intStr = intStr.substring(0, i) + x + intStr.substring(i + 1, intStr.length);
                    i--;
                }
            }
        }
        for (let i = fracStr.length; i < minFrac; i++) { // if minFrac=4 then 1.12 --> 1.1200
            fracStr = fracStr + '0';
        }
        while (fracStr.length > minFrac && fracStr.charAt(fracStr.length - 1) == '0') { // if minInt=4 then 00034 --> 0034)
            fracStr = fracStr.substring(0, fracStr.length - 1);
        }

        for (let i = intStr.length; i < minInt; i++) { // if minInt=4 then 034 --> 0034
            intStr = '0' + intStr;
        }
        while (intStr.length > minInt && intStr.charAt(0) == '0') { // if minInt=4 then 00034 --> 0034)
            intStr = intStr.substring(1);
        }

        if (isPercentage) { // multiply by 100
            intStr += fracStr.substring(0, 2);
            fracStr = fracStr.substring(2);
        }

        let j = 0;
        for (let i = intStr.length; i > 0; i--) { // add commas
            if (j != 0 && j % this.comma == 0) {
                intStr = intStr.substring(0, i) + ',' + intStr.substring(i);
                j = 0;
            }
            j++;
        }

        let formattedValue;
        if (fracStr.length > 0)
            formattedValue = this.prefix + intStr + '.' + fracStr + this.suffix;
        else
            formattedValue = this.prefix + intStr + this.suffix;

        if (negative) {
            formattedValue = '-' + formattedValue;
        }

        return formattedValue;
    }

    /**
     * Converts formatted value back to non-formatted value
     */
    private formatBack(fNumStr: any) { // $1,223.06 --> 1223.06
        fNumStr += ''; //ensure it is string
        if (!fNumStr) return ''; //do not return undefined or null
        if (!isNaN(fNumStr)) return this.getNumericString(fNumStr);
        let fNumberStr = fNumStr;
        let negative = false;
        if (fNumStr.charAt(0) === '-') {
            fNumberStr = fNumberStr.substr(1);
            negative = true;
        }
        const pIndex = fNumberStr.indexOf(this.prefix);
        const sIndex = (this.suffix == '') ? fNumberStr.length : fNumberStr.indexOf(this.suffix, this.prefix.length + 1);
        if (pIndex == 0 && sIndex > 0) {
            // remove suffix
            fNumberStr = fNumberStr.substr(0, sIndex);
            // remove prefix
            fNumberStr = fNumberStr.substr(this.prefix.length);
            // remove commas
            fNumberStr = fNumberStr.replace(/,/g, '');
            if (negative)
                fNumberStr = '-' + fNumberStr;
            if (!isNaN(fNumberStr))
                return this.getNumericString(fNumberStr);
        }
        return fNumStr;
    }

    /**
     * We shouldn't return strings like 1.000 in formatBack method.
     * However, using only Number(str) is not enough, because it omits . in big numbers
     * like 23423423423342234.34 => 23423423423342236 . There's a conflict in cases
     * 6143 and 6541.
     */
    private getNumericString(str: string) {
        const num = Number(str);
        //check if there is a missing dot
        const numStr = num + '';
        if (str.indexOf('.') > -1 && numStr.indexOf('.') < 0) {
            //check if original string has all zeros after dot or not
            for (var i = str.indexOf('.') + 1; i < str.length; i++) {
                //if not, this means we lost precision
                if (str.charAt(i) !== '0') return str;
            }
            return numStr;
        }
        return str;
    }
}
