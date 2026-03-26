const reservedKeyWords = [
  "input",
  "read",
  "const",
  "printn",
  "print",
  "if",
  "elif",
  "else",
  "switch",
  "case",
  "break",
  "continue",
  "function",
  "return",
  "for",
  "while",
  "true",
  "false",
];

const reservedSymbols = [";", ",", "(", ")", "{", "}", "[", "]"];

const reservedOperator = [
  "==",
  "!=",
  "<=",
  ">=",
  "++",
  "--",
  "+",
  "-",
  "*",
  "/",
  "%",
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "<",
  ">",
];

export function lexer(code) {
  const tokens = [];
  const errors = [];

  let cursor = 0;
  let line = 1;

  const isLetter = (c) => /[a-zA-Z_]/.test(c);
  const isDigit = (c) => /[0-9]/.test(c);
  const isWhitespace = (c) => /\s/.test(c);

  function addToken(type, value) {
    if (value.length > 0) {
      tokens.push({ type, value, line });
    }
  }

  function addError(msg) {
    errors.push(`Line ${line}: ${msg}`);
  }

  while (cursor < code.length) {
    let char = code[cursor];

    // handle whitespace
    if (isWhitespace(char)) {
      if (char === "\n") line++;
      cursor++;
      continue;
    }

    // handle single-line comment
    if (char === "/" && code[cursor + 1] === "/") {
      cursor += 2;
      while (cursor < code.length && code[cursor] !== "\n") cursor++;
      continue;
    }

    // handle multi-line comment
    if (char === "/" && code[cursor + 1] === "*") {
      cursor += 2;
      let closed = false;
      while (cursor < code.length) {
        if (code[cursor] === "*" && code[cursor + 1] === "/") {
          cursor += 2;
          closed = true;
          break;
        }
        if (code[cursor] === "\n") line++;
        cursor++;
      }
      if (!closed) addError("Unterminated multi-line comment");
      continue;
    }

    // handle strings
    if (char === '"') {
      let value = "";
      cursor++;
      let closed = false;
      while (cursor < code.length) {
        if (code[cursor] === '"') {
          closed = true;
          cursor++;
          break;
        }
        if (code[cursor] === "\n") {
          addError("Unterminated string");
          line++;
          break;
        }
        value += code[cursor];
        cursor++;
      }
      if (closed) addToken("STRING", value);
      continue;
    }

    // handle numbers
    if (isDigit(char)) {
      let value = "";
      let dotCount = 0;
      while (
        cursor < code.length &&
        (isDigit(code[cursor]) || code[cursor] === ".")
      ) {
        if (code[cursor] === ".") dotCount++;
        value += code[cursor];
        cursor++;
      }
      if (dotCount > 1) addError("Invalid number format");
      else addToken("NUMBER", value);
      continue;
    }

    // handle identifiers and keywords
    if (isLetter(char)) {
      let value = "";
      while (
        cursor < code.length &&
        (isLetter(code[cursor]) || isDigit(code[cursor]))
      ) {
        value += code[cursor];
        cursor++;
      }
      if (reservedKeyWords.includes(value)) addToken("KEYWORD", value);
      else addToken("IDENTIFIER", value);
      continue;
    }

    // handle two-character operators (==, !=, +=, etc.)
    if (cursor + 1 < code.length) {
      let twoChar = code.substring(cursor, cursor + 2);
      if (reservedOperator.includes(twoChar)) {
        addToken("OPERATOR", twoChar);
        cursor += 2;
        continue;
      }
    }

    // handle single-character operators
    if (reservedOperator.includes(char)) {
      addToken("OPERATOR", char);
      cursor++;
      continue;
    }

    // handle symbols
    if (reservedSymbols.includes(char)) {
      addToken("SYMBOL", char);
      cursor++;
      continue;
    }

    // handle unknown character
    addError(`Unexpected character '${char}'`);
    cursor++;
  }

  return { tokens, errors };
}
