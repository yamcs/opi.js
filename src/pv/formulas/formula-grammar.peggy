{
  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function buildBinaryExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: 'BinaryExpression',
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function buildLogicalExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: 'LogicalExpression',
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function optionalList(value) {
    return value !== null ? value : [];
  }
}

Start
  = '=' _ formula:Formula _ { return formula; }

Formula
  = expression:Expression {
    return {
      type: 'Formula',
      expression: expression
    };
  }

_
  = WhiteSpace*

WhiteSpace
  = ' '
  / '\t'

FALSE = 'false'i
TRUE = 'true'i
PI = 'PI'i
E = 'E'i

Identifier
  = symbol:IdentifierSymbol {
    return symbol;
  };

IdentifierSymbol 'identifier'
  = head:IdentifierStart tail:IdentifierPart* {
    return {
      type: 'Symbol',
      name: head + tail.join('')
    };
  }

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = [a-zA-Z0-9_]

Literal
  = BooleanLiteral
  / ConstantLiteral
  / NumericLiteral
  / StringLiteral
  / ParameterLiteral

BooleanLiteral 'boolean'
  = TRUE { return { type: 'BooleanLiteral', value: true }; }
  / FALSE { return { type: 'BooleanLiteral', value: false }; }

ConstantLiteral 'constant'
  = PI { return { type: 'ConstantLiteral', value: Math.PI }; }
  / E { return { type: 'ConstantLiteral', value: Math.E }; }

NumericLiteral 'number'
  = DecimalIntegerLiteral '.' DecimalDigit* {
    return { type: 'NumericLiteral', value: parseFloat(text()) };
  }
  / '.' DecimalDigit+ {
    return { type: 'NumericLiteral', value: parseFloat(text()) };
  }
  / DecimalIntegerLiteral {
    return { type: 'NumericLiteral', value: parseFloat(text()) };
  }

DecimalIntegerLiteral
  = '0'
  / NonZeroDigit DecimalDigit*

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

StringLiteral 'string'
  = '"' chars:[^\n\r\f"]* '"' {
    return { type: 'StringLiteral', value: chars.join('') };
  }

ParameterLiteral 'parameter'
  = '\'' chars:[^\n\r\f']* '\'' {
    return { type: 'ParameterLiteral', value: chars.join('') };
  }

PrimaryExpression
  = Literal
  / '(' _ expression:Expression _ ')' { return expression; }

UnaryExpression
  = PrimaryExpression
  / operator:UnaryOperator _ argument:UnaryExpression _ {
    return {
      type: 'UnaryExpression',
      operator: operator,
      argument: argument,
    };
  }

UnaryOperator
  = '-'
  / '+'

CallExpression
  = callee:Identifier _ args:Arguments {
    return {
      type: 'CallExpression',
      callee: callee,
      arguments: args
    };
  }
  / UnaryExpression

Arguments
  = '(' _ args:(ArgumentList _)? ')' {
    return optionalList(extractOptional(args, 0));
  }

ArgumentList
  = head:Expression tail:(_ ',' _ Expression)* {
    return buildList(head, tail, 3);
  }

MultiplicativeExpression
  = head:CallExpression tail:(_ ('*' / '/' / '^' / '%') _ CallExpression)* {
      return buildBinaryExpression(head, tail);
    }

AdditiveExpression
  = head:MultiplicativeExpression tail:(_ ('+' / '-') _ MultiplicativeExpression)* {
      return buildBinaryExpression(head, tail);
    }

RelationalExpression
  = head:AdditiveExpression tail:(_ ('<=' / '>=' / '<' / '>') _ AdditiveExpression)* {
      return buildBinaryExpression(head, tail);
    }

EqualityExpression
  = head:RelationalExpression tail:(_ ('==' / '!=') _ RelationalExpression)* {
      return buildBinaryExpression(head, tail);
    }

LogicalExpression
 = head:EqualityExpression tail:(_ ('&&' / '||') _ EqualityExpression)* {
   return buildLogicalExpression(head, tail);
 }

Expression
  = LogicalExpression
