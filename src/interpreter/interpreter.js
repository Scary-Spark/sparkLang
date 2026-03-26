import { lexer } from "./lexer.js";

const debuggingMode = true;
export function runInterpreter(code) {
  const { tokens, errors } = lexer(code);
  let output = "";

  if (debuggingMode) {
    output += "============== Tokenization ==============\n";
    tokens.forEach((t) => {
      output += `<${t.type.toUpperCase()}, ${t.value}, line ${t.line}>\n`;
    });
  }

  // Add errors if any
  if (errors.length > 0) {
    output += "\n============== Errors ==============\n";
    errors.forEach((err) => {
      output += err + "\n";
    });
  }

  return output;
}
