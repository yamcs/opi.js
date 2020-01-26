# opi.js

This is a JavaScript library for rendering Yamcs OPI operator displays in a web browser.

OPI displays can be made with the desktop product Yamcs Studio (https://github.com/yamcs/yamcs-studio)


## Limitations

Compared to the Yamcs Studio desktop software, this library does support these features:

* No Python scripts (use JavaScript instead)
* No access to Java code from within scripts
* Scripts cannot access the local file system

In addition, this library is still in its beginning phase. Many widgets are not yet fully supported.


## Usage

```
npm install --save @yamcs/opi
```

```html
<div id="mydisplay"></div>
```

```js
import { Display } from '@yamcs/opi';

const targetEl = document.getElementById('mydisplay');
const display = new Display(targetEl);
display.setSource('/static/my-display.opi');
```

This library is a side project of the authors of [Yamcs Mission Control](https://yamcs.org) for inclusion in its web interface. See the Yamcs sources for our use case: https://github.com/yamcs/yamcs/yamcs-web/src/main/webapp


## Acknowledgments

The OPI display format originates from [Control System Studio](https://github.com/ControlSystemStudio/cs-studio). The implementation in this repository ports many of the routines under license of the authors of Control System Studio.

Note that compatibility with Control System Studio is not an objective of this library. Instead we follow the display format of Yamcs Studio -- a fork of Control System Studio.


## License

MIT License

This product includes 3rd party software that uses different licensing terms. For details see [LICENSE](LICENSE).
