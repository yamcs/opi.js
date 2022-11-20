import { Color } from "./Color";

export class RuleSet {
  rules: Rule[] = [];
}

export interface Rule {
  name: string;
  propertyName: string;
  outputExpression: boolean;
  expressions: BooleanExpression[];
  inputs: RuleInput[];
}

export type BooleanExpression =
  | StringOutputBooleanExpression
  | ColorOutputBooleanExpression;

export interface StringOutputBooleanExpression {
  type: "string";
  expression: string;
  outputValue: string;
}

export interface ColorOutputBooleanExpression {
  type: "color";
  expression: string;
  outputValue: Color;
}

export interface RuleInput {
  pvName: string;
  trigger: boolean;
}
