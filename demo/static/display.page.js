import { Display } from "/dist/opi.js";

window.page = (function () {
  const displayEl = document.getElementById("mydisplay");
  const widgetsEl = document.getElementById("widgets");

  const display = new Display(displayEl);

  display.setFontResolver({
    resolve: (font) => {
      let file;
      if (font.name === "Liberation Sans") {
        file = "LiberationSans-Regular.woff2";
        if (font.bold && font.italic) {
          file = "LiberationSans-BoldItalic.woff2";
        } else if (font.bold) {
          file = "LiberationSans-Bold.woff2";
        } else if (font.italic) {
          file = "LiberationSans-Italic.woff2";
        }
      } else if (font.name === "Liberation Mono") {
        file = "LiberationMono-Regular.woff2";
        if (font.bold && font.italic) {
          file = "LiberationMono-BoldItalic.woff2";
        } else if (font.bold) {
          file = "LiberationMono-Bold.woff2";
        } else if (font.italic) {
          file = "LiberationMono-Italic.woff2";
        }
      } else if (font.name === "Liberation Serif") {
        file = "LiberationSerif-Regular.woff2";
        if (font.bold && font.italic) {
          file = "LiberationSerif-BoldItalic.woff2";
        } else if (font.bold) {
          file = "LiberationSerif-Bold.woff2";
        } else if (font.italic) {
          file = "LiberationSerif-Italic.woff2";
        }
      }

      if (file) {
        return new FontFace(font.name, `url(/dist/fonts/${file})`, {
          weight: font.bold ? "bold" : "normal",
          style: font.italic ? "italic" : "normal",
        });
      }
    },
  });

  display.addEventListener("opendisplay", (evt) => {
    let href = evt.path;
    if (evt.args) {
      let first = true;
      for (const k in evt.args) {
        href += first ? "?" : "&";
        href += encodeURIComponent(k) + "=";
        href += encodeURIComponent(evt.args[k]);
        first = false;
      }
    }
    window.location.href = href;
  });

  widgetsEl.addEventListener("click", (evt) => {
    const item = evt.target.closest("li");
    if (item) {
      const widget = display.findWidget(item.dataset.wuid);
      display.selection = [widget.wuid];
      return false;
    }
  });

  return {
    loadDisplay: (href) => {
      display.imagesPrefix = "/dist/images/";
      display.absPrefix = "/raw/";
      const urlParams = new URLSearchParams(window.location.search);
      const args = {};
      urlParams.forEach((v, k) => (args[k] = v));
      display.setSource(href, args).then(() => {
        let html = "";
        for (const widget of display.widgets) {
          let label = widget.name;
          if (widget.pvName) {
            label += ` (${widget.pvName})`;
          }
          html += `<li data-wuid="${widget.wuid}">${label}</li>`;
        }
        widgetsEl.innerHTML = html;
      });
    },
    toggleEdit: () => {
      if (display.editMode) {
        display.clearSelection();
        display.showGrid = false;
        display.showOutline = false;
        display.showRuler = false;
        display.editMode = false;
      } else {
        display.showGrid = true;
        display.showOutline = true;
        display.showRuler = true;
        display.editMode = true;
      }
    },
    zoomIn: () => {
      display.scale += 0.1;
    },
    zoomOut: () => {
      display.scale -= 0.1;
    },
  };
})();
