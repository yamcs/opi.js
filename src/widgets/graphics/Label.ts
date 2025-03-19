import { Display } from "../../Display";
import { Font } from "../../Font";
import { Graphics } from "../../Graphics";
import { Bounds } from "../../positioning";
import { BooleanProperty, FontProperty, IntProperty } from "../../properties";
import { Widget } from "../../Widget";
import { AbstractContainerWidget } from "../others/AbstractContainerWidget";

const PROP_FONT = "font";
const PROP_HORIZONTAL_ALIGNMENT = "horizontal_alignment";
const PROP_VERTICAL_ALIGNMENT = "vertical_alignment";
const PROP_WRAP_WORDS = "wrap_words";

export class Label extends Widget {
  constructor(display: Display, parent: AbstractContainerWidget) {
    super(display, parent);
    this.properties.add(new FontProperty(PROP_FONT));
    this.properties.add(new IntProperty(PROP_HORIZONTAL_ALIGNMENT));
    this.properties.add(new IntProperty(PROP_VERTICAL_ALIGNMENT));
    this.properties.add(new BooleanProperty(PROP_WRAP_WORDS));
  }

  draw(g: Graphics) {
    if (!this.transparent) {
      g.fillRect({
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        color: this.backgroundColor,
      });
    }

    if (this.wrapWords) {
      this.drawWrapped(g);
    } else {
      this.drawText(g);
    }
  }

  private drawText(g: Graphics) {
    const ctx = g.ctx;
    const textArea = { ...this.area };
    const textSize = g.measureText(this.text, this.font, true);
    ctx.font = this.font.getFontString();

    // Vertical positioning in Yamcs Studio is based on cap heights,
    // rather than x-heights.

    // Measure cap height as the distance between the alphabetic baseline
    // and the ascent relative to that baseline.
    ctx.textBaseline = "alphabetic";
    const fm = ctx.measureText(this.text);
    const capHeight = fm.fontBoundingBoxAscent;

    // Canvas font heights don't match very well with Yamcs Studio.
    // Strategy: position a box surrounding text, then always
    // center text within that box.
    const textBounds: Bounds = {
      x: textArea.x,
      y: textArea.y,
      width: textSize.width,
      height: textSize.height,
    };
    if (this.horizAlignment === 0) {
      // LEFT
      // NOP
    } else if (this.horizAlignment === 1) {
      // CENTER
      textBounds.x += (textArea.width - textSize.width) / 2;
    } else if (this.horizAlignment === 2) {
      // RIGHT
      textBounds.x += textArea.width - textSize.width;
    }

    if (this.vertAlignment === 0 || textArea.height <= textSize.height) {
      // TOP
      // NOP
    } else if (this.vertAlignment === 1) {
      // MIDDLE
      textBounds.y += textArea.height / 2 - textSize.height / 2;
    } else if (this.vertAlignment === 2) {
      // BOTTOM
      textBounds.y += textArea.height - textSize.height;
    }

    // Vertically center in textBounds based on capHeight
    // Note: not using 'textBaseline = "middle"', because Canvas applies this
    // based on the middle of a lowercase letter (middle of x-height), whereas
    // Yamcs Studio takes the middle of an uppercase letter (middle of cap-height).
    ctx.textAlign = "start";
    ctx.textBaseline = "top";
    textBounds.y += textBounds.height / 2 - capHeight / 2;

    ctx.save(); // Clip text in box
    ctx.beginPath();
    const box = this.area;
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.clip(); // Activate clip
    ctx.fillStyle = this.foregroundColor.toString();
    ctx.fillText(this.text, textBounds.x, textBounds.y);
    ctx.restore();
  }

  private drawWrapped(g: Graphics) {
    const ctx = g.ctx;
    const lines = this.wrapText(g, this.text, this.width);

    ctx.fillStyle = this.foregroundColor.toString();
    ctx.font = this.font.getFontString();

    // Canvas does not do multiline string. So
    // we manually calculate each line position.
    ctx.textAlign = "start";
    ctx.textBaseline = "top";

    // TODO should horizontal center not be line by line?
    let maxWidth = 0;
    for (const line of lines) {
      const textWidth = ctx.measureText(line).width;
      maxWidth = Math.max(maxWidth, textWidth);
    }

    let x = this.x;
    if (this.horizAlignment === 1) {
      // CENTER
      x = this.x + (this.width - maxWidth) / 2;
    } else if (this.horizAlignment === 2) {
      // RIGHT
      x = this.x + (this.width - maxWidth);
    }

    const textHeight =
      lines.length * this.font.height +
      (lines.length - 1) * this.font.height * 0.2;

    let y = this.y;
    if (this.vertAlignment === 1) {
      // MIDDLE
      y += (this.height - textHeight) / 2;
    } else if (this.vertAlignment === 2) {
      // BOTTOM
      y += this.height - textHeight;
    }

    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += this.font.height * 1.2; // Roughly
    }
  }

  private wrapText(g: Graphics, text: string, maxWidth: number) {
    let lines: string[] = [];
    for (const line of text.split("\n")) {
      lines = lines.concat(this.wrapLine(g, line, maxWidth));
    }
    return lines;
  }

  private wrapLine(g: Graphics, text: string, maxWidth: number) {
    if (!text) {
      return [""];
    }
    const lines = [];
    let result;
    let i;
    let j;
    let width = 0;
    while (text.length) {
      for (
        i = text.length;
        g.measureText(text.substr(0, i), this.font).width > maxWidth;
        i--
      );

      result = text.substr(0, i);

      if (i !== text.length)
        for (
          j = 0;
          result.indexOf(" ", j) !== -1;
          j = result.indexOf(" ", j) + 1
        );

      lines.push(result.substr(0, j || result.length));
      width = Math.max(
        width,
        g.measureText(lines[lines.length - 1], this.font).width,
      );
      text = text.substr(lines[lines.length - 1].length, text.length);
    }
    return lines;
  }

  get font(): Font {
    return this.properties.getValue(PROP_FONT).scale(this.scale);
  }
  get horizAlignment(): number {
    return this.properties.getValue(PROP_HORIZONTAL_ALIGNMENT);
  }
  get vertAlignment(): number {
    return this.properties.getValue(PROP_VERTICAL_ALIGNMENT);
  }
  get wrapWords(): boolean {
    return this.properties.getValue(PROP_WRAP_WORDS);
  }
}
