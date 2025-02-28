import { ActionSet } from "./actions";
import { Action } from "./actions/Action";
import { Color } from "./Color";
import { Display } from "./Display";
import { Font } from "./Font";
import { Graphics, Path } from "./Graphics";
import { HitRegionSpecification } from "./HitRegionSpecification";
import { Bounds, shrink, toBorderBox } from "./positioning";
import {
  ActionsProperty,
  BooleanProperty,
  ColorProperty,
  FontProperty,
  IntProperty,
  PropertyListener,
  PropertySet,
  PVValueProperty,
  RulesProperty,
  ScaleOptionsProperty,
  ScriptsProperty,
  StringProperty,
} from "./properties";
import { AlarmSeverity, PV } from "./pv/PV";
import { RuleSet } from "./rules";
import { ScaleOptions } from "./scale";
import { ScriptSet } from "./scripts";
import { AbstractContainerWidget } from "./widgets/others/AbstractContainerWidget";
import { XMLNode } from "./XMLNode";

const PROP_ACTIONS = "actions";
const PROP_BACKGROUND_COLOR = "background_color";
const PROP_BACKGROUND_ALARM_SENSITIVE = "backcolor_alarm_sensitive";
const PROP_BORDER_ALARM_SENSITIVE = "border_alarm_sensitive";
const PROP_BORDER_COLOR = "border_color";
const PROP_BORDER_WIDTH = "border_width";
const PROP_BORDER_STYLE = "border_style";
const PROP_ENABLED = "enabled";
const PROP_FOREGROUND_COLOR = "foreground_color";
const PROP_FOREGROUND_ALARM_SENSITIVE = "forecolor_alarm_sensitive";
const PROP_HEIGHT = "height";
const PROP_NAME = "name";
const PROP_PV_NAME = "pv_name";
const PROP_PV_VALUE = "pv_value";
const PROP_RULES = "rules";
const PROP_SCALE_OPTIONS = "scale_options";
const PROP_SCRIPTS = "scripts";
const PROP_TEXT = "text";
const PROP_TOOLTIP = "tooltip";
const PROP_TRANSPARENT = "transparent";
const PROP_VISIBLE = "visible";
const PROP_WIDGET_TYPE = "widget_type";
const PROP_WIDTH = "width";
const PROP_WUID = "wuid";
const PROP_X = "x";
const PROP_Y = "y";

export abstract class Widget {
  // bbox around the widget (excluding border)
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  // Intrinsic value of the widget. PV widgets write to
  // this value upon PV update, but it may also be updated
  // directly through scripting.
  private _value: any;

  // Some widgets ignore the fill of this border (only the stroke).
  // (Rectangle, RoundedRectangle)
  protected fillRoundRectangleBackgroundBorder = true;

  private holderRegion?: HitRegionSpecification;

  properties: PropertySet;

  // Custom variables, for use by scripts
  readonly vars = new Map<string, any>();

  private pvs: PV[] = [];

  constructor(
    readonly display: Display,
    readonly parent?: AbstractContainerWidget
  ) {
    this.properties = new PropertySet(this, [
      new ActionsProperty(PROP_ACTIONS, new ActionSet()),
      new BooleanProperty(PROP_BACKGROUND_ALARM_SENSITIVE, false),
      new ColorProperty(PROP_BACKGROUND_COLOR, Color.TRANSPARENT),
      new BooleanProperty(PROP_BORDER_ALARM_SENSITIVE, false),
      new ColorProperty(PROP_BORDER_COLOR),
      new IntProperty(PROP_BORDER_STYLE),
      new IntProperty(PROP_BORDER_WIDTH),
      new BooleanProperty(PROP_ENABLED, true),
      new BooleanProperty(PROP_FOREGROUND_ALARM_SENSITIVE, false),
      new ColorProperty(PROP_FOREGROUND_COLOR),
      new IntProperty(PROP_HEIGHT),
      new StringProperty(PROP_NAME),
      new StringProperty(PROP_PV_NAME),
      new PVValueProperty(PROP_PV_VALUE, PROP_PV_NAME),
      new RulesProperty(PROP_RULES, new RuleSet()),
      new ScriptsProperty(PROP_SCRIPTS),
      new StringProperty(PROP_TEXT, ""),
      new StringProperty(PROP_TOOLTIP, ""),
      new BooleanProperty(PROP_TRANSPARENT, false),
      new BooleanProperty(PROP_VISIBLE),
      new StringProperty(PROP_WIDGET_TYPE),
      new IntProperty(PROP_WIDTH),
      new StringProperty(PROP_WUID),
      new IntProperty(PROP_X),
      new IntProperty(PROP_Y),
      new ScaleOptionsProperty(PROP_SCALE_OPTIONS),
    ]);
  }

