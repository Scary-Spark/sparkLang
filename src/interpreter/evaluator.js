// codeGenerator.js - Complete Fixed Evaluator with Logical Operators

export function evaluate(ast) {
  let output = "";
  const errors = [];
  const scopes = [{}];
  let breakFlag = false;
  let continueFlag = false;

  // helper function
  function getVariable(name) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].hasOwnProperty(name)) {
        return scopes[i][name];
      }
    }

    return undefined;
  }

  function setVariable(name, value) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].hasOwnProperty(name)) {
        if (scopes[i][name].isConst) {
          errors.push(
            `Runtime error: Cannot reassign const variable '${name}'`,
          );
          return false;
        }

        scopes[i][name].value = value;
        return true;
      }
    }
    scopes[scopes.length - 1][name] = { value, isConst: false };
    return true;
  }

  function declareVariable(name, value, isConst) {
    if (scopes[scopes.length - 1].hasOwnProperty(name)) {
      errors.push(
        `Runtime error: Variable '${name}' already declared in current scope`,
      );
      return false;
    }
    scopes[scopes.length - 1][name] = { value, isConst };
    return true;
  }

  function parseLiteral(value, valueType) {
    if (value === null || value === undefined) return null;
    switch (valueType) {
      case "NUMBER":
        return Number(value);
      case "BOOLEAN":
        return value === true || value === "true";
      case "STRING":
        return String(value);
      case "IDENTIFIER": {
        const varData = getVariable(value);
        return varData?.value ?? null;
      }
      default:
        if (typeof value === "number") return value;
        if (value === "true") return true;
        if (value === "false") return false;
        const num = Number(value);

        return isNaN(num) ? value : num;
    }
  }

  function detectType(value) {
    if (typeof value !== "string") return typeof value;
    if (/^-?\d+(\.\d+)?$/.test(value)) return "NUMBER";
    if (value === "true" || value === "false") return "BOOLEAN";
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) return "IDENTIFIER";

    return "STRING";
  }

  function evalExpr(node, hintedType = null) {
    if (!node) return null;

    if (!node.type && node.value !== undefined && node.valueType) {
      return parseLiteral(node.value, node.valueType);
    }

    if (typeof node === "string" && hintedType) {
      return parseLiteral(node, hintedType);
    }

    if (typeof node === "string") {
      const detectedType = detectType(node);

      return parseLiteral(node, detectedType);
    }

    if (node.type === "BinaryExpression") {
      const left = evalExpr(node.left, node.leftType);
      const right = evalExpr(node.right, node.rightType);

      return evalBinary(left, node.operator, right);
    }

    if (node.type === "ComparisonExpression") {
      const left = evalExpr(node.left, node.leftType || detectType(node.left));
      const right = evalExpr(
        node.right,
        node.rightType || detectType(node.right),
      );

      return evalComparison(left, node.operator, right);
    }

    // ✅ NEW: Handle LogicalExpression nodes (&&, ||)
    if (node.type === "LogicalExpression") {
      const left = evalExpr(node.left, node.leftType);
      const right = evalExpr(node.right, node.rightType);

      if (node.operator === "&&") {
        return left && right;
      } else if (node.operator === "||") {
        return left || right;
      }

      return false;
    }

    if (!node.type && node.value !== undefined) {
      const type = node.valueType || detectType(node.value);
      return parseLiteral(node.value, type);
    }

    return null;
  }

  function evalBinary(left, operator, right) {
    if (left === null || right === null) return null;
    switch (operator) {
      case "+":
        return left + right;

      case "-":
        return left - right;

      case "*":
        return left * right;

      case "/":
        if (right === 0) {
          errors.push("Runtime error: Division by zero");
          return null;
        }
        return left / right;

      case "%":
        if (right === 0) {
          errors.push("Runtime error: Modulo by zero");
          return null;
        }
        return left % right;

      default:
        return null;
    }
  }

  function evalComparison(left, operator, right) {
    if (left === null || right === null) return false;
    switch (operator) {
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
        return false;
    }
  }

  function interpolate(str) {
    if (typeof str !== "string") return str;

    return str.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      const trimmed = expr.trim();
      return evalInterpolationExpr(trimmed);
    });
  }

  function evalInterpolationExpr(expr) {
    const trimmed = expr.trim();

    const logicalOps = ["&&", "||"];
    for (const op of logicalOps) {
      const opIndex = trimmed.indexOf(op);

      if (opIndex !== -1) {
        const left = trimmed.substring(0, opIndex).trim();
        const right = trimmed.substring(opIndex + op.length).trim();
        const leftVal = evalInterpolationExpr(left);
        const rightVal = evalInterpolationExpr(right);

        if (op === "&&") return leftVal && rightVal;
        if (op === "||") return leftVal || rightVal;
      }
    }

    const compOps = ["==", "!=", "<=", ">=", "<", ">"];
    for (const op of compOps) {
      const opIndex = trimmed.indexOf(op);
      if (opIndex !== -1) {
        const left = trimmed.substring(0, opIndex).trim();
        const right = trimmed.substring(opIndex + op.length).trim();
        const leftVal = evalInterpolationExpr(left);
        const rightVal = evalInterpolationExpr(right);

        return evalComparison(leftVal, op, rightVal);
      }
    }

    const operators = [
      { op: "*", fn: (a, b) => a * b },
      {
        op: "/",
        fn: (a, b) =>
          b !== 0
            ? a / b
            : (errors.push("Runtime error: Division by zero"), null),
      },
      {
        op: "%",
        fn: (a, b) =>
          b !== 0
            ? a % b
            : (errors.push("Runtime error: Modulo by zero"), null),
      },
      { op: "+", fn: (a, b) => a + b },
      { op: "-", fn: (a, b) => a - b },
    ];

    let result = null;
    let remaining = trimmed;

    const firstMatch = remaining.match(
      /^(-?\d+(\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)/,
    );
    if (!firstMatch) return null;
    result = getValue(firstMatch[0].trim());
    remaining = remaining.substring(firstMatch[0].length).trim();

    while (remaining) {
      const opMatch = remaining.match(
        /^([\+\-\*\/%])\s*(-?\d+(\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)/,
      );
      if (!opMatch) break;

      const op = opMatch[1];
      const nextVal = getValue(opMatch[2].trim());

      if (result === null || nextVal === null) return null;

      const operator = operators.find((o) => o.op === op);
      if (operator) {
        result = operator.fn(result, nextVal);
      }

      remaining = remaining.substring(opMatch[0].length).trim();
    }

    return result;
  }

  function getValue(token) {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      return Number(token);
    }
    if (token === "true") return true;
    if (token === "false") return false;
    const val = getVariable(token);
    return val?.value ?? null;
  }

  function executeBlock(statements, createScope = false) {
    if (createScope) scopes.push({});

    for (const stmt of statements) {
      if (breakFlag || continueFlag) break;
      executeStatement(stmt);
    }

    if (createScope) scopes.pop();
  }

  function executeIf(stmt) {
    const test = evalExpr(stmt.test);

    if (test) {
      executeBlock(stmt.consequent, true);
    } else if (stmt.alternate) {
      if (stmt.alternate.type === "IfStatement") {
        executeIf(stmt.alternate);
      } else {
        executeBlock(stmt.alternate, true);
      }
    }
  }

  function executeStatement(stmt) {
    if (!stmt || breakFlag || continueFlag) return;

    switch (stmt.type) {
      case "VariableDeclaration": {
        const value = stmt.value ? evalExpr(stmt.value) : null;
        const isConst = stmt.kind === "const";
        declareVariable(stmt.name, value, isConst);
        break;
      }

      case "Assignment": {
        const rightValue = evalExpr(stmt.value);
        const current = getVariable(stmt.name);

        if (current === undefined && stmt.operator === "=") {
          declareVariable(stmt.name, rightValue, false);
        } else if (current === undefined) {
          errors.push(
            `Runtime error: Undefined variable '${stmt.name}' in compound assignment`,
          );
          break;
        }

        switch (stmt.operator) {
          case "=":
            setVariable(stmt.name, rightValue);
            break;
          case "+=":
            setVariable(stmt.name, current.value + rightValue);
            break;
          case "-=":
            setVariable(stmt.name, current.value - rightValue);
            break;
          case "*=":
            setVariable(stmt.name, current.value * rightValue);
            break;
          case "/=":
            setVariable(stmt.name, current.value / rightValue);
            break;
          case "%=":
            setVariable(stmt.name, current.value % rightValue);
            break;
        }
        break;
      }

      case "UnaryExpression": {
        const current = getVariable(stmt.name);
        if (current === undefined) {
          errors.push(
            `Runtime error: Undefined variable '${stmt.name}' in unary operation`,
          );
          break;
        }

        const val = current.value;
        if (typeof val !== "number") {
          errors.push(
            `Runtime error: Cannot apply ${stmt.operator} to non-numeric value`,
          );
          break;
        }

        if (stmt.operator === "++") {
          setVariable(stmt.name, val + 1);
        } else if (stmt.operator === "--") {
          setVariable(stmt.name, val - 1);
        }
        break;
      }

      case "PrintStatement": {
        output += interpolate(stmt.value);
        break;
      }

      case "IfStatement": {
        executeIf(stmt);
        break;
      }

      // creating new scope for each iteration of while loop
      case "WhileStatement": {
        while (true) {
          if (breakFlag) {
            breakFlag = false;
            break;
          }
          if (continueFlag) {
            continueFlag = false;
            continue;
          }

          const test = evalExpr(stmt.test);
          if (!test) break;

          executeBlock(stmt.body, true);
        }
        break;
      }

      case "BreakStatement": {
        breakFlag = true;
        break;
      }

      case "ContinueStatement": {
        continueFlag = true;
        break;
      }

      default:
        if (stmt.type) {
          evalExpr(stmt);
        }
    }
  }

  // ast node traversal
  for (const stmt of ast) {
    if (breakFlag) breakFlag = false;
    if (continueFlag) continueFlag = false;
    executeStatement(stmt);
  }

  return { output, errors };
}
