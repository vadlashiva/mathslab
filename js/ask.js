/* Ask box: reads a typed or pasted question, works out what is being asked, and passes it to the right solver. */
(function () {
  const ML = window.ML;
  const FN = ["asin", "acos", "atan", "acot", "asec", "acosec", "acsc", "sin", "cos", "tan", "cot", "sec", "cosec", "csc", "sqrt", "log", "ln", "exp", "abs", "pi"];
  const TRIG = "asin|acos|atan|acot|asec|acosec|acsc|sin|cos|tan|cot|sec|cosec|csc|log|ln";
  const SUP = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };

  // Turns loosely written maths (sin 2x, e3x, x2, (ax + b)2, √x) into the strict form the solvers read.
  ML.loosen = (text) => {
    let s = String(text).toLowerCase().replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/[“”"]/g, "")
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((c) => SUP[c]).join(""))
      .replace(/√\s*\(/g, "sqrt(").replace(/√\s*(\d*\.?\d*[a-z]?)/g, "sqrt($1)");
    s = s.replace(new RegExp(`(?<![a-z])(sin|cos|tan|cot|sec|cosec|csc)\\s*\\^?\\s*\\(?-1\\)?(?=\\s*[a-z(])`, "g"), "a$1");
    // split run-together letters: xsinx -> x sin x, ax -> a x (known function names are kept whole)
    const parts = new RegExp(`${FN.join("|")}|[a-z]`, "g");
    s = s.replace(/[a-z]+/g, (w) => (FN.includes(w) ? w : w.match(parts).join(" ")));
    s = s.replace(/(?<![a-z])([a-z])\s*\(/g, "$1*(");                                                              // x (1 - x) -> x*(1 - x), not a function call
    s = s.replace(new RegExp(`(?<![a-z])(${TRIG})\\s*\\^?\\s*(\\d)\\s+(?=[a-z(])`, "g"), "$1^$2 ");                       // sec2 x -> sec^2 x
    s = s.replace(new RegExp(`(?<![a-z])(${TRIG})(\\^\\d+)?\\s*(?!\\s*\\()(-?\\d*\\.?\\d*\\s*[a-z](?![a-z])|\\d+\\.?\\d*)`, "g"), (m, f, p, arg) => `${f}(${arg.trim()})${p || ""}`); // sin 2x -> sin(2x)
    s = s.replace(/\be\s*\^?\s*(-?\d*\.?\d*\s?[a-z])\b(?!\s*\()/g, (m, p) => `e^(${p.replace(/\s/g, "")})`);          // e3x, e^3x, ex -> e^(3x)
    s = s.replace(/(?<![a-z^])([a-z])\s?(\d)(?![\d.a-z])/g, "$1^$2");                                              // x2 -> x^2
    s = s.replace(/\)\s?(\d)(?=\s*($|[+\-*/)=,]))/g, ")^$1");                                                      // (ax + b)2 -> (ax + b)^2
    return s.replace(/\s+/g, " ").trim();
  };

  const clean = (s) => String(s).replace(/∫/g, " ").replace(/\b(w\.?\s?r\.?\s?t\.?|with respect to)\s*x\b/gi, " ").replace(/\bd\s?x\s*[.;,]?\s*$/i, " ").replace(/[.;,:?]+\s*$/, "").trim();
  const afterOf = (s) => { const m = s.match(/\b(?:of|for)\b(?:\s+the\s+function)?\s*[:\-]?\s*(.+)$/i); return m ? m[1] : null; };
  const HINTS = [[/probab|bayes|binomial|random variable|\bdie\b|dice|coin/, "probability", "Probability"], [/maximi[sz]e|minimi[sz]e|constraint/, "linear-programming", "Linear Programming"], [/vector|dot product|cross product|projection/, "vectors", "Vector Algebra"],
    [/plane|direction cosine|direction ratio|shortest distance|skew/, "three-d-geometry", "Three Dimensional Geometry"], [/matri|determinant|adjoint|inverse of/, "determinants", "Matrices and Determinants"], [/differential equation|order and degree|dy\/dx\s*[+=]/, "differential-equations", "Differential Equations"],
    [/\barea\b/, "application-of-integrals", "Application of Integrals"], [/relation|one-one|onto|bijective|reflexive/, "relations", "Relations and Functions"], [/continu/, "differentiability", "Continuity and Differentiability"], [/tangent|normal|increasing|decreasing|maxim|minim|rate of/, "application-of-derivatives", "Application of Derivatives"]];

  // { kind, expr, ... } for one question
  ML.readQuestion = (raw, mode) => {
    const text = String(raw).replace(/^\s*(?:\d{1,2}\.|\(\d{1,2}\))\s+/, "").trim(), low = text.toLowerCase().replace(/[−–—]/g, "-");
    if (/maximi[sz]e|minimi[sz]e/.test(low) && /z\s*=/.test(low)) {
      const flat = text.replace(/\n/g, " ").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/[−–—]/g, "-");
      const z = flat.match(/z\s*=\s*([^,;]+?)(?=\s*(,|;|subject|such that|s\.t\.|under|where|$))/i), cons = flat.replace(/^.*?(subject to( the)?( constraints?)?|such that|s\.t\.|constraints?)\s*:?/i, "").match(/[^,;:]*?(<=|>=)[^,;.]*(\.\d+[^,;.]*)*/g) || [];
      const list = cons.map((c) => c.replace(/\band\b/gi, "").trim()).filter(Boolean), nn = list.filter((c) => /^[xy]\s*>=\s*0$/.test(c.replace(/\s+/g, " ")));
      if (z && list.length) return { kind: "lpp", type: /minimi[sz]e/.test(low) ? "min" : "max", Z: z[1].trim(), cons: list.filter((c) => !nn.includes(c)), nn: nn.length >= 2 ? "yes" : "no" };
    }
    const isInt = /∫|\bintegrat|\bintegral|anti\s*-?\s*derivative/.test(low), isDer = /differentiat|derivative|d\/dx|dy\/dx|d2y\/dx2/.test(low);
    if (isInt && !/anti/.test(low) || (isInt && /anti/.test(low))) {
      let body = text, a = null, b = null;
      const lim = body.match(/∫\s*_\s*\{?\s*([^\s^{}_]+)\s*\}?\s*\^\s*\{?\s*([^\s{}]+)\s*\}?/) || body.match(/\bfrom\s+(?:x\s*=\s*)?(\S+)\s+to\s+(?:x\s*=\s*)?([^\s,;]+)/i);
      if (lim) { a = lim[1]; b = lim[2].replace(/[.;,]$/, ""); body = body.replace(lim[0], /∫/.test(lim[0]) ? " ∫ " : " "); }
      const expr = clean(/∫/.test(body) ? body.slice(body.indexOf("∫") + 1) : afterOf(body) || body.replace(/.*?(integrate|integral|anti\s*-?\s*derivative)\w*/i, ""));
      return a != null ? { kind: "definite", expr, a, b } : { kind: "integral", expr };
    }
    if (isDer) {
      const eq = text.match(/\by\s*=\s*(.+)$/i);
      const expr = clean(eq ? eq[1] : afterOf(text) || text.replace(/.*?(differentiate|derivative|d\/dx|dy\/dx)\w*/i, ""));
      return { kind: "derivative", expr, order: /second|twice|d2y\/dx2/.test(low) ? "2" : "1" };
    }
    if (/principal value|^\s*(evaluate|simplify|find the value of)\b/.test(low)) return { kind: "evaluate", expr: clean(afterOf(text) || text.replace(/^\s*(evaluate|simplify|find the value of)/i, "")) };
    const hint = HINTS.find(([re]) => re.test(low));
    if (hint && /[a-z]{4,}\s+[a-z]{3,}\s+[a-z]{2,}/.test(low)) return { kind: "hint", chapter: hint[1], title: hint[2] };
    return { kind: mode || "unknown", expr: clean(text), order: "1" };
  };

  // splits pasted text into questions; a line like "Find the following integrals:" sets the task for the lines after it
  ML.splitQuestions = (text) => {
    const out = []; let mode = null;
    if (/maximi[sz]e|minimi[sz]e/i.test(text) && /z\s*=/i.test(text)) return [{ text, mode: null }];
    String(text).split(/\n+/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
      if (/following|exercises?\s+\d/i.test(line) && !/[=∫^]/.test(line)) { mode = /integra|anti/i.test(line) ? "integral" : /differentiat|derivative/i.test(line) ? "derivative" : mode; return; }
      line.split(/\s+(?=(?:\d{1,2}\.|\(\d{1,2}\))\s+\S)/).forEach((q) => { if (q.replace(/^(?:\d{1,2}\.|\(\d{1,2}\))\s*/, "").trim()) out.push({ text: q, mode }); });
    });
    return out.slice(0, 12);
  };

  const tool = (ch, id) => ML.chapters.find((c) => c.id === ch).tools.find((t) => t.id === id);
  // solves one question into a fresh output block
  ML.answerQuestion = (q) => {
    const o = new ML.Out(), r = ML.readQuestion(q.text, q.mode);
    if (r.kind === "hint") { o.p(`This looks like a question from <b>${r.title}</b>. Word problems are not read automatically: <a href="#/${r.chapter}">open the ${r.title} solvers</a> and enter the numbers there.`); return o; }
    if (r.kind === "lpp") { o.p("<b>Read as</b> a linear programming problem."); tool("linear-programming", "graphical").solve({ type: r.type, Z: ML.loosen(r.Z), cons: r.cons.map(ML.loosen).join("\n"), nn: r.nn }, o); return o; }
    if (!r.expr) throw new Error("I could not find the maths in this question. Type the function, for example: integrate x^2 * e^x");
    const e = ML.loosen(r.expr), shown = (() => { try { return ML.tex(e); } catch (x) { throw new Error(`I read the maths as "${e}" and could not understand it. Type powers with ^ and fractions with / and brackets, for example (x^3 + 5x^2 - 4)/x^2.`); } })();
    if (r.kind === "integral") { o.p(`<b>Read as:</b> integrate $${shown}$ with respect to $x$`); tool("integrals", "indefinite").solve({ f: e }, o); }
    else if (r.kind === "definite") { o.p(`<b>Read as:</b> integrate $${shown}$ from $${ML.tex(ML.loosen(r.a))}$ to $${ML.tex(ML.loosen(r.b))}$`); tool("integrals", "definite").solve({ f: e, a: ML.loosen(r.a), b: ML.loosen(r.b) }, o); }
    else if (r.kind === "derivative") { o.p(`<b>Read as:</b> differentiate $${shown}$ with respect to $x$`); tool("differentiability", "derivative").solve({ f: e, order: r.order }, o); }
    else if (r.kind === "evaluate") { o.p(`<b>Read as:</b> find the value of $${shown}$`); tool("inverse-trig", "evaluate").solve({ e }, o); }
    else {
      o.p(`<b>Read as:</b> $${shown}$`);
      let isNumber = false; try { isNumber = typeof ML.parse(e).compile().evaluate({}) === "number"; } catch (x) { /* has a variable */ }
      if (isNumber) tool("inverse-trig", "evaluate").solve({ e }, o);
      else { o.p("What should I do with this?"); const d = o.add("actions", ""); [["Integrate it", "integral"], ["Differentiate it", "derivative"]].forEach(([label, mode]) => { const b = document.createElement("button"); b.className = "btn ghost"; b.type = "button"; b.textContent = label; b.addEventListener("click", () => { const n = ML.answerQuestion({ text: q.text, mode }); o.el.replaceWith(n.el); ML.pending.splice(0).forEach((fn) => fn()); }); d.appendChild(b); }); }
    }
    return o;
  };
})();
