# opi.js

[![npm version](https://badge.fury.io/js/%40yamcs%2Fopi.svg)](https://www.npmjs.com/package/@yamcs/opi)

This is a JavaScript library for rendering Yamcs Operator Interfaces (OPI) in a web browser.

An OPI is a file in XML format that describes a synoptic display for the monitoring and control of systems.

This library is a side project of [Yamcs Mission Control](https://yamcs.org) for use in its web interface. Operators can upload and monitor synoptic displays where widgets are connected to telemetry delivered by Yamcs.

## Limitations

Compared to the Yamcs Studio desktop software, this library has these limitations:

- No edit support
- No Python scripts (use JavaScript instead)
- No access to Java code from within scripts
- Scripts cannot access the local file system

And as this library is in incubation phase, many widgets are not or not fully supported.

## Widget Support

## Widget Support

Ticked widgets are at least partially implemented.

### Controls

* [x] Action Button
* [x] Boolean Button
* [x] Boolean Switch
* [x] Check Box
* [x] Choice Button
* [x] Combo
* [x] Image Boolean Button
* [ ] Knob
* [ ] Menu Button
* [x] Native Button
* [x] Radio Box
* [x] Scrollbar
* [ ] Spinner
* [ ] Scaled Slider
* [x] Text Input
* [ ] Thumb Wheel


### Graphics

* [x] Arc
* [x] Ellipse
* [x] Image
* [x] Label
* [x] Polygon
* [x] Polyline
* [x] Rectangle
* [x] Rounded Rectangle


### Monitors

* [x] Byte Monitor
* [x] Gauge
* [x] Image Boolean Indicator
* [ ] Intensity Graph
* [x] LED
* [x] Meter
* [ ] Progress Bar
* [ ] Tank
* [x] Text Update
* [ ] Thermometer
* [x] XY Graph


### Others

* [ ] Array
* [x] Connection
* [x] Display
* [ ] Grid Layout
* [x] Grouping Container
* [x] Linking Container
* [ ] Sash Container
* [x] Tabbed Container
* [ ] Table
* [x] Web Browser


## Usage

```
npm install --save @yamcs/opi
```

```html
<div id="mydisplay" style="display: inline-block"></div>
```

```js
import { Display } from "@yamcs/opi";

const targetEl = document.getElementById("mydisplay");
const display = new Display(targetEl);
display.setSource("/static/my-display.opi");
```

## Acknowledgments

The OPI display format originates from [Control System Studio](https://github.com/ControlSystemStudio/cs-studio), an Eclipse RCP product. The implementation in this repository ports many of their routines.

Note that compatibility with Control System Studio is not an objective of this library. Instead we follow the display format of Yamcs Studio -- a fork of Control System Studio.

## License

MIT License

This product includes 3rd party software under different terms. For details see [LICENSE](LICENSE).
