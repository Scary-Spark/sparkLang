import { runInterpreter } from "../interpreter/interpreter.js";

export function runSpark(req, res) {
  const code = req.body.code;

  if (!code) {
    return res.json({ output: "No code received." });
  }

  try {
    const result = runInterpreter(code);
    res.json({ output: result });
  } catch (err) {
    res.json({ output: "Error: " + err.message });
  }
}
