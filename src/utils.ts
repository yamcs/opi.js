import { TypeHint } from './pv/TypeHint';

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number
) {
  ctx.beginPath();
  if (!rx && !ry) {
    ctx.rect(x, y, w, h);
  } else {
    if (w < 2 * rx) {
      rx = w / 2;
    }
    if (h < 2 * ry) {
      ry = h / 2;
    }
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + ry);
    ctx.lineTo(x + w, y + h - ry);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
    ctx.lineTo(x + rx, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - ry);
    ctx.lineTo(x, y + ry);
    ctx.quadraticCurveTo(x, y, x + rx, y);
  }
}

export function normalizePath(base: string, relPath: string) {
  base = "/" + base;
  let nUpLn;
  let sDir = "";
  const sPath = base.replace(
    /[^\/]*$/,
    relPath.replace(/(\/|^)(?:\.?\/+)+/g, "$1")
  );
  let nStart = 0;
  for (
    let nEnd;
    (nEnd = sPath.indexOf("/../", nStart)), nEnd > -1;
    nStart = nEnd + nUpLn
  ) {
    nUpLn = /^\/(?:\.\.\/)*/.exec(sPath.slice(nEnd))![0].length;
    sDir = (sDir + sPath.substring(nStart, nEnd)).replace(
      new RegExp("(?:\\/+[^\\/]*){0," + (nUpLn - 1) / 3 + "}$"),
      "/"
    );
  }
  return (sDir + sPath.substr(nStart)).substr(1);
}

export function formatValue(
  value: any,
  formatType: number,
  precision: number,
  typeHint: TypeHint | undefined,
) {
  if (value === null) {
    return "";
  } else if (typeof value === "string") {
    if (typeHint === "BINARY_STRING") {
      return toHex(value);
    } else {
      return value;
    }
  } else if (typeof value === "number") {
    if (precision === -1) {
      return formatNumber(formatType, value, undefined, 3);
    } else {
      return formatNumber(formatType, value, precision, precision);
    }
  } else if (value instanceof Date) {
    return value.toISOString().replace("T", " ").replace("Z", "");
  } else {
    return String(value);
  }
}

function toHex(raw: string) {
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : '0' + hex;
  }
  return result ? `0x${result.toUpperCase()}` : result;
}

function formatNumber(
  formatType: number,
  value: number,
  minimumFractionDigits: number | undefined,
  maximumFractionDigits: number | undefined,
) {
  if (value == null || value == undefined) {
    return "";
  }

  switch (formatType) {
    case 0: // DEFAULT
    case 1: // NORMAL
      const nfOptions: any = {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: false,
        roundingMode: "halfEven",
      };
      return Intl.NumberFormat("en-US", nfOptions).format(value);
    case 2: // EXPONENTIAL
      return value.toExponential(maximumFractionDigits).replace("e+", "E").toUpperCase();
    case 3: // HEX
      return "0x" + value.toString(16).toUpperCase();
    default:
      console.warn(`Unexpected format type ${formatType}`);
      return String(value);
  }
}