  parseNode(node: XMLNode) {
    this.properties.loadXMLValues(node);

    for (const property of this.properties.all()) {
      if (property instanceof FontProperty) {
        const font = property.value as Font;
        this.loadFont(font);
      }
    }

    if (this.pvName) {
      const pv = this.display.pvEngine.createPV(this.pvName);
      this.pvs.push(pv);
    }

    for (const script of this.scripts.scripts) {
      const pvs: PV[] = [];
      for (const input of script.inputs) {
        const pvName = this.expandMacro(input.pvName);
        pvs.push(this.display.pvEngine.createPV(pvName));
      }

      // Before fetch, so that any subscriptions don't have to wait
      // on the next sync tick.
      this.pvs.push(...pvs);

      if (script.embedded) {
        this.display.pvEngine.createScript(this, script, script.text!, pvs);
      } else {
        fetch(this.display.resolvePath(script.path!), {
          // Send cookies too.
          // Old versions of Firefox do not do this automatically.
          credentials: "same-origin",
        }).then((response) => {
          if (response.ok) {
            response.text().then((text) => {
              this.display.pvEngine.createScript(this, script, text, pvs);
            });
          }
        });
      }
    }

    for (const rule of this.rules.rules) {
      if (this.properties.getProperty(rule.propertyName)) {
        this.display.pvEngine.createRule(this, rule);
      } else {
        console.warn(
          `Cannot create rule for unsupported property ${rule.propertyName}`
        );
      }
    }

    // Default underlay region, specific widgets may need to redefine
    // if they place a region on top.
    //
    // Don't declare a region unless necessary, to prevent
    // undesired mouse interactions
    //
    // EDIT: Commented out "this.tooltip" because it is independent of
    // actions. For example, see 4_Actions_2.opi.
    // Better fix would be to do tooltips on another canvas than
    // the click regions.
    if (/*this.tooltip ||*/ this.actions.isClickable()) {
      this.holderRegion = {
        id: `${this.wuid}-holder`,
      };
      if (this.tooltip) {
        this.holderRegion.tooltip = () => this.tooltip;
      }
      if (this.actions.isClickable()) {
        this.holderRegion.click = () => {
          for (const action of this.getHookedActions()) {
            this.executeAction(action);
          }
        };
        this.holderRegion!.cursor = "pointer";
      }
    }

    this.init();
  }

  getHookedActions() {
    const { actions: actionSet } = this;
    const hookedActions = [];
    for (let i = 0; i < actionSet.actions.length; i++) {
      if (i === 0) {
        if (
          actionSet.hookFirstActionToClick ||
          actionSet.hookAllActionsToClick
        ) {
          hookedActions.push(actionSet.actions[i]!);
        }
      } else {
        if (actionSet.hookAllActionsToClick) {
          hookedActions.push(actionSet.actions[i]!);
        }
      }
    }
    return hookedActions;
  }

