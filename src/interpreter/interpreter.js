import { lexer } from "./lexer.js";
import { parse } from "./parser.js";
import { evaluate } from "./evaluator.js"; // Import the new evaluator

const debuggingMode = true;

export function runInterpreter(code) {
  let result = "";

  const { tokens, errors: lexErrors } = lexer(code);
  const { ast, errors: parseErrors } = parse(tokens);

  if (debuggingMode) {
    result += "============== Tokenization ==============\n";
    tokens.forEach(
      (t) =>
        (result += `<${t.type.toUpperCase()}, ${t.value}, line ${t.line}>\n`),
    );
    result += "\n============== AST ==============\n";
    result += JSON.stringify(ast, null, 2) + "\n";
  }

  // Check for Lexer or Parser errors
  const allErrors = [...lexErrors, ...parseErrors];
  if (allErrors.length > 0) {
    result += "\n============== Errors ==============\n";
    allErrors.forEach((err) => (result += err + "\n"));
    return result;
  }

  // 5. RUN THE EXECUTION
  const executionOutput = evaluate(ast);

  result += "\n============== Execution Output ==============\n";
  result += executionOutput;

  return result;
}
