// parser.js
// =========================
// Parser for Spark-like custom language
// Converts tokens into an Abstract Syntax Tree (AST)
// Supports statements, functions, expressions, arrays, recursion
// =========================

export function parse(tokens) {
  let cursor = 0;
  const errors = [];

  // =========================
  // Helper functions
  // =========================
  function peek(offset = 0) {
    return tokens[cursor + offset] || null;
  }

  function next() {
    const t = tokens[cursor];
    cursor++;
    return t;
  }

  // Instead of throwing errors, we collect them
  function expect(type, value = null) {
    const token = peek();
    if (!token || token.type !== type || (value && token.value !== value)) {
      errors.push(
        `Expected ${type}${value ? ` '${value}'` : ""} at line ${
          token ? token.line : "EOF"
        }`,
      );
      return null;
    }
    return next();
  }

  // =========================
  // AST Node creation helpers
  // =========================
  function createNode(type, props = {}) {
    return { type, ...props };
  }

  // =========================
  // Expressions
  // =========================

  // Primary: numbers, identifiers, strings, parenthesis, array literals
  function parsePrimary() {
    const token = next();
    if (!token) return null;

    if (token.type === "NUMBER") {
      return createNode("NumberLiteral", { value: token.value });
    }
    if (token.type === "STRING") {
      return createNode("StringLiteral", { value: token.value });
    }
    if (token.type === "IDENTIFIER") {
      return createNode("Identifier", { name: token.value });
    }
    if (token.type === "SYMBOL" && token.value === "(") {
      const expr = parseExpression();
      expect("SYMBOL", ")");
      return expr;
    }
    if (token.type === "SYMBOL" && token.value === "[") {
      // array literal
      const elements = [];
      while (peek() && peek().value !== "]") {
        const e = parseExpression();
        if (e) elements.push(e);
        if (peek() && peek().value === ",") next(); // skip comma
      }
      expect("SYMBOL", "]");
      return createNode("ArrayLiteral", { elements });
    }

    errors.push(
      `Unexpected token ${token.type} '${token.value}' at line ${token.line}`,
    );
    return null;
  }

  // Handle unary and binary operators with precedence
  function parseExpression(precedence = 0) {
    let left = parsePrimary();
    if (!left) return null;

    while (peek() && peek().type === "OPERATOR") {
      const opToken = peek();
      const opPrecedence = getPrecedence(opToken.value);
      if (opPrecedence < precedence) break;

      next(); // consume operator
      const right = parseExpression(opPrecedence + 1);
      left = createNode("BinaryExpression", {
        operator: opToken.value,
        left,
        right,
      });
    }

    return left;
  }

  function getPrecedence(op) {
    // simple precedence table
    const precedenceMap = {
      "=": 1,
      "+=": 1,
      "-=": 1,
      "*=": 1,
      "/=": 1,
      "%=": 1,
      "||": 2,
      "&&": 3,
      "==": 4,
      "!=": 4,
      "<": 5,
      ">": 5,
      "<=": 5,
      ">=": 5,
      "+": 6,
      "-": 6,
      "*": 7,
      "/": 7,
      "%": 7,
    };
    return precedenceMap[op] || 0;
  }

  // =========================
  // Statements
  // =========================

  function parseStatement() {
    const token = peek();
    if (!token) return null;

    if (token.type === "KEYWORD") {
      switch (token.value) {
        case "input":
        case "read": {
          next(); // consume keyword
          const identifier = expect("IDENTIFIER");
          expect("SYMBOL", ";"); // require semicolon
          return createNode("InputStatement", { name: identifier?.value });
        }
        case "print":
        case "printn": {
          next();
          const expr = parseExpression();
          expect("SYMBOL", ";");
          return createNode("PrintStatement", { expression: expr });
        }
        case "return": {
          next();
          const expr = parseExpression();
          expect("SYMBOL", ";");
          return createNode("ReturnStatement", { expression: expr });
        }
        case "function": {
          return parseFunction();
        }
      }
    }

    // Assignment
    if (token.type === "IDENTIFIER") {
      const left = parsePrimary();
      const op = expect("OPERATOR", "=");
      const right = parseExpression();
      expect("SYMBOL", ";");
      return createNode("AssignmentStatement", { left, right });
    }

    errors.push(
      `Unexpected token ${token.type} '${token.value}' at line ${token.line}`,
    );
    next();
    return null;
  }

  // =========================
  // Function parsing
  // =========================
  function parseFunction() {
    next(); // consume 'function'
    const nameToken = expect("IDENTIFIER");
    expect("SYMBOL", "(");

    // parse parameter list
    const params = [];
    while (peek() && peek().value !== ")") {
      const param = expect("IDENTIFIER");
      if (param) params.push(param.value);
      if (peek() && peek().value === ",") next();
    }
    expect("SYMBOL", ")");

    // function body
    expect("SYMBOL", "{");
    const body = [];
    while (peek() && !(peek().type === "SYMBOL" && peek().value === "}")) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
    }
    expect("SYMBOL", "}");

    return createNode("FunctionDeclaration", {
      name: nameToken?.value,
      params,
      body,
    });
  }

  // =========================
  // Program
  // =========================
  function parseProgram() {
    const program = [];
    while (peek()) {
      const stmt = parseStatement();
      if (stmt) program.push(stmt);
    }
    return program;
  }

  // =========================
  // Parse and return
  // =========================
  const ast = parseProgram();
  return { ast, errors };
}