  drawHolder(g: Graphics) {
    const { scale } = this;
    let insets = [0, 0, 0, 0]; // T L B R

    const alarmBorder =
      this.borderAlarmSensitive &&
      (this.pv?.severity === AlarmSeverity.MINOR ||
        this.pv?.severity === AlarmSeverity.MAJOR);

    if (!alarmBorder) {
      switch (this.borderStyle) {
        case 0: // Empty
          // Not all widgets do this, so we shrink bounds inside the widget's draw
          // if (this.borderAlarmSensitive) {
          //    insets = [2, 2, 2, 2];
          //}
          break;
        case 1: // Line
          insets = [
            this.borderWidth,
            this.borderWidth,
            this.borderWidth,
            this.borderWidth,
          ];
          break;
        case 2: // Raised
        case 3: // Lowered
          insets = [1 * scale, 1 * scale, 1 * scale, 1 * scale];
          break;
        case 4: // Etched
        case 5: // Ridged
        case 6: // Button Raised
          insets = [2 * scale, 2 * scale, 2 * scale, 2 * scale];
          break;
        case 7: // Button Pressed
          insets = [2 * scale, 2 * scale, 1 * scale, 1 * scale];
          break;
        case 8: // Dot
        case 9: // Dash
        case 10: // Dash Dot
        case 11: // Dash Dot Dot
          insets = [
            this.borderWidth,
            this.borderWidth,
            this.borderWidth,
            this.borderWidth,
          ];
          break;
        case 12: // Title Bar
          insets = [(16 + 1) * scale, 1 * scale, 1 * scale, 1 * scale];
          break;
        case 13: // Group Box
          insets = [16 * scale, 16 * scale, 16 * scale, 16 * scale];
          break;
        case 14: // Round Rectangle Background
          const i = this.borderWidth * 2;
          insets = [i, i, i, i];
          break;
      }
    }

    // Shrink the available widget area
    this.x = this.holderX + insets[1];
    this.y = this.holderY + insets[0];
    this.width = this.holderWidth - insets[1] - insets[3];
    this.height = this.holderHeight - insets[0] - insets[2];

    if (!alarmBorder) {
      this.beforeDrawBorder(g);
      this.drawBorderStyle(g);
    }

    if (this.holderRegion) {
      g.addHitRegion(this.holderRegion).addRect(
        this.holderX,
        this.holderY,
        this.holderWidth,
        this.holderHeight
      );
    }
  }

  beforeDrawBorder(g: Graphics) {
    // For extension
  }

