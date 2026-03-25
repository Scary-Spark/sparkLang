import { lexer } from "./lexer.js";
import { parser } from "./parser.js";

export function runInterpreter(code) {
  const tokens = lexer(code);
  const ast = parser(tokens);

  let output = "";

  for (let i = 0; i < ast.length; i++) {
    if (ast[i] === "print") {
      output += ast[i + 1].replace(/"/g, "") + "\n";
      i++;
    }
  }

  return output;
}
