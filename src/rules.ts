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

export interface BooleanExpression {
    expression: string;
    outputValue: string;
}

export interface RuleInput {
    pvName: string;
    trigger: boolean;
}