  private drawBorderStyle(g: Graphics) {
    const { scale } = this;
    if (this.borderStyle === 0) {
      // No border
      // Ignore
    } else if (this.borderStyle === 1) {
      // Line
      g.strokeRect({
        x: this.holderX,
        y: this.holderY,
        width: this.holderWidth,
        height: this.holderHeight,
        color: this.borderColor,
        lineWidth: this.borderWidth,
        crispen: true,
      });
    } else if (this.borderStyle === 2) {
      // Raised
      const lineWidth = 1 * scale;
      const top = this.holderY + lineWidth / 2;
      const left = this.holderX + lineWidth / 2;
      const bottom =
        this.holderY + this.holderHeight - lineWidth + lineWidth / 2;
      const right = this.holderX + this.holderWidth - lineWidth + lineWidth / 2;
      g.strokePath({
        color: Color.BLACK,
        path: new Path(right, bottom)
          .lineTo(right, top)
          .moveTo(right, bottom)
          .lineTo(left, bottom),
      });
      g.strokePath({
        color: Color.WHITE,
        path: new Path(left, top)
          .lineTo(right - lineWidth, top)
          .moveTo(left, top)
          .lineTo(left, bottom - lineWidth),
      });
    } else if (this.borderStyle === 3) {
      // Lowered

      if (this.isAnyPvInvalid()) {
        return; // Avoid drawing dashes on top of border
      }

      const lineWidth = 1 * scale;
      const top = this.holderY + lineWidth / 2;
      const left = this.holderX + lineWidth / 2;
      const bottom =
        this.holderY + this.holderHeight - lineWidth + lineWidth / 2;
      const right = this.holderX + this.holderWidth - lineWidth + lineWidth / 2;
      g.strokePath({
        color: Color.WHITE,
        path: new Path(right, bottom)
          .lineTo(right, top)
          .moveTo(right, bottom)
          .lineTo(left, bottom),
      });
      g.strokePath({
        color: Color.BLACK,
        path: new Path(left, top)
          .lineTo(right - lineWidth, top)
          .moveTo(left, top)
          .lineTo(left, bottom - lineWidth),
      });
    } else if (this.borderStyle === 4) {
      // Etched
      this.drawShadowBorder(
        g,
        Color.BUTTON_LIGHTEST,
        Color.BUTTON_DARKER,
        Color.BUTTON_DARKER,
        Color.BUTTON_LIGHTEST
      );
    } else if (this.borderStyle === 5) {
      // Ridged
      this.drawShadowBorder(
        g,
        Color.BUTTON_DARKER,
        Color.BUTTON_LIGHTEST,
        Color.BUTTON_LIGHTEST,
        Color.BUTTON_DARKER
      );
    } else if (this.borderStyle === 6) {
      // Button Raised
      this.drawShadowBorder(
        g,
        Color.BUTTON_DARKEST,
        Color.BUTTON_DARKER,
        Color.BUTTON,
        Color.BUTTON_LIGHTEST
      );
    } else if (this.borderStyle === 7) {
      // Button Pressed
      this.drawShadowBorder(
        g,
        Color.BUTTON_LIGHTEST,
        Color.BUTTON_LIGHTEST,
        Color.BUTTON_DARKEST,
        Color.BUTTON_DARKER
      );
    } else if (this.borderStyle === 8) {
      // Dot
      this.drawDashedBorder(g, [2 * scale, 2 * scale]);
    } else if (this.borderStyle === 9) {
      // Dash
      this.drawDashedBorder(g, [6 * scale, 2 * scale]);
    } else if (this.borderStyle === 10) {
      // Dash Dot
      this.drawDashedBorder(g, [6 * scale, 2 * scale, 2 * scale, 2 * scale]);
    } else if (this.borderStyle === 11) {
      // Dash Dot Dot
      this.drawDashedBorder(g, [
        6 * scale,
        2 * scale,
        2 * scale,
        2 * scale,
        2 * scale,
        2 * scale,
      ]);
    } else if (this.borderStyle === 12) {
      // Title bar
      g.fillRect({
        x: this.holderX,
        y: this.holderY + 1 * scale,
        width: this.holderWidth,
        height: 16 * scale,
        color: this.borderColor,
      });
      g.fillText({
        x: this.holderX + 1 * scale + 3 * scale,
        y: this.holderY + 1 * scale + (16 / 2) * scale,
        baseline: "middle",
        align: "left",
        font: Font.ARIAL_11.scale(scale),
        color: Color.BLACK,
        text: this.name,
      });
      g.strokeRect({
        x: this.holderX,
        y: this.holderY,
        width: this.holderWidth,
        height: this.holderHeight,
        color: Color.BLACK,
        crispen: true,
      });
    } else if (this.borderStyle === 13) {
      // Group Box
      const fm = g.measureText(this.name, Font.ARIAL_11.scale(scale));
      const lineWidth = 1;
      let box = toBorderBox(
        this.holderX + 8 * scale,
        this.holderY + 8 * scale,
        this.holderWidth - 16 * scale - lineWidth,
        this.holderHeight - 16 * scale - lineWidth,
        lineWidth
      );

      if (!this.transparent) {
        // Cover inner box
        g.fillRect({
          ...shrink(box, 8 * scale),
          color: this.backgroundColor,
        });
        // Cover label
        g.fillRect({
          x: this.holderX + 16 * scale,
          y: this.holderY,
          width: fm.width,
          height: 16 * scale,
          color: this.backgroundColor,
        });
      }

      g.fillText({
        x: this.holderX + 16 * scale,
        y: this.holderY + 8 * scale,
        baseline: "middle",
        align: "left",
        font: Font.ARIAL_11.scale(scale),
        color: this.borderColor,
        text: this.name,
      });

      // Avoid drawing border over text
      g.strokePath({
        color: this.backgroundColor.darker(),
        path: new Path(box.x, box.y)
          .lineTo(box.x + 8 * scale, box.y)
          .moveTo(box.x + 8 * scale + fm.width, box.y)
          .lineTo(box.x + box.width, box.y)
          .lineTo(box.x + box.width, box.y + box.height)
          .lineTo(box.x, box.y + box.height)
          .lineTo(box.x, box.y),
      });

      box = toBorderBox(
        this.holderX + 8 * scale + lineWidth,
        this.holderY + 8 * scale + lineWidth,
        this.holderWidth - 16 * scale - lineWidth,
        this.holderHeight - 16 * scale - lineWidth,
        lineWidth
      );

      g.strokePath({
        color: this.backgroundColor.brighter(),
        path: new Path(box.x, box.y)
          .lineTo(box.x + 8 * scale - lineWidth, box.y)
          .moveTo(box.x + 8 * scale - lineWidth + fm.width, box.y)
          .lineTo(box.x + box.width, box.y)
          .lineTo(box.x + box.width, box.y + box.height)
          .lineTo(box.x, box.y + box.height)
          .lineTo(box.x, box.y),
      });
    } else if (this.borderStyle === 14) {
      // Round Rectangle Background
      const box = toBorderBox(
        this.holderX,
        this.holderY,
        this.holderWidth,
        this.holderHeight,
        this.borderWidth
      );

      if (this.fillRoundRectangleBackgroundBorder) {
        g.fillRect({
          ...box,
          rx: 4 * scale,
          ry: 4 * scale,
          color: this.backgroundColor,
        });
      }
      if (this.borderWidth) {
        g.strokeRect({
          ...box,
          rx: 4 * scale,
          ry: 4 * scale,
          color: this.borderColor,
          lineWidth: this.borderWidth,
        });
      }
    } else if (this.borderStyle === 15) {
      // Empty
      // NOP
    } else {
      console.warn(`Unsupported border style: ${this.borderStyle}`);
    }
  }

