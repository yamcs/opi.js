import { Display } from '/dist/opi.js';

window.page = (function () {

    const displayEl = document.getElementById('mydisplay');
    const widgetsEl = document.getElementById('widgets');

    const display = new Display(displayEl);

    display.addEventListener('selection', () => {
        console.log('--- new selection');
        for (const id of display.selection) {
            const widget = display.findWidget(id);
            console.log('properties', widget.properties.all());
        }
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
        loadDisplay: (baseUrl, name) => {
            display.baseUrl = baseUrl;
            display.setSource(name).then(() => {
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
        toggleGrid: () => {
            display.showGrid = !display.showGrid;
        },
        toggleOutline: () => {
            display.showOutline = !display.showOutline;
        },
        toggleRuler: () => {
            display.showRuler = !display.showRuler;
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
    };
})();
