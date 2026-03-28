import { lexer } from "./lexer.js";
import { parse } from "./parser.js";
import { analyze } from "./analyzer.js";
import { evaluate } from "./evaluator.js";

export function runInterpreter(code, debuggingMode = false) {
  let result = "";

  const { tokens, errors: lexErrors } = lexer(code);
  const { ast, errors: parseErrors } = parse(tokens);
  const { errors: semanticErrors, tableSnapshots } = analyze(ast);

  if (debuggingMode) {
    result += "============== Tokenization ==============\n";
    tokens.forEach(
      (t) =>
        (result += `<${t.type.toUpperCase()}, ${t.value}, line ${t.line}>\n`),
    );
    result += "\n============== AST ==============\n";
    result += JSON.stringify(ast, null, 2) + "\n";

    result += "\n============== Symbol Table History ==============\n";
    if (tableSnapshots && tableSnapshots.length > 0) {
      tableSnapshots.forEach((snap, index) => {
        result += `Step ${index + 1}: [${snap.action}] ${snap.nodeName || ""}\n`;
        result += JSON.stringify(snap.scopes, null, 2) + "\n";
        result += "-----------------------------------\n";
      });
    } else {
      result += "No symbols recorded.\n";
    }
  }

  const allErrors = [...lexErrors, ...parseErrors, ...semanticErrors];
  if (allErrors.length > 0) {
    result += "\n============== Errors ==============\n";
    allErrors.forEach((err) => (result += err + "\n"));
    return result;
  }

  const { output, errors: runtimeErrors } = evaluate(ast);

  result += "\n============== Execution Output ==============\n";
  result += output || "No output.\n";

  if (runtimeErrors.length > 0) {
    result += "\n============== Runtime Errors ==============\n";
    runtimeErrors.forEach((err) => (result += err + "\n"));
  }

  return result;
}