  private isAnyPvDisconnected() {
    const mainPvDisconnected = this.pvName && (!this.pv || this.pv.disconnected);
    const anyPvDisconnected = this.pvs.find(pv => pv.disconnected) !== undefined;
    return mainPvDisconnected || anyPvDisconnected;
  }

  private isAnyPvInvalid() {
    let invalid = false;
    for (const pv of this.pvs) {
      if (pv.value === undefined) {
        invalid = true;
        break;
      }
    }
    return this.pvs.length && invalid;
  }

  drawDecoration(g: Graphics) {
    if (this.display.editMode) {
      return;
    }
    const { scale } = this;

    if (this.isAnyPvDisconnected()) {
      // Disconnected
      const lineWidth = 1 * scale;
      g.fillRect({
        x: this.holderX - lineWidth / 2,
        y: this.holderY - lineWidth / 2,
        width: this.holderWidth + lineWidth,
        height: this.holderHeight + lineWidth,
        color: this.display.disconnectedColor,
        opacity: 0.4,
      });
      g.strokeRect({
        x: this.holderX - lineWidth / 2,
        y: this.holderY - lineWidth / 2,
        width: this.holderWidth + lineWidth,
        height: this.holderHeight + lineWidth,
        color: this.display.disconnectedColor,
      });
    } else if (this.isAnyPvInvalid()) {
      // Connected, but no value
      g.strokeRect({
        ...this.bounds,
        dash: [2 * scale, 2 * scale],
        lineWidth: 2 * scale,
        color: this.display.invalidColor,
        crispen: true,
      });
    }

    if (this.borderAlarmSensitive) {
      let dash;
      if (this.borderStyle === 8) {
        // Dot
        dash = [2 * scale, 2 * scale];
      } else if (this.borderStyle === 9) {
        // Dash
        dash = [6 * scale, 2 * scale];
      } else if (this.borderStyle === 10) {
        // Dash Dot
        dash = [6 * scale, 2 * scale, 2 * scale, 2 * scale];
      } else if (this.borderStyle === 11) {
        // Dash Dot Dot
        dash = [
          6 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
          2 * scale,
        ];
      }
      if (this.pv?.severity === AlarmSeverity.MAJOR) {
        g.strokeRect({
          ...this.bounds,
          lineWidth: 2 * scale,
          color: this.display.majorColor,
          crispen: true,
          dash,
        });
      } else if (this.pv?.severity === AlarmSeverity.MINOR) {
        g.strokeRect({
          ...this.bounds,
          lineWidth: 2 * scale,
          color: this.display.minorColor,
          crispen: true,
          dash,
        });
      } else if (this.pv?.severity === AlarmSeverity.INVALID) {
        g.strokeRect({
          ...this.bounds,
          lineWidth: 2 * scale,
          color: this.display.invalidColor,
          crispen: true,
        });
      }
    }
  }

  drawOverlay(g: Graphics) { }

