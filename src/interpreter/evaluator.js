// evaluator.js - Beginner Level

export function evaluate(ast) {
  // 1. This is our "RAM" or Memory
  const memory = {};
  let output = "";

  // 2. Loop through every instruction in the AST
  for (const node of ast) {
    switch (node.type) {
      case "VariableDeclaration":
        // Store the variable in memory. If no value, set to null.
        memory[node.name] = node.value;
        break;

      case "Assignment":
        // Update the value of an existing variable
        if (node.name in memory) {
          memory[node.name] = node.value;
        } else {
          return `Error: Variable '${node.name}' is not defined.`;
        }
        break;

      case "PrintStatement":
        let text = node.value;

        // 3. Handle Variable Interpolation ${variableName}
        // This regex looks for ${...} and replaces it with the memory value
        text = text.replace(/\${(.*?)}/g, (match, varName) => {
          if (varName in memory) {
            return memory[varName];
          }
          return `[Undefined: ${varName}]`;
        });

        // 4. Handle escaped newlines \n
        text = text.replace(/\\n/g, "\n");

        output += text;
        break;
    }
  }

  return output;
}
