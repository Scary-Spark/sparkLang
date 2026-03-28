export function analyze(ast) {
  const errors = [];
  const scopes = [{}];
  const tableSnapshots = [];
  let loopDepth = 0;

  function snapshot(action, nodeName) {
    tableSnapshots.push({
      action,
      nodeName,
      scopes: JSON.parse(JSON.stringify(scopes)),
    });
  }

  function declareVariable(name, kind, type) {
    const currentScope = scopes[scopes.length - 1];

    if (currentScope[name]) {
      errors.push(`Variable '${name}' already declared in this scope.`);
    } else {
      currentScope[name] = { kind, type };
      snapshot("declare", name);
    }
  }

  function lookupVariable(name) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i][name]) return scopes[i][name];
    }
    return null;
  }

  function checkNode(node) {
    switch (node.type) {
      case "VariableDeclaration":
        const type = inferType(node.value);
        declareVariable(node.name, node.kind, type);
        if (node.kind === "const" && !node.value) {
          errors.push(`Const '${node.name}' must be initialized.`);
        }
        break;

      case "PrintStatement":
        const matches = node.value.match(/\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varName = match.slice(2, -1);
            const info = lookupVariable(varName);
            if (!info) {
              errors.push(
                `Variable '${varName}' used in print but not declared.`,
              );
            }
          });
        }
        break;

      case "Assignment":
        const info = lookupVariable(node.name);
        if (!info) {
          errors.push(`Variable '${node.name}' not declared.`);
        } else if (info.kind === "const") {
          errors.push(`Cannot reassign constant '${node.name}'.`);
        }
        break;

      case "BinaryExpression":
        checkBinary(node);
        break;

      case "ComparisonExpression":
        checkComparison(node);
        break;

      case "IfStatement":
        if (!isBooleanExpr(node.test)) {
          errors.push("Condition in 'if' must be boolean.");
        }
        scopes.push({});
        node.consequent.forEach(checkNode);
        scopes.pop();
        if (node.alternate) {
          if (Array.isArray(node.alternate)) {
            scopes.push({});
            node.alternate.forEach(checkNode);
            scopes.pop();
          } else {
            checkNode(node.alternate);
          }
        }
        break;

      case "WhileStatement":
        if (!isBooleanExpr(node.test)) {
          errors.push("Condition in 'while' must be boolean.");
        }
        loopDepth++;
        scopes.push({});
        node.body.forEach(checkNode);
        scopes.pop();
        loopDepth--;
        break;

      case "BreakStatement":
      case "ContinueStatement":
        if (loopDepth === 0) {
          errors.push(
            `'${node.type.replace("Statement", "").toLowerCase()}' used outside of loop.`,
          );
        }
        break;
    }
  }

  // ✅ FIXED: Added LogicalExpression handling
  function inferType(expr) {
    if (!expr) return "UNKNOWN";
    if (expr.valueType) return expr.valueType;
    if (expr.type === "BinaryExpression") return "NUMBER";
    if (expr.type === "ComparisonExpression") return "BOOLEAN";

    // ✅ NEW: Logical operators always return BOOLEAN
    if (expr.type === "LogicalExpression") return "BOOLEAN";

    if (typeof expr === "string") {
      const info = lookupVariable(expr);
      return info ? info.type : "UNKNOWN";
    }

    return "UNKNOWN";
  }

  function isBooleanExpr(expr) {
    return inferType(expr) === "BOOLEAN";
  }

  function checkBinary(node) {
    const leftType = node.leftType;
    const rightType = node.rightType;

    if (["+", "-", "*", "/", "%"].includes(node.operator)) {
      if (leftType !== "NUMBER" || rightType !== "NUMBER") {
        errors.push(`Operator '${node.operator}' requires numeric operands.`);
      }
    }
  }

  function checkComparison(node) {
    const leftType = inferType(node.left);
    const rightType = inferType(node.right);

    if (leftType !== rightType) {
      errors.push(`Comparison '${node.operator}' between incompatible types.`);
    }
  }

  ast.forEach(checkNode);
  return { errors, tableSnapshots };
}
