import { ColorMap } from "../ColorMap";
import { ColorMapProperty, StringProperty } from "../properties";
import { Widget } from "../Widget";
import { ActionWrapper } from "./ActionWrapper";
import { ArrayList } from "./ArrayList";
import { PVWrapper } from "./PVWrapper";

/**
 * Exposes the API for the variable "widget" as used in display scripts.
 */
export class WidgetWrapper {
  constructor(private widget: Widget) {}

  executeAction(index: number) {
    this.widget.executeActionByIndex(index);
  }

  getPVByName(name: string) {
    const pv = this.widget.display.getPV(name);
    return pv ? new PVWrapper(pv) : null;
  }

  getPV(propertyName = "pv_name") {
    const propertyValue = this.getPropertyValue(propertyName);
    if (propertyValue) {
      return this.getPVByName(propertyValue);
    } else {
      return null;
    }
  }

  getHookedActions() {
    const actions = this.widget
      .getHookedActions()
      .map((action) => new ActionWrapper(action, this.widget));
    return new ArrayList(actions);
  }

  getVar(name: string) {
    return this.widget.vars.get(name) ?? null;
  }

  setVar(name: string, value: any) {
    this.widget.vars.set(name, value);
  }

  getPropertyValue(propertyName: string) {
    const property = this.widget.properties.getProperty(propertyName);
    return property ? property.value : null;
  }

  setPropertyValue(propertyName: string, value: any) {
    const property = this.widget.properties.getProperty(propertyName);
    if (!property) {
      throw new Error(`Cannot set value of unknown property ${propertyName}`);
    }

    if (property instanceof StringProperty) {
      value = value !== undefined ? String(value) : value;
      this.widget.properties.setValue(propertyName, value);
    } else if (property instanceof ColorMapProperty) {
      let code = 0;
      switch (value) {
        case "GrayScale":
          code = 1;
          break;
        case "JET":
          code = 2;
          break;
        case "ColorSpectrum":
          code = 3;
          break;
        case "Hot":
          code = 4;
          break;
        case "Cool":
          code = 5;
          break;
        case "Shaded":
          code = 6;
          break;
      }
      // It is unfortunate that autoscale and interpolate are fixed
      // to true, instead of keeping their previous values. But that
      // is consistent with current Yamcs Studio behaviour.
      const colorMap = new ColorMap(code, true, true);
      this.widget.properties.setValue(propertyName, colorMap);
    } else {
      this.widget.properties.setValue(propertyName, value);
    }

    this.widget.requestRepaint();
  }

  getName(): string {
    return this.getPropertyValue("name");
  }

  setX(x: number) {
    this.setPropertyValue("x", x);
  }

  setY(y: number) {
    this.setPropertyValue("y", y);
  }

  setWidth(width: number) {
    this.setPropertyValue("width", width);
  }

  setHeight(height: number) {
    this.setPropertyValue("height", height);
  }

  setEnabled(enabled: boolean) {
    this.setPropertyValue("enabled", enabled);
  }

  setVisible(visible: boolean) {
    this.setPropertyValue("visible", visible);
  }

  getValue() {
    return this.widget.value ?? null;
  }

  setValue(value: any) {
    this.widget.value = value;
  }

  setValueInUIThread(value: any) {
    this.setValue(value);
  }
}
