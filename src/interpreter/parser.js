export function parse(tokens) {
  let cursor = 0;
  const ast = [];
  const errors = [];

  // get current token
  function peek() {
    return tokens[cursor];
  }

  // get current token and move cursor
  function eat() {
    return tokens[cursor++];
  }

  // validate next token
  function expect(type, value, errorMessage) {
    const token = peek();
    if (token?.type === type && (value === null || token.value === value)) {
      return eat();
    }

    const line = token ? token.line : tokens[cursor - 1]?.line || "End";
    errors.push(`Line ${line}: ${errorMessage}`);

    return null;
  }

  // expression ladder
  function parsePrimary() {
    let token = peek();

    // handle unary minus: -4, -10.5, etc.
    if (token?.type === "OPERATOR" && token.value === "-") {
      const next = tokens[cursor + 1];
      if (next?.type === "NUMBER") {
        eat(); // consume '-'
        const numToken = eat(); // consume number
        return {
          value: `-${numToken.value}`,
          valueType: "NUMBER",
        };
      }
    }

    // Handle parenthesized expressions
    if (token?.type === "SYMBOL" && token.value === "(") {
      eat();
      let node = parseExpression();

      expect(
        "SYMBOL",
        ")",
        "Missing closing parenthesis ')' after expression.",
      );

      return node;
    }

    // Handle literals
    if (["NUMBER", "IDENTIFIER", "BOOLEAN", "STRING"].includes(token?.type)) {
      let val = eat();
      return { value: val.value, valueType: val.type };
    }

    errors.push(
      `Line ${token?.line || "End"}: Expected a value but found '${token?.value || "EOF"}'`,
    );

    cursor++;
    return { type: "Error", value: "InvalidValue" };
  }

  // %, *, /
  function parseMultiplicative() {
    let left = parsePrimary();

    while (
      peek()?.type === "OPERATOR" &&
      ["*", "/", "%"].includes(peek().value)
    ) {
      let operator = eat().value;
      let right = parsePrimary();

      left = {
        type: "BinaryExpression",
        left: left.type ? left : left.value,
        leftType: left.type ? "EXPRESSION" : left.valueType,
        operator,
        right: right.type ? right : right.value,
        rightType: right.type ? "EXPRESSION" : right.valueType,
      };
    }

    return left;
  }

  // +, -
  function parseAdditive() {
    let left = parseMultiplicative();

    while (peek()?.type === "OPERATOR" && ["+", "-"].includes(peek().value)) {
      let operator = eat().value;
      let right = parseMultiplicative();

      left = {
        type: "BinaryExpression",
        left: left.type ? left : left.value,
        leftType: left.type ? "EXPRESSION" : left.valueType,
        operator,
        right: right.type ? right : right.value,
        rightType: right.type ? "EXPRESSION" : right.valueType,
      };
    }

    return left;
  }

  // comparison operators
  function parseComparison() {
    let left = parseAdditive();
    const compOps = ["==", "!=", "<", ">", "<=", ">="];

    while (peek()?.type === "OPERATOR" && compOps.includes(peek().value)) {
      let operator = eat().value;
      let right = parseAdditive();

      left = {
        type: "ComparisonExpression",
        left: left.type ? left : left.value,
        operator,
        right: right.type ? right : right.value,
      };
    }

    return left;
  }

  // logical operator: && and ||
  function parseLogical() {
    let left = parseComparison();

    while (peek()?.type === "OPERATOR" && ["&&", "||"].includes(peek().value)) {
      let operator = eat().value;
      let right = parseComparison(); // parseComparison for correct precedence

      left = {
        type: "LogicalExpression",
        left: left.type ? left : left.value,
        leftType: left.type ? "EXPRESSION" : left.valueType,
        operator,
        right: right.type ? right : right.value,
        rightType: right.type ? "EXPRESSION" : right.valueType,
      };
    }

    return left;
  }

  function parseExpression() {
    return parseLogical();
  }

  // block statement : {}
  function parseBlock() {
    const block = [];
    if (!expect("SYMBOL", "{", "Expected '{' to start block.")) return block;

    while (peek() && peek().value !== "}") {
      let stmt = parseStatement();
      if (stmt) block.push(stmt);
      else cursor++; // skip
    }

    expect("SYMBOL", "}", "Missing closing '}' after block.");
    return block;
  }

  // conditional statement
  function parseStatement() {
    let token = peek();
    if (!token) return null;

    // if, elif, else
    if (token.type === "KEYWORD" && token.value === "if") {
      eat();
      expect("SYMBOL", "(", "Missing '(' after 'if'.");

      let condition = parseExpression();
      expect("SYMBOL", ")", "Missing ')' after condition.");
      let thenBlock = parseBlock();

      let ifNode = {
        type: "IfStatement",
        test: condition,
        consequent: thenBlock,
        alternate: null,
      };

      let current = ifNode;
      while (peek()?.value === "elif") {
        eat();
        expect("SYMBOL", "(", "Missing '(' after 'elif'.");
        let elifCond = parseExpression();
        expect("SYMBOL", ")", "Missing ')' after elif condition.");
        let elifBlock = parseBlock();

        current.alternate = {
          type: "IfStatement",
          test: elifCond,
          consequent: elifBlock,
          alternate: null,
        };

        current = current.alternate;
      }

      if (peek()?.value === "else") {
        eat();
        current.alternate = parseBlock();
      }

      return ifNode;
    }

    // while loop
    if (token.type === "KEYWORD" && token.value === "while") {
      eat();
      expect("SYMBOL", "(", "Missing '(' after 'while'.");

      let condition = parseExpression();
      expect("SYMBOL", ")", "Missing ')' after condition.");
      let body = parseBlock();

      return {
        type: "WhileStatement",
        test: condition,
        body,
      };
    }

    // break
    if (token.type === "KEYWORD" && token.value === "break") {
      const breakToken = eat();
      expect("SYMBOL", ";", "Missing ';' after break.");
      return { type: "BreakStatement", line: breakToken.line };
    }

    // continue
    if (token.type === "KEYWORD" && token.value === "continue") {
      const contToken = eat();
      expect("SYMBOL", ";", "Missing ';' after continue.");
      return { type: "ContinueStatement", line: contToken.line };
    }

    // print
    if (token.type === "KEYWORD" && token.value === "print") {
      const printToken = eat();
      const val = peek();

      if (!val || val.type === "SYMBOL") {
        errors.push(
          `Line ${printToken.line}: print expects a string or value.`,
        );
        return null;
      }

      const content = eat();
      expect("SYMBOL", ";", "Missing ';' after print statement.");
      return { type: "PrintStatement", value: content.value };
    }

    // input & const
    if (
      token.type === "KEYWORD" &&
      (token.value === "input" || token.value === "const")
    ) {
      const kind = eat().value;
      const nameToken = expect(
        "IDENTIFIER",
        null,
        `Expected variable name after '${kind}'.`,
      );
      if (!nameToken) return null;

      let result = null;
      if (peek()?.value === "=") {
        eat();
        result = parseExpression();
      } else if (kind === "const") {
        errors.push(`Line ${nameToken.line}: 'const' must be initialized.`);
      }

      expect("SYMBOL", ";", `Missing ';' after ${kind} declaration.`);
      return {
        type: "VariableDeclaration",
        kind,
        name: nameToken.value,
        value: result,
      };
    }

    // assignment & unary
    if (token.type === "IDENTIFIER") {
      const nameToken = eat();
      const next = peek();
      const assignOps = ["=", "+=", "-=", "*=", "/=", "%="];

      if (next?.type === "OPERATOR" && assignOps.includes(next.value)) {
        const op = eat().value;
        const result = parseExpression();

        expect("SYMBOL", ";", "Missing ';' after assignment.");

        return {
          type: "Assignment",
          name: nameToken.value,
          operator: op,
          value: result,
        };
      }

      if (
        next?.type === "OPERATOR" &&
        (next.value === "++" || next.value === "--")
      ) {
        const op = eat().value;
        expect("SYMBOL", ";", `Missing ';' after ${op}.`);
        return { type: "UnaryExpression", name: nameToken.value, operator: op };
      }

      errors.push(
        `Line ${nameToken.line}: Unexpected identifier '${nameToken.value}'.`,
      );
    }

    cursor++;
    return null;
  }

  // traverse tokens
  while (cursor < tokens.length) {
    let stmt = parseStatement();
    if (stmt) ast.push(stmt);
  }

  return { ast, errors };
}
