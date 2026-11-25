/* Bedrockscript Interpreter v0.1.0
 * Load as a browser script; exposes window.Bedrockscript.
 * Bedrockscript is a playful JavaScript-inspired language.
 */
(function (global) {
  "use strict";

  const VERSION = "0.1.0";

  function unquote(s) {
    s = s.trim();
    if ((s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))) {
      try { return JSON.parse('"' + s.slice(1,-1).replace(/"/g,'\\"') + '"'); }
      catch (_) { return s.slice(1,-1); }
    }
    return s;
  }

  function evaluateExpression(expr, vars, output) {
    expr = expr.trim();
    if (Object.prototype.hasOwnProperty.call(vars, expr)) return vars[expr];
    if (/^(['"]).*\1$/.test(expr)) return unquote(expr);
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    // Small, intentionally limited expression support for arithmetic / JS-like expressions.
    const names = Object.keys(vars);
    try {
      const fn = new Function(...names, `"use strict"; return (${expr});`);
      return fn(...names.map(n => vars[n]));
    } catch (e) {
      throw new Error("Could not evaluate expression: " + expr + " (" + e.message + ")");
    }
  }

  function run(source, options = {}) {
    const output = [];
    const vars = Object.assign(Object.create(null), options.variables || {});
    const lines = String(source).replace(/\r/g,"").split("\n");
    let index = 0;

    function executeBlock(stopAtEnd) {
      while (index < lines.length) {
        let line = lines[index++].trim();
        if (!line || line.startsWith("//") || line.startsWith("#")) continue;
        if (line === "end") {
          if (stopAtEnd) return;
          throw new Error("Unexpected 'end' at line " + index);
        }

        // 25% Bedrockscript-flavored commands
        if (line.startsWith("say ")) {
          output.push(String(evaluateExpression(line.slice(4), vars, output)));
          continue;
        }
        if (line.startsWith("set ")) {
          const m = line.match(/^set\s+([A-Za-z_$][\w$]*)\s*=\s*(.+)$/);
          if (!m) throw new Error("Use: set variable = expression (line " + index + ")");
          vars[m[1]] = evaluateExpression(m[2], vars, output);
          continue;
        }
        if (line.startsWith("command ")) {
          const rest = line.slice(8).trim();
          const split = rest.indexOf(" ");
          const cmd = split < 0 ? rest : rest.slice(0, split);
          const arg = split < 0 ? "" : unquote(rest.slice(split + 1));
          if (cmd === "title") output.push("[TITLE] " + arg);
          else if (cmd === "sound") output.push("[SOUND] " + arg);
          else if (cmd === "clear") output.length = 0;
          else if (cmd === "help") output.push("Commands: say, set, command title/sound/clear/help, repeat, if");
          else throw new Error("Unknown Bedrock command: " + cmd);
          continue;
        }
        const repeat = line.match(/^repeat\s+(.+)\s+times$/);
        if (repeat) {
          const count = Math.max(0, Math.min(1000, Number(evaluateExpression(repeat[1], vars, output)) || 0));
          const blockStart = index;
          let depth = 1, end = blockStart;
          while (end < lines.length && depth) {
            const t = lines[end].trim();
            if (/^repeat\s+.+\s+times$/.test(t) || /^if\s+.+\s+then$/.test(t)) depth++;
            if (t === "end") depth--;
            end++;
          }
          if (depth) throw new Error("Missing 'end' for repeat block");
          const body = lines.slice(blockStart, end - 1).join("\n");
          index = end;
          for (let n = 0; n < count; n++) executeSource(body, vars, output);
          continue;
        }
        const conditional = line.match(/^if\s+(.+)\s+then$/);
        if (conditional) {
          const blockStart = index;
          let depth = 1, end = blockStart;
          while (end < lines.length && depth) {
            const t = lines[end].trim();
            if (/^repeat\s+.+\s+times$/.test(t) || /^if\s+.+\s+then$/.test(t)) depth++;
            if (t === "end") depth--;
            end++;
          }
          if (depth) throw new Error("Missing 'end' for if block");
          const body = lines.slice(blockStart, end - 1).join("\n");
          index = end;
          if (evaluateExpression(conditional[1], vars, output)) executeSource(body, vars, output);
          continue;
        }

        // JavaScript-inspired subset: variable declarations and console.log.
        let js = line.replace(/^(let|const|var)\s+/, "set ");
        const declaration = js.match(/^set\s+([A-Za-z_$][\w$]*)\s*=\s*(.+);?$/);
        if (declaration) {
          vars[declaration[1]] = evaluateExpression(declaration[2].replace(/;$/,""), vars, output);
          continue;
        }
        const log = line.match(/^console\.log\((.*)\);?$/);
        if (log) {
          output.push(String(evaluateExpression(log[1].replace(/;$/,""), vars, output)));
          continue;
        }
        if (line === "bedrock.help();") {
          output.push("Bedrockscript " + VERSION + " — say / set / command / repeat / if");
          continue;
        }
        throw new Error("Unknown syntax at line " + index + ": " + line);
      }
      if (stopAtEnd) throw new Error("Missing 'end'");
    }

    function executeSource(src, sharedVars, sharedOutput) {
      const result = run(src, {variables: sharedVars});
      Object.assign(sharedVars, result.variables);
      sharedOutput.push(...result.output);
    }

    executeBlock(false);
    return { output, variables: vars, version: VERSION };
  }

  global.Bedrockscript = {
    version: VERSION,
    run(source, options) { return run(source, options); },
    execute(source, target) {
      const result = run(source);
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) el.textContent = result.output.join("\n");
      return result;
    }
  };
})(window);