  drawSelection(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.strokeRect(
      this.holderX - 0.5,
      this.holderY - 0.5,
      this.holderWidth + 1,
      this.holderHeight + 1
    );
    ctx.fillStyle = "black";
    let r = 2;
    ctx.fillRect(this.holderX - r, this.holderY - r, r + r, r + r);
    ctx.fillRect(
      this.holderX + this.holderWidth / 2 - r,
      this.holderY - r,
      r + r,
      r + r
    );
    ctx.fillRect(
      this.holderX + this.holderWidth - r,
      this.holderY - r,
      r + r,
      r + r
    );

    ctx.fillRect(
      this.holderX - r,
      this.holderY + this.holderHeight / 2 - r,
      r + r,
      r + r
    );
    ctx.fillRect(
      this.holderX + this.holderWidth - r,
      this.holderY + this.holderHeight / 2 - r,
      r + r,
      r + r
    );

    ctx.fillRect(
      this.holderX - r,
      this.holderY + this.holderHeight - r,
      r + r,
      r + r
    );
    ctx.fillRect(
      this.holderX + this.holderWidth / 2 - r,
      this.holderY + this.holderHeight - r,
      r + r,
      r + r
    );
    ctx.fillRect(
      this.holderX + this.holderWidth - r,
      this.holderY + this.holderHeight - r,
      r + r,
      r + r
    );

    ctx.strokeStyle = "white";
    r = 3;
    ctx.strokeRect(
      this.holderX - r + 0.5,
      this.holderY - r + 0.5,
      r + r - 1,
      r + r - 1
    );
    ctx.strokeRect(
      this.holderX + this.holderWidth / 2 - r + 0.5,
      this.holderY - r + 0.5,
      r + r - 1,
      r + r - 1
    );
    ctx.strokeRect(
      this.holderX + this.holderWidth - r + 0.5,
      this.holderY - r + 0.5,
      r + r - 1,
      r + r - 1
    );

    ctx.strokeRect(
      this.holderX - r + 0.5,
      this.holderY + this.holderHeight / 2 - r + 0.5,
      r + r - 1,
      r + r - 1
    );
    ctx.strokeRect(
      this.holderX + this.holderWidth - r + 0.5,
      this.holderY + this.holderHeight / 2 - r + 0.5,
      r + r - 1,
      r + r - 1
    );

    ctx.strokeRect(
      this.holderX - r + 0.5,
      this.holderY + this.holderHeight - r + 0.5,
      r + r - 1,
      r + r - 1
    );
    ctx.strokeRect(
      this.holderX + this.holderWidth / 2 - r + 0.5,
      this.holderY + this.holderHeight - r + 0.5,
      r + r - 1,
      r + r - 1
    );
    ctx.strokeRect(
      this.holderX + this.holderWidth - r + 0.5,
      this.holderY + this.holderHeight - r + 0.5,
      r + r - 1,
      r + r - 1
    );
  }

  requestRepaint() {
    this.display.requestRepaint();
  }

  resolvePath(path: string) {
    return this.display.resolvePath(path, this);
  }

  /**
   * Bounds of this widget (within its parent).
   * Bounds cover the entire widget: area + ornaments.
   */
  get bounds(): Bounds {
    return {
      x: this.holderX,
      y: this.holderY,
      width: this.holderWidth,
      height: this.holderHeight,
    };
  }

  get unscaledBounds(): Bounds {
    return {
      x: this.properties.getValue(PROP_X),
      y: this.properties.getValue(PROP_Y),
      width: this.properties.getValue(PROP_WIDTH),
      height: this.properties.getValue(PROP_HEIGHT),
    };
  }

