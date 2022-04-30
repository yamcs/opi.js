import { Display } from '/dist/opi.js';

window.page = (function () {

    const displayEl = document.getElementById('mydisplay');
    const widgetsEl = document.getElementById('widgets');

    const display = new Display(displayEl);

    display.addEventListener('opendisplay', evt => {
        window.location.href = evt.path;
    });

    widgetsEl.addEventListener('click', evt => {
        const item = evt.target.closest('li');
        if (item) {
            const widget = display.findWidget(item.dataset.wuid);
            display.selection = [widget.wuid];
            return false;
        }
    });

    return {
        loadDisplay: (href) => {
            display.imagesPrefix = '/dist/images/';
            display.absPrefix = '/raw/';
            display.setSource(href).then(() => {
                let html = '';
                for (const widget of display.widgets) {
                    let label = widget.name;
                    if (widget.pvName) {
                        label += ` (${widget.pvName})`;
                    }
                    html += `<li data-wuid="${widget.wuid}">${label}</li>`
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
