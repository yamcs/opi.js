// Standalone bootstrap loaded inside the sandboxed OPI display iframe.
// Communicates with the outer Yamcs webapp exclusively via postMessage.

import { colorFromCssColor } from "./Color";
import { Display } from "./Display";
import { Font } from "./Font";
import { PostMessageImageLoader } from "./PostMessageImageLoader";
import { PostMessageScriptLoader } from "./PostMessageScriptLoader";
import { handleHistorySamples } from "./pv/PostMessageHistoricalDataProvider";
import { PostMessagePVProvider } from "./pv/PostMessagePVProvider";
import { Sample } from "./pv/Sample";

let display: Display | null = null;
let scriptLoader: PostMessageScriptLoader | null = null;
let imageLoader: PostMessageImageLoader | null = null;

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }

  const msg = event.data;
  if (!msg?.type) {
    return;
  }

  switch (msg.type) {
    case "init": {
      const container = document.getElementById("display");
      if (!container) {
        break;
      }

      display = new Display(container);
      scriptLoader = new PostMessageScriptLoader();
      imageLoader = new PostMessageImageLoader();
      display.setImageLoader(imageLoader);

      const { config } = msg;
      if (config.legacyFontSizing) {
        Font.LEGACY_FONT_SIZING = true;
      }
      display.disconnectedColor = colorFromCssColor(config.disconnectedColor);
      display.invalidColor = colorFromCssColor(config.invalidColor);
      display.majorColor = colorFromCssColor(config.majorColor);
      display.minorColor = colorFromCssColor(config.minorColor);
      display.utc = config.utc;
      display.imagesPrefix = msg.imagesPrefix;
      display.absPrefix = msg.absPrefix;
      display.relPrefix = msg.relPrefix;

      const mediaPrefix: string = msg.mediaPrefix;
      display.setFontResolver({
        resolve(font: Font) {
          let file: string | undefined;
          if (font.name === "Liberation Sans") {
            if (font.bold && font.italic) {
              file = "LiberationSans-BoldItalic.woff2";
            } else if (font.bold) {
              file = "LiberationSans-Bold.woff2";
            } else if (font.italic) {
              file = "LiberationSans-Italic.woff2";
            } else {
              file = "LiberationSans-Regular.woff2";
            }
          } else if (font.name === "Liberation Mono") {
            if (font.bold && font.italic) {
              file = "LiberationMono-BoldItalic.woff2";
            } else if (font.bold) {
              file = "LiberationMono-Bold.woff2";
            } else if (font.italic) {
              file = "LiberationMono-Italic.woff2";
            } else {
              file = "LiberationMono-Regular.woff2";
            }
          } else if (font.name === "Liberation Serif") {
            if (font.bold && font.italic) {
              file = "LiberationSerif-BoldItalic.woff2";
            } else if (font.bold) {
              file = "LiberationSerif-Bold.woff2";
            } else if (font.italic) {
              file = "LiberationSerif-Italic.woff2";
            } else {
              file = "LiberationSerif-Regular.woff2";
            }
          }
          if (file) {
            return new FontFace(font.name, `url(${mediaPrefix}${file})`, {
              weight: font.bold ? "bold" : "normal",
              style: font.italic ? "italic" : "normal",
            });
          }
        },
      });

      display.addProvider(new PostMessagePVProvider());
      display.setScriptLoader(scriptLoader);

      display.addScriptLibrary("Yamcs", {
        issueCommand(qname: string, args?: Record<string, any>) {
          window.parent.postMessage(
            { type: "runcommand", command: qname, args: args ?? {} },
            "*",
          );
        },
        runProcedure(procedure: string, args?: Record<string, any>) {
          const strArgs: Record<string, string> = {};
          if (args) {
            for (const k of Object.keys(args)) {
              strArgs[k] = String(args[k]);
            }
          }
          window.parent.postMessage(
            { type: "runprocedure", procedure, args: strArgs },
            "*",
          );
        },
      });

      display.addEventListener("displayloaded", (evt) => {
        window.parent.postMessage(
          { type: "displaybackground", color: evt.backgroundColor },
          "*",
        );
      });
      display.addEventListener("opendisplay", (evt) => {
        window.parent.postMessage(
          {
            type: "opendisplay",
            path: evt.path,
            replace: evt.replace,
            args: evt.args,
          },
          "*",
        );
      });
      display.addEventListener("closedisplay", () => {
        window.parent.postMessage({ type: "closedisplay" }, "*");
      });
      display.addEventListener("openpv", (evt) => {
        window.parent.postMessage({ type: "openpv", pvName: evt.pvName }, "*");
      });
      display.addEventListener("runcommand", (evt) => {
        window.parent.postMessage(
          { type: "runcommand", command: evt.command, args: evt.args },
          "*",
        );
      });
      display.addEventListener("runstack", (evt) => {
        window.parent.postMessage({ type: "runstack", path: evt.path }, "*");
      });
      display.addEventListener("runprocedure", (evt) => {
        window.parent.postMessage(
          { type: "runprocedure", procedure: evt.procedure, args: evt.args },
          "*",
        );
      });

      display.setSourceString(msg.xml, msg.args);
      break;
    }

    case "pvData": {
      if (!display) {
        break;
      }

      for (const [pvName, meta] of Object.entries(
        msg.meta as Record<string, { labels?: string[]; writable: boolean }>,
      )) {
        const pv = display.getPV(pvName);
        if (pv) {
          if (meta.labels) {
            pv.labels = meta.labels;
          }
          pv.writable = meta.writable;
        }
      }

      for (const pvName of msg.disconnected as string[]) {
        const pv = display.getPV(pvName);
        if (pv) {
          pv.disconnected = true;
        }
      }

      const samples = new Map<string, Sample>();
      for (const [pvName, sample] of Object.entries(
        msg.samples as Record<string, Sample>,
      )) {
        samples.set(pvName, sample);
      }
      if (samples.size > 0) {
        display.setValues(samples);
      }
      break;
    }

    case "scriptContent": {
      scriptLoader?.receiveContent(msg.path, msg.content);
      break;
    }

    case "imageData": {
      imageLoader?.receiveData(msg.url, msg.dataUrl);
      break;
    }

    case "historySamples": {
      handleHistorySamples(msg.pvName, msg.samples);
      break;
    }

    case "setScale": {
      if (display) {
        display.scale = msg.scale;
      }
      break;
    }

    case "fitZoom": {
      if (display?.instance) {
        const { width, height } = display.instance.unscaledBounds;
        if (width && height) {
          display.scale = Math.min(
            msg.containerWidth / width,
            msg.containerHeight / height,
          );
        }
      }
      break;
    }
  }
});