  /**
   * Area where the widget can draw.
   * (this is smaller than the actual widget bounds).
   */
  get area(): Bounds {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  private drawShadowBorder(
    g: Graphics,
    c1: Color,
    c2: Color,
    c3: Color,
    c4: Color
  ) {
    const lineWidth = 1 * this.scale;
    const top = this.holderY + lineWidth / 2;
    const left = this.holderX + lineWidth / 2;
    const bottom = this.holderY + this.holderHeight - lineWidth + lineWidth / 2;
    const right = this.holderX + this.holderWidth - lineWidth + lineWidth / 2;
    g.strokePath({
      color: c1,
      path: new Path(right, bottom)
        .lineTo(right, top)
        .moveTo(right, bottom)
        .lineTo(left, bottom),
    });
    g.strokePath({
      color: c2,
      path: new Path(right - lineWidth, bottom - lineWidth)
        .lineTo(right - lineWidth, top + lineWidth)
        .moveTo(right - lineWidth, bottom - lineWidth)
        .lineTo(left + lineWidth, bottom - lineWidth),
    });
    g.strokePath({
      color: c3,
      path: new Path(left, top)
        .lineTo(right - lineWidth, top)
        .moveTo(left, top)
        .lineTo(left, bottom - lineWidth),
    });
    g.strokePath({
      color: c4,
      path: new Path(left + lineWidth, top + lineWidth)
        .lineTo(right - lineWidth - lineWidth, top + lineWidth)
        .moveTo(left + lineWidth, top + lineWidth)
        .lineTo(left + lineWidth, bottom - lineWidth - lineWidth),
    });
  }

  private drawDashedBorder(g: Graphics, dash: number[]) {
    const bbox = toBorderBox(
      this.holderX,
      this.holderY,
      this.holderWidth,
      this.holderHeight,
      this.borderWidth
    );
    g.strokePath({
      color: this.borderColor,
      lineWidth: this.borderWidth,
      dash,
      path: new Path(bbox.x, bbox.y)
        .lineTo(bbox.x + bbox.width, bbox.y)
        .lineTo(bbox.x + bbox.width, bbox.y + bbox.height)
        .lineTo(bbox.x, bbox.y + bbox.height)
        .closePath(),
    });
  }

  executeActionByIndex(index: number) {
    const action = this.actions.getAction(index);
    if (!action) {
      return;
    }
    this.executeAction(action);
  }

  executeAction(action: Action) {
    action.execute(this);
  }

  expandMacro(text: string) {
    if (text.indexOf("$") === -1) {
      return text;
    } else {
      for (const prop of this.properties.all()) {
        // Both ${pv_name} and $(pv_name) notations are accepted

        if (prop instanceof PVValueProperty) {
          const pvProperty = this.properties.getProperty(prop.pvPropertyName);
          let replacement = "";
          const pvName = pvProperty?.value;
          if (pvName) {
            const pv = this.display.getPV(pvName);
            replacement = pv?.value ?? "";
          }
          text = text.replace(`$(${prop.name})`, replacement);
          text = text.replace(`\${${prop.name}}`, replacement);
        } else {
          text = text.replace(`$(${prop.name})`, prop.value || "");
          text = text.replace(`\${${prop.name}}`, prop.value || "");
        }
      }
      return this.parent ? this.parent.expandContainerMacros(text) : text;
    }
  }

  private loadFont(font: Font) {
    if (font.isWebSafe()) {
      return; // Nothing to load
    }
    const fontResolver = this.display.getFontResolver();
    if (!fontResolver) {
      console.warn(`Failed to load font '${font.getFontString()}'.`);
      return;
    }
    const fontFace = fontResolver.resolve(font);
    if (!fontFace) {
      console.warn(`Failed to load font '${font.getFontString()}'.`);
      return;
    }
    fontFace
      .load()
      .then((fontFace) => {
        document.fonts.add(fontFace);
        this.requestRepaint();
      })
      .catch((err) => {
        console.warn(`Failed to load font '${font.getFontString()}'.`, err);
      });
  }

  get pv(): PV | undefined {
    if (this.pvName) {
      return this.display.getPV(this.pvName);
    }
  }

  isMinorSeverity() {
    return this.pv?.severity === AlarmSeverity.MINOR;
  }

  isMajorSeverity() {
    return this.pv?.severity === AlarmSeverity.MAJOR;
  }

  get alarm() {
    return (
      this.pv?.severity === AlarmSeverity.MINOR ||
      this.pv?.severity === AlarmSeverity.MAJOR ||
      this.pv?.severity === AlarmSeverity.INVALID
    );
  }

  get alarmSensitiveBackgroundColor() {
    if (this.backgroundAlarmSensitive) {
      if (this.isMajorSeverity()) {
        return this.display.majorColor;
      } else if (this.isMinorSeverity()) {
        return this.display.minorColor;
      } else if (this.pv?.severity === AlarmSeverity.INVALID) {
        return this.display.invalidColor;
      }
    }
    return this.backgroundColor;
  }

  get alarmSensitiveForegroundColor() {
    if (this.foregroundAlarmSensitive) {
      if (this.isMajorSeverity()) {
        return this.display.majorColor;
      } else if (this.isMinorSeverity()) {
        return this.display.minorColor;
      }
    }
    return this.foregroundColor;
  }

  get scale() {
    let scale = this.display.scale;
    let parent = this.parent;
    while (parent) {
      scale *= parent.relativeScale;
      parent = parent.parent;
    }
    return scale;
  }

  get value() {
    return this._value;
  }

  set value(value: any) {
    this._value = value;
    this.requestRepaint();
  }

  addPropertyListener(propertyName: string, listener: PropertyListener<any>) {
    const property = this.properties.getProperty(propertyName)!;
    property.addListener(listener);
  }

  removePropertyListener(
    propertyName: string,
    listener: PropertyListener<any>
  ) {
    const property = this.properties.getProperty(propertyName)!;
    property.removeListener(listener);
  }

  /**
   * Returns this widget as an image.
   */
  toDataURL(type = "image/png", quality?: any) {
    const area = this.display.measureAbsoluteArea(this);
    const canvas = this.display.copyCanvas(area);
    return canvas.toDataURL(type, quality);
  }

  get wuid(): string {
    return this.properties.getValue(PROP_WUID);
  }
  get name(): string {
    return this.properties.getValue(PROP_NAME);
  }
  get holderX(): number {
    return this.scale * this.properties.getValue(PROP_X);
  }
  get holderY(): number {
    return this.scale * this.properties.getValue(PROP_Y);
  }
  get holderWidth(): number {
    return this.scale * this.properties.getValue(PROP_WIDTH);
  }
  get holderHeight(): number {
    return this.scale * this.properties.getValue(PROP_HEIGHT);
  }
  get borderAlarmSensitive(): boolean {
    return this.properties.getValue(PROP_BORDER_ALARM_SENSITIVE);
  }
  get backgroundAlarmSensitive(): boolean {
    return this.properties.getValue(PROP_BACKGROUND_ALARM_SENSITIVE);
  }
  get foregroundAlarmSensitive(): boolean {
    return this.properties.getValue(PROP_FOREGROUND_ALARM_SENSITIVE);
  }
  get pvName(): string | undefined {
    return this.properties.getValue(PROP_PV_NAME, true);
  }
  get pvValue(): any {
    return this.properties.getValue(PROP_PV_VALUE, true);
  }
  get borderColor(): Color {
    return this.properties.getValue(PROP_BORDER_COLOR);
  }
  get borderStyle(): number {
    return this.properties.getValue(PROP_BORDER_STYLE);
  }
  get borderWidth(): number {
    return this.scale * this.properties.getValue(PROP_BORDER_WIDTH);
  }
  get backgroundColor(): Color {
    return this.properties.getValue(PROP_BACKGROUND_COLOR);
  }
  get enabled(): boolean {
    return this.properties.getValue(PROP_ENABLED);
  }
  get foregroundColor(): Color {
    return this.properties.getValue(PROP_FOREGROUND_COLOR);
  }
  get tooltip(): string | undefined {
    const property = this.properties.getProperty(
      PROP_TOOLTIP
    ) as StringProperty;
    if (property.rawValue) {
      return this.expandMacro(property.rawValue);
    }
  }
  get transparent(): boolean {
    return this.properties.getValue(PROP_TRANSPARENT);
  }
  get visible(): boolean {
    return this.properties.getValue(PROP_VISIBLE);
  }
  get actions(): ActionSet {
    return this.properties.getValue(PROP_ACTIONS);
  }
  get scripts(): ScriptSet {
    return this.properties.getValue(PROP_SCRIPTS);
  }
  get rules(): RuleSet {
    return this.properties.getValue(PROP_RULES);
  }
  get scaleOptions(): ScaleOptions {
    return this.properties.getValue(PROP_SCALE_OPTIONS);
  }
  get widgetType(): string | undefined {
    return this.properties.getValue(PROP_WIDGET_TYPE, true);
  }

  get text(): string {
    if (this.display.editMode) {
      const prop = this.properties.getProperty(PROP_TEXT) as StringProperty;
      return (prop.rawValue || "").split(" ").join("\u00a0"); // Preserve whitespace
    } else {
      const text = this.properties.getValue(PROP_TEXT);
      return text.split(" ").join("\u00a0"); // Preserve whitespace
    }
  }

  /**
   * Called exactly once post-construct. A destroyed widget will
   * never be re-inited.
   */
  init(): void { }

  /**
   * Called when a widget should temporarily hide content
   * (tab switch).
   *
   * Most widgets don't need to override, but it used by some
   * that position HTML on top of the canvas.
   *
   * Unhide should occur upon the next draw request.
   */
  hide(): void { }

  /**
   * Called when a widget will never be used again.
   * (display close).
   */
  destroy(): void { }

  abstract draw(g: Graphics): void;
}
