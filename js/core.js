/* MathsLab core: parsing, formatting, exact fractions, calculus helpers, plotting, step output. */
(function () {
  const math = window.math, nerdamer = window.nerdamer, katex = window.katex;
  const ML = (window.ML = { chapters: [] });
  const PI = Math.PI;

  // Principal values as defined in the II PUC textbook (cot^-1 has range (0, pi)).
  math.import({
    acot: (x) => (x > 0 ? Math.atan(1 / x) : x < 0 ? PI + Math.atan(1 / x) : PI / 2),
    asec: (x) => Math.acos(1 / x),
    acsc: (x) => Math.asin(1 / x),
  }, { override: true });

  /* ---------- parsing ---------- */
  // moves a power written as sin^2(x) to sin(x)^2
  function fixFnPowers(s) {
    const re = /\b(sin|cos|tan|cot|sec|csc|log)\^(\d+)\(/;
    let m;
    while ((m = re.exec(s))) {
      let i = m.index + m[0].length, depth = 1;
      while (i < s.length && depth) { if (s[i] === "(") depth++; else if (s[i] === ")") depth--; i++; }
      s = s.slice(0, m.index) + `(${m[1]}(` + s.slice(m.index + m[0].length, i) + `^${m[2]})` + s.slice(i);
    }
    return s;
  }
  ML.norm = (s) => fixFnPowers(String(s).trim()
    .replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3")
    .replace(/\bln\b/g, "log").replace(/\bcosec\b/g, "csc")
    .replace(/\barc(sin|cos|tan|cot|sec|csc)\b/g, "a$1")
    .replace(/\b(sin|cos|tan|cot|sec|csc)\^\(?-1\)?/g, "a$1")
    .replace(/\b(sin|cos|tan|cot|sec|csc)inv\b/g, "a$1"));
  ML.parse = (s) => {
    if (s == null || String(s).trim() === "") throw new Error("Please fill in every box.");
    let node;
    try { node = math.parse(ML.norm(s)); } catch (e) { throw new Error(`I could not read "${s}". Check the brackets and use * for multiplication, e.g. 2*x*sin(x).`); }
    node.traverse((n, path, parent) => { if (n.isSymbolNode && FNAMES.includes(n.name) && !(parent && parent.isFunctionNode && path === "fn")) throw new Error(`Please put brackets after ${n.name}, for example ${n.name}(x) or ${n.name}(2*x).`); });
    return node;
  };
  const FNAMES = ["sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos", "atan", "acot", "asec", "acsc", "log", "sqrt", "exp", "abs"];
  // a * -3 is shown as -(3a), so a trailing negative factor cannot be misread as a subtraction
  const tidy = (node) => node.transform((n) => {
    if (!(n.isOperatorNode && n.fn === "multiply" && n.args.length === 2)) return n;
    let b = n.args[1], v = null;
    if (b.isConstantNode && typeof b.value === "number" && b.value < 0) v = -b.value;
    else if (b.isOperatorNode && b.fn === "unaryMinus" && b.args[0].isConstantNode) v = b.args[0].value;
    if (v == null) return n;
    const body = v === 1 ? n.args[0] : new math.OperatorNode("*", "multiply", [new math.ConstantNode(v), n.args[0]]);
    return new math.OperatorNode("-", "unaryMinus", [body]);
  });
  const texOpts = {
    parenthesis: "auto",
    handler: (node, options) => {
      if (node.type === "FunctionNode" && node.fn && node.fn.name === "exp" && node.args.length === 1) return `e^{${node.args[0].toTex(options)}}`;
      return undefined;
    },
  };
  ML.tex = (x) => tidy(typeof x === "string" ? ML.parse(x) : x).toTex(texOpts).replace(/~/g, "\\,").replace(/\\cdot/g, "\\,").replace(/\+\s*-/g, "-");
  // simplify, then turn decimals the simplifier produced (0.6931..., 1.7320...) back into log(2), sqrt(3), pi/2
  const exactConst = (n) => n.transform((k) => {
    if (!k.isConstantNode || typeof k.value !== "number" || fracApprox(k.value, 1000)) return k;
    const v = k.value, e = Math.exp(v);
    if (v > 0 && e < 200 && Math.abs(e - Math.round(e)) < 1e-9) return math.parse(`log(${Math.round(e)})`);
    const q = fracApprox(v / PI, 24); if (q) return math.parse(q[1] === 1 ? `${q[0]}*pi` : `${q[0]}*pi/${q[1]}`);
    const r = fracApprox(v * v, 64); if (r && r[0] > 0) return math.parse(`${v < 0 ? "-" : ""}sqrt(${r[1] === 1 ? r[0] : `${r[0]}/${r[1]}`})`);
    return k;
  });
  ML.simp = (x) => { const n = typeof x === "string" ? ML.parse(x) : x; try { return exactConst(math.simplify(n)); } catch (e) { return n; } };
  ML.fn = (x, v = "x") => {
    const c = (typeof x === "string" ? ML.parse(x) : x).compile();
    return (val) => { try { const r = c.evaluate({ [v]: val }); return typeof r === "number" ? r : NaN; } catch (e) { return NaN; } };
  };
  ML.fn2 = (x) => { const c = (typeof x === "string" ? ML.parse(x) : x).compile(); return (xv, yv) => { try { const r = c.evaluate({ x: xv, y: yv }); return typeof r === "number" ? r : NaN; } catch (e) { return NaN; } }; };
  ML.val = (s) => { const r = ML.parse(s).compile().evaluate({}); if (typeof r !== "number" || !isFinite(r)) throw new Error(`"${s}" is not a number I can use here.`); return r; };

  /* ---------- number formatting ---------- */
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  function fracApprox(v, maxDen) { for (let d = 1; d <= maxDen; d++) { const n = Math.round(v * d); if (Math.abs(v - n / d) < 1e-9 * Math.max(1, Math.abs(v))) return [n, d]; } return null; }
  const fr = (n, d) => (d === 1 ? `${n}` : `${n < 0 ? "-" : ""}\\dfrac{${Math.abs(n)}}{${d}}`);
  ML.dec = (v) => { if (!isFinite(v)) return String(v); const a = Math.abs(v); if (a !== 0 && (a >= 1e7 || a < 1e-4)) return v.toPrecision(5); return String(+v.toFixed(4)); };
  // Exact-looking TeX for a number: integer, fraction, multiple of pi, surd, else 4-decimal value.
  ML.nice = (v) => {
    if (typeof v !== "number" || isNaN(v)) return "\\text{not defined}";
    if (!isFinite(v)) return v > 0 ? "\\infty" : "-\\infty";
    if (Math.abs(v) < 1e-11) return "0";
    let r = fracApprox(v, 1000); if (r) return fr(r[0], r[1]);
    r = fracApprox(v / PI, 24);
    if (r) { const [n, d] = r, a = Math.abs(n), top = a === 1 ? "\\pi" : `${a}\\pi`; return (n < 0 ? "-" : "") + (d === 1 ? top : `\\dfrac{${top}}{${d}}`); }
    r = fracApprox(v * v, 64);
    if (r && r[0] > 0 && r[0] * r[1] < 50000) {
      let m = r[0] * r[1], k = 1, d = r[1];
      for (let i = Math.floor(Math.sqrt(m)); i > 1; i--) if (m % (i * i) === 0) { k = i; m /= i * i; break; }
      const g = gcd(k, d); k /= g; d /= g;
      const top = (k === 1 ? "" : k) + `\\sqrt{${m}}`;
      return (v < 0 ? "-" : "") + (d === 1 ? top : `\\dfrac{${top}}{${d}}`);
    }
    return ML.dec(v);
  };
  ML.approx = (v) => { const t = ML.nice(v); return t === ML.dec(v) || /^-?\d+$/.test(t) ? t : `${t} \\approx ${ML.dec(v)}`; };

  /* ---------- exact fractions and matrices ---------- */
  ML.F = (s) => {
    const t = String(s).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(\/\d+)?$/.test(t)) throw new Error(`"${s}" should be a whole number, a fraction like 3/4 or a decimal.`);
    return math.fraction(t);
  };
  ML.fadd = (a, b) => math.add(a, b); ML.fsub = (a, b) => math.subtract(a, b); ML.fmul = (a, b) => math.multiply(a, b); ML.fdiv = (a, b) => math.divide(a, b);
  ML.fzero = (a) => Number(a.valueOf()) === 0;
  ML.fnum = (a) => Number(a.valueOf());
  ML.ftex = (a) => { const [n, d] = a.toFraction().split("/"); return d ? `${n.startsWith("-") ? "-" : ""}\\dfrac{${n.replace("-", "")}}{${d}}` : n; };
  ML.fpar = (a) => (ML.fnum(a) < 0 ? `(${ML.ftex(a)})` : ML.ftex(a));
  ML.Z = () => math.fraction(0);
  ML.parseMatrix = (text, name = "The matrix") => {
    const rows = String(text).trim().split(/[\n;]+/).map((r) => r.trim()).filter(Boolean).map((r) => r.split(/[\s,]+/).filter(Boolean).map(ML.F));
    if (!rows.length) throw new Error(`${name} is empty.`);
    if (rows.some((r) => r.length !== rows[0].length)) throw new Error(`${name}: every row must have the same number of entries.`);
    return rows;
  };
  ML.parseVec = (text, name = "The vector") => {
    const p = String(text).trim().replace(/[()<>\[\]]/g, "").split(/[\s,]+/).filter(Boolean).map(ML.F);
    if (p.length !== 3) throw new Error(`${name} needs three components, e.g. 2, -1, 3.`);
    return p;
  };
  ML.mtex = (M, kind = "bmatrix") => `\\begin{${kind}}${M.map((r) => r.map((x) => (typeof x === "string" ? x : ML.ftex(x))).join(" & ")).join(" \\\\[2pt] ")}\\end{${kind}}`;
  ML.T = (M) => M[0].map((_, j) => M.map((r) => r[j]));
  ML.mmul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => ML.fadd(s, ML.fmul(x, B[k][j])), ML.Z())));
  ML.minor = (M, i, j) => M.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j));
  ML.det = (M) => {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return ML.fsub(ML.fmul(M[0][0], M[1][1]), ML.fmul(M[0][1], M[1][0]));
    return M[0].reduce((s, x, j) => ML.fadd(s, ML.fmul(ML.fmul(x, math.fraction(j % 2 ? -1 : 1)), ML.det(ML.minor(M, 0, j)))), ML.Z());
  };
  ML.cofactors = (M) => M.map((r, i) => r.map((_, j) => ML.fmul(math.fraction((i + j) % 2 ? -1 : 1), M.length === 1 ? math.fraction(1) : ML.det(ML.minor(M, i, j)))));
  // vector as "ai + bj + ck"
  ML.vtex = (v) => {
    const names = ["\\hat{i}", "\\hat{j}", "\\hat{k}"]; let s = "";
    v.forEach((c, i) => {
      const x = typeof c === "number" ? c : ML.fnum(c); if (Math.abs(x) < 1e-12) return;
      const mag = typeof c === "number" ? ML.nice(Math.abs(c)) : ML.ftex(math.abs(c));
      s += (x < 0 ? (s ? " - " : "-") : s ? " + " : "") + (mag === "1" ? "" : mag) + names[i];
    });
    return s || "\\vec{0}";
  };

  /* ---------- calculus ---------- */
  ML.d = (x, v = "x") => math.derivative(typeof x === "string" ? ML.parse(x) : x, v);

  // Derivative with the rule used at each stage.
  ML.diff = function (expr, v = "x") {
    const steps = [], node = typeof expr === "string" ? ML.parse(expr) : expr;
    const dep = (n) => n.filter((k) => k.isSymbolNode && k.name === v).length > 0;
    const P = (s) => `(${s})`, tx = (n) => ML.tex(n), dx = `\\dfrac{d}{d${v}}`;
    const OUT = {
      sin: ["cos(U)", "\\sin u", "\\cos u"], cos: ["-sin(U)", "\\cos u", "-\\sin u"], tan: ["sec(U)^2", "\\tan u", "\\sec^2 u"],
      cot: ["-csc(U)^2", "\\cot u", "-\\csc^2 u"], sec: ["sec(U)*tan(U)", "\\sec u", "\\sec u\\tan u"], csc: ["-csc(U)*cot(U)", "\\csc u", "-\\csc u\\cot u"],
      asin: ["1/sqrt(1-(U)^2)", "\\sin^{-1}u", "\\dfrac{1}{\\sqrt{1-u^2}}"], acos: ["-1/sqrt(1-(U)^2)", "\\cos^{-1}u", "-\\dfrac{1}{\\sqrt{1-u^2}}"],
      atan: ["1/(1+(U)^2)", "\\tan^{-1}u", "\\dfrac{1}{1+u^2}"], acot: ["-1/(1+(U)^2)", "\\cot^{-1}u", "-\\dfrac{1}{1+u^2}"],
      asec: ["1/(abs(U)*sqrt((U)^2-1))", "\\sec^{-1}u", "\\dfrac{1}{|u|\\sqrt{u^2-1}}"], acsc: ["-1/(abs(U)*sqrt((U)^2-1))", "\\csc^{-1}u", "-\\dfrac{1}{|u|\\sqrt{u^2-1}}"],
      exp: ["exp(U)", "e^{u}", "e^{u}"], log: ["1/(U)", "\\ln u", "\\dfrac{1}{u}"], sqrt: ["1/(2*sqrt(U))", "\\sqrt{u}", "\\dfrac{1}{2\\sqrt{u}}"],
    };
    function D(n) {
      if (n.isParenthesisNode) return D(n.content);
      if (!dep(n)) return "0";
      if (n.isSymbolNode) return "1";
      const s = n.toString();
      if (n.isOperatorNode) {
        const [a, b] = n.args;
        if (n.fn === "unaryMinus") return `-${P(D(a))}`;
        if (n.fn === "unaryPlus") return D(a);
        if (n.fn === "add" || n.fn === "subtract") return `${P(D(a))} ${n.op} ${P(D(b))}`;
        if (n.fn === "multiply") {
          if (!dep(a)) return `${P(a)} * ${P(D(b))}`;
          if (!dep(b)) return `${P(b)} * ${P(D(a))}`;
          steps.push({ rule: "Product rule", tex: `${dx}\\left[u\\,v\\right] = u\\,v' + v\\,u', \\quad u = ${tx(a)},\\; v = ${tx(b)}` });
          return `${P(a)} * ${P(D(b))} + ${P(b)} * ${P(D(a))}`;
        }
        if (n.fn === "divide") {
          if (!dep(b)) return `${P(D(a))} / ${P(b)}`;
          steps.push({ rule: "Quotient rule", tex: `${dx}\\left[\\dfrac{u}{v}\\right] = \\dfrac{v\\,u' - u\\,v'}{v^2}, \\quad u = ${tx(a)},\\; v = ${tx(b)}` });
          return `(${P(b)} * ${P(D(a))} - ${P(a)} * ${P(D(b))}) / ${P(b)}^2`;
        }
        if (n.fn === "pow") {
          const inner = a.isParenthesisNode ? a.content : a;
          if (!dep(b)) {
            if (inner.isSymbolNode) { steps.push({ rule: "Power rule", tex: `${dx}\\left[${v}^n\\right] = n\\,${v}^{n-1}, \\quad n = ${tx(b)}` }); return `${P(b)} * ${P(a)}^(${b} - 1)`; }
            steps.push({ rule: "Power rule with chain rule", tex: `${dx}\\left[u^n\\right] = n\\,u^{n-1}\\,u', \\quad u = ${tx(inner)},\\; n = ${tx(b)}` });
            return `${P(b)} * ${P(a)}^(${b} - 1) * ${P(D(a))}`;
          }
          if (!dep(a)) {
            const isE = inner.isSymbolNode && inner.name === "e";
            steps.push({ rule: "Exponential rule", tex: isE ? `${dx}\\left[e^{u}\\right] = e^{u}\\,u', \\quad u = ${tx(b)}` : `${dx}\\left[a^{u}\\right] = a^{u}\\ln a\\;u', \\quad a = ${tx(a)},\\; u = ${tx(b)}` });
            return isE ? `${P(s)} * ${P(D(b))}` : `${P(s)} * log(${a}) * ${P(D(b))}`;
          }
          steps.push({ rule: "Logarithmic differentiation", tex: `y = u^{v} \\Rightarrow \\ln y = v\\ln u \\Rightarrow \\dfrac{dy}{d${v}} = u^{v}\\left[v'\\ln u + \\dfrac{v\\,u'}{u}\\right], \\quad u = ${tx(a)},\\; v = ${tx(b)}` });
          return `${P(s)} * (${P(D(b))} * log(${a}) + ${P(b)} * ${P(D(a))} / ${P(a)})`;
        }
      }
      if (n.isFunctionNode && n.args.length === 1 && OUT[n.fn.name]) {
        const [o, lhs, rhs] = OUT[n.fn.name], u = n.args[0], us = u.toString();
        const simple = u.isSymbolNode;
        steps.push({ rule: simple ? "Standard derivative" : "Chain rule", tex: simple ? `${dx}\\left[${lhs.replace(/u/g, v)}\\right] = ${rhs.replace(/u/g, v)}` : `${dx}\\left[${lhs}\\right] = ${rhs}\\cdot u', \\quad u = ${tx(u)}` });
        return `${P(o.replace(/U/g, us))} * ${P(D(u))}`;
      }
      if (n.isFunctionNode && n.fn.name === "abs" && n.args.length === 1) { const us = n.args[0].toString(); return `((${us}) / abs(${us})) * ${P(D(n.args[0]))}`; }
      throw new Error(`I cannot differentiate "${s}" step by step yet.`);
    }
    let raw;
    try { raw = D(node); } catch (e) { const r = ML.d(node, v); return { steps: [], node: r, str: r.toString(), fallback: true }; }
    const res = ML.simp(raw);
    return { steps, node: res, str: res.toString() };
  };

  /* ----- integration ----- */
  ML.fracApprox = fracApprox;
  // a number as an exact-looking expression string: 3, (2/3), sqrt(5)
  ML.numStr = (v) => {
    if (Math.abs(v) < 1e-12) return "0";
    let r = fracApprox(v, 64); if (r) return r[1] === 1 ? `${r[0]}` : `(${r[0]}/${r[1]})`;
    r = fracApprox(v * v, 64); if (r && r[0] > 0) return `${v < 0 ? "-" : ""}sqrt(${r[1] === 1 ? r[0] : `${r[0]}/${r[1]}`})`;
    return `${+v.toPrecision(10)}`;
  };
  const depends = (n, v) => n.filter((k) => k.isSymbolNode && k.name === v).length > 0;
  ML.depends = depends;
  // coefficients [c0, c1, ...] of a polynomial in v, or null if the node is not a polynomial
  ML.poly = function poly(n, v = "x") {
    if (n.isParenthesisNode) return poly(n.content, v);
    if (n.isSymbolNode && n.name === v) return [0, 1];
    if (!depends(n, v)) { try { const c = n.compile().evaluate({}); return typeof c === "number" && isFinite(c) ? [c] : null; } catch (e) { return null; } }
    if (!n.isOperatorNode) return null;
    const A = poly(n.args[0], v), B = n.args[1] ? poly(n.args[1], v) : null;
    if (!A) return null;
    const trim = (p) => { while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-12) p.pop(); return p; };
    const mul = (p, q) => { const r = new Array(p.length + q.length - 1).fill(0); p.forEach((x, i) => q.forEach((y, j) => (r[i + j] += x * y))); return r; };
    if (n.fn === "unaryMinus") return A.map((x) => -x);
    if (n.fn === "unaryPlus") return A;
    if (!B) return null;
    if (n.fn === "add" || n.fn === "subtract") { const r = []; for (let i = 0; i < Math.max(A.length, B.length); i++) r.push((A[i] || 0) + (n.fn === "add" ? 1 : -1) * (B[i] || 0)); return trim(r); }
    if (n.fn === "multiply") return trim(mul(A, B));
    if (n.fn === "divide") return B.length === 1 && B[0] !== 0 ? A.map((x) => x / B[0]) : null;
    if (n.fn === "pow") { if (B.length !== 1 || !Number.isInteger(B[0]) || B[0] < 0 || B[0] > 12) return null; let r = [1]; for (let i = 0; i < B[0]; i++) r = mul(r, A); return trim(r); }
    return null;
  };
  const pval = (p, x) => p.reduceRight((s, c) => s * x + c, 0);
  const verify = (Fnode, f, v) => {
    const F = ML.fn(Fnode, v); let ok = 0, tried = 0;
    for (const t of [0.37, 0.71, 1.13, 1.9, 2.6, 3.7, 5.2, -0.43, -1.27, -3.1]) {
      const h = 1e-5, dF = (F(t + h) - F(t - h)) / (2 * h), ft = f(t);
      if (!isFinite(dF) || !isFinite(ft)) continue;
      tried++; if (Math.abs(dF - ft) < 2e-4 * Math.max(1, Math.abs(ft))) ok++;
    }
    return tried >= 2 && ok === tried;
  };
  const lin = (r, v) => (Math.abs(r) < 1e-12 ? v : r < 0 ? `(${v} + ${ML.numStr(-r)})` : `(${v} - ${ML.numStr(r)})`);
  // 1/Q, 1/sqrt(Q), sqrt(Q) for a quadratic Q = A x^2 + B x + C
  function quadForms(kind, Q, v) {
    const [C, B, A] = [Q[0], Q[1] || 0, Q[2]], disc = B * B - 4 * A * C, n = ML.numStr;
    const Qs = `(${n(A)}*${v}^2 + ${n(B)}*${v} + ${n(C)})`, L = `(${n(2 * A)}*${v} + ${n(B)})`, rd = n(Math.sqrt(Math.abs(disc)));
    const invRoot = () => (A > 0 ? `(1/${n(Math.sqrt(A))})*log(abs(${v} + ${n(B / (2 * A))} + sqrt${Qs}/${n(Math.sqrt(A))}))` : disc > 0 ? `(1/${n(Math.sqrt(-A))})*asin(-${L}/${rd})` : null);
    if (kind === "inv") return Math.abs(disc) < 1e-12 ? `-2/${L}` : disc < 0 ? `(2/${rd})*atan(${L}/${rd})` : `(1/${rd})*log(abs((${L} - ${rd})/(${L} + ${rd})))`;
    if (kind === "invsqrt") return invRoot();
    const ir = invRoot(); return ir ? `(${L}/${n(4 * A)})*sqrt${Qs} + (${n((4 * A * C - B * B) / (8 * A))})*${ir}` : null;
  }
  const FORM = {
    inv: "\\int \\dfrac{dx}{x^2 - a^2} = \\dfrac{1}{2a}\\log\\left|\\dfrac{x-a}{x+a}\\right|, \\quad \\int \\dfrac{dx}{x^2 + a^2} = \\dfrac{1}{a}\\tan^{-1}\\dfrac{x}{a}",
    invsqrt: "\\int \\dfrac{dx}{\\sqrt{x^2 \\pm a^2}} = \\log\\left|x + \\sqrt{x^2 \\pm a^2}\\right|, \\quad \\int \\dfrac{dx}{\\sqrt{a^2 - x^2}} = \\sin^{-1}\\dfrac{x}{a}",
    sqrt: "\\int \\sqrt{x^2 \\pm a^2}\\,dx = \\dfrac{x}{2}\\sqrt{x^2 \\pm a^2} \\pm \\dfrac{a^2}{2}\\log\\left|x + \\sqrt{x^2 \\pm a^2}\\right|, \\quad \\int \\sqrt{a^2 - x^2}\\,dx = \\dfrac{x}{2}\\sqrt{a^2 - x^2} + \\dfrac{a^2}{2}\\sin^{-1}\\dfrac{x}{a}",
  };
  const unwrap = (n) => (n.isParenthesisNode ? unwrap(n.content) : n);
  const rootArg = (n) => { n = unwrap(n); if (n.isFunctionNode && n.fn.name === "sqrt") return n.args[0]; if (n.isOperatorNode && n.fn === "pow") { try { if (Math.abs(n.args[1].compile().evaluate({}) - 0.5) < 1e-12) return n.args[0]; } catch (e) { /* not a root */ } } return null; };
  // textbook-style closed forms tried before the general engine
  function special(node, v) {
    let n = unwrap(node);
    if (n.isOperatorNode && n.fn === "unaryMinus") { const r = special(n.args[0], v); return r && { ...r, str: `-(${r.str})` }; }
    if (n.isOperatorNode && n.fn === "multiply") {
      const [a, b] = n.args, ka = !depends(a, v), kb = !depends(b, v);
      if (ka !== kb) { const r = special(ka ? b : a, v); return r && { ...r, str: `(${ka ? a : b})*(${r.str})` }; }
      // e^(ax) sin(bx + c) or e^(ax) cos(bx + c)
      const pick = (e, t) => {
        e = unwrap(e); t = unwrap(t);
        const ex = e.isFunctionNode && e.fn.name === "exp" ? e.args[0] : e.isOperatorNode && e.fn === "pow" && unwrap(e.args[0]).isSymbolNode && unwrap(e.args[0]).name === "e" ? e.args[1] : null;
        if (!ex || !t.isFunctionNode || !["sin", "cos"].includes(t.fn.name)) return null;
        const pe = ML.poly(ex, v), pt = ML.poly(t.args[0], v);
        if (!pe || !pt || pe.length !== 2 || pt.length !== 2) return null;
        const A = pe[1], Bc = pt[1], arg = `(${t.args[0]})`, d = ML.numStr(A * A + Bc * Bc), as = `(${ML.numStr(A)})`, bs = `(${ML.numStr(Bc)})`;
        return { str: t.fn.name === "sin" ? `(${e})*(${as}*sin${arg} - ${bs}*cos${arg})/${d}` : `(${e})*(${as}*cos${arg} + ${bs}*sin${arg})/${d}`, method: "Integration by parts, applied twice (§7.6)",
          formula: "\\int e^{ax}\\sin bx\\,dx = \\dfrac{e^{ax}}{a^2+b^2}(a\\sin bx - b\\cos bx), \\quad \\int e^{ax}\\cos bx\\,dx = \\dfrac{e^{ax}}{a^2+b^2}(a\\cos bx + b\\sin bx)" };
      };
      return pick(a, b) || pick(b, a);
    }
    const sq = rootArg(n);
    if (sq) { const Q = ML.poly(sq, v); if (Q && Q.length === 3) { const s = quadForms("sqrt", Q, v); return s && { str: s, method: "Integral of a particular form (§7.4)", formula: FORM.sqrt }; } return null; }
    if (!(n.isOperatorNode && n.fn === "divide")) return null;
    const den = unwrap(n.args[1]), dsq = rootArg(den);
    // u / e^(kx) is u * e^(-kx)
    const dex = den.isFunctionNode && den.fn.name === "exp" ? den.args[0] : den.isOperatorNode && den.fn === "pow" && unwrap(den.args[0]).isSymbolNode && unwrap(den.args[0]).name === "e" ? den.args[1] : null;
    if (dex) return special(math.parse(`(${n.args[0]}) * e^(-(${dex}))`), v);
    const P = ML.poly(n.args[0], v);
    if (!P) return null;
    if (dsq) { const Q = ML.poly(dsq, v); if (Q && Q.length === 3 && P.length === 1) { const s = quadForms("invsqrt", Q, v); return s && { str: `(${ML.numStr(P[0])})*(${s})`, method: "Integral of a particular form (§7.4)", formula: FORM.invsqrt }; } return null; }
    const Q = ML.poly(den, v);
    if (!Q || Q.length < 3 || P.length >= Q.length) return null;
    const deg = Q.length - 1, dQ = Q.slice(1).map((c, i) => c * (i + 1)), roots = ML.roots((x) => pval(Q, x), -60, 60, 6000);
    if (roots.length === deg && roots.every((r) => fracApprox(r, 64))) {
      const As = roots.map((r) => pval(P, r) / pval(dQ, r));
      return { raw: true, str: roots.map((r, i) => `${i ? (As[i] < 0 ? " - " : " + ") : As[i] < 0 ? "-" : ""}${ML.numStr(Math.abs(As[i]))}*log(abs(${lin(r, v)}))`).join(""), method: "Integration by partial fractions (§7.5)",
        formula: `${ML.tex(node)} = ${roots.map((r, i) => `\\dfrac{${ML.nice(As[i])}}{${ML.tex(lin(r, v))}}`).join(" + ").replace(/\+ \\dfrac\{-/g, "- \\dfrac{")}` };
    }
    if (deg === 2) {
      const A = Q[2], B = Q[1], k = (P[1] || 0) / (2 * A), rest = P[0] - k * B, parts = [];
      if (Math.abs(k) > 1e-12) parts.push(`(${ML.numStr(k)})*log(abs(${den}))`);
      if (Math.abs(rest) > 1e-12) parts.push(`(${ML.numStr(rest)})*(${quadForms("inv", Q, v)})`);
      return { str: parts.join(" + "), method: "Integral of a particular form (§7.4)", formula: FORM.inv };
    }
    return null;
  }
  // u-substitution: f(x) dx = g(u) du for a sub-expression u of the integrand
  function substitution(node, v) {
    if (ML.poly(node, v)) return null;
    const cands = [], seen = new Set(), add = (n) => { n = unwrap(n); const k = n.toString(); if (seen.has(k) || !depends(n, v) || n.isSymbolNode) return; const p = ML.poly(n, v); if (p && p.length <= 2) return; seen.add(k); cands.push(n); };
    node.traverse((n) => { if (n.isFunctionNode) { add(n); n.args.forEach(add); } else if (n.isOperatorNode && (n.fn === "pow" || n.fn === "divide")) n.args.forEach(add); });
    if (seen.has(unwrap(node).toString())) cands.splice(cands.findIndex((c) => c.toString() === unwrap(node).toString()), 1);
    for (const u of cands.slice(0, 8)) {
      try {
        const du = math.simplify(math.derivative(u, v)), key = u.toString();
        let R = math.simplify(`(${node}) / (${du})`);
        R = R.transform((n) => (n.toString() === key ? new math.SymbolNode("t") : n));
        if (depends(R, v)) continue;
        const inner = special(R, "t") || (() => { const r = nerdamer(`integrate(${R}, t)`).toString(); return /integrate|undefined|NaN|\bi\b|asinh|acosh|atanh/.test(r) ? null : { str: r }; })();
        if (!inner || !inner.str) continue;
        const back = math.parse(inner.str).transform((n) => (n.isSymbolNode && n.name === "t" ? new math.ParenthesisNode(u) : n));
        return { str: back.toString(), method: "Integration by substitution (§7.3)",
          formula: `\text{Put } t = ${ML.tex(u)}, \quad dt = ${ML.tex(du)}\,d${v} \quad\Rightarrow\quad \int ${ML.tex(R)}\,dt = ${ML.tex(inner.str)}` };
      } catch (e) { /* try the next candidate */ }
    }
    return null;
  }
  // Antiderivative: textbook forms first, then the symbolic engine. Every result is checked by differentiating. Returns null when no closed form is found.
  ML.integrate = (x, v = "x") => {
    const node = typeof x === "string" ? ML.parse(x) : x, s = node.toString(), f = ML.fn(node, v);
    try {
      for (const sp of [special(node, v), substitution(node, v)]) {
        if (!sp || !sp.str) continue;
        let F = math.parse(sp.str);
        if (!sp.raw) try { const t = math.simplify(F); if (verify(t, f, v)) F = t; } catch (e) { /* keep the unsimplified form */ }
        if (verify(F, f, v)) return { node: F, str: F.toString(), method: sp.method, formula: sp.formula };
      }
    } catch (e) { /* fall through to the general engine */ }
    try {
      const r = nerdamer(`integrate(${s}, ${v})`).toString();
      if (/integrate|undefined|NaN|\bi\b|asinh|acosh|atanh|erf|Si|Ci|Ei/.test(r)) return null;
      const F = math.parse(r);
      return verify(F, f, v) ? { node: F, str: r } : null;
    } catch (e) { return null; }
  };
  ML.simpson = (f, a, b, n = 2000) => {
    const h = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  };
  // Real roots of f on [a, b] (sign changes, refined by bisection).
  ML.roots = (f, a, b, n = 2400) => {
    const out = [], add = (r) => { const q = fracApprox(r, 64); const v = q ? q[0] / q[1] : r; if (!out.some((o) => Math.abs(o - v) < 1e-6)) out.push(v); };
    let x0 = a, y0 = f(a);
    for (let i = 1; i <= n; i++) {
      const x1 = a + ((b - a) * i) / n, y1 = f(x1);
      if (isFinite(y0) && Math.abs(y0) < 1e-12) add(x0);
      else if (isFinite(y0) && isFinite(y1) && y0 * y1 < 0) {
        let lo = x0, hi = x1, flo = y0;
        for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2, fm = f(mid); if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; } }
        const r = (lo + hi) / 2;
        if (Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(y0), Math.abs(y1))) add(r); // skip jumps across asymptotes
      }
      x0 = x1; y0 = y1;
    }
    if (isFinite(y0) && Math.abs(y0) < 1e-12) add(x0);
    return out.sort((p, q) => p - q);
  };

  /* ---------- step output ---------- */
  ML.rich = (html) => String(html).replace(/\$([^$]+)\$/g, (_, t) => katex.renderToString(t, { throwOnError: false }));
  ML.Out = class {
    constructor() { this.el = document.createElement("div"); this.el.className = "steps"; this.n = 0; }
    add(cls, html) { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; this.el.appendChild(d); return d; }
    step(title) { this.n++; this.add("stepHead", `<span class="stepNo">Step ${this.n}</span> ${ML.rich(title)}`); return this; }
    p(html) { this.add("stepText", ML.rich(html)); return this; }
    m(tex) { this.add("mathBlock", katex.renderToString(tex, { throwOnError: false, displayMode: true })); return this; }
    ans(html) { this.add("answer", `<span class="ansTag">Answer</span><div>${ML.rich(html)}</div>`); return this; }
    note(html) { this.add("note", ML.rich(html)); return this; }
    table(head, rows) { this.add("tableWrap", `<table><thead><tr>${head.map((h) => `<th>${ML.rich(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${ML.rich(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`); return this; }
    plot(spec) { const c = document.createElement("canvas"); c.className = "plot"; this.el.appendChild(c); ML.pending.push(() => ML.drawPlot(c, spec)); return this; }
  };
  ML.pending = [];

  /* ---------- plotting ---------- */
  const COLORS = ["#4338ca", "#db2777", "#059669", "#d97706"];
  function niceStep(range) { const raw = range / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  ML.drawPlot = (canvas, spec) => {
    const W = canvas.clientWidth || 640, H = Math.min(380, Math.max(260, W * 0.56)), dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + "px";
    const g = canvas.getContext("2d"); g.scale(dpr, dpr);
    let { xmin, xmax, ymin, ymax } = spec; const fns = spec.fns || [];
    if (ymin == null || ymax == null) {
      const ys = [];
      fns.forEach(({ f }) => { for (let i = 0; i <= 300; i++) { const y = f(xmin + ((xmax - xmin) * i) / 300); if (isFinite(y)) ys.push(y); } });
      (spec.points || []).forEach((p) => ys.push(p.y)); (spec.polygon || []).forEach((p) => ys.push(p[1]));
      ys.push(0); ys.sort((a, b) => a - b);
      let lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1];
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.12; ymin = lo - pad; ymax = hi + pad;
    }
    const L = 44, R = 12, T = 10, B = 26, X = (x) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R), Y = (y) => T + ((ymax - y) / (ymax - ymin)) * (H - T - B);
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    g.font = "11px system-ui, sans-serif"; g.lineWidth = 1;
    const sx = niceStep(xmax - xmin), sy = niceStep(ymax - ymin), lab = (v) => String(+v.toPrecision(6));
    for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) { g.strokeStyle = "#eef0f4"; g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), H - B); g.stroke(); g.fillStyle = "#6b7280"; g.textAlign = "center"; g.fillText(lab(x), X(x), H - B + 14); }
    for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) { g.strokeStyle = "#eef0f4"; g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(W - R, Y(y)); g.stroke(); g.fillStyle = "#6b7280"; g.textAlign = "right"; g.fillText(lab(y), L - 6, Y(y) + 4); }
    g.strokeStyle = "#9ca3af"; g.beginPath();
    if (ymin <= 0 && ymax >= 0) { g.moveTo(L, Y(0)); g.lineTo(W - R, Y(0)); }
    if (xmin <= 0 && xmax >= 0) { g.moveTo(X(0), T); g.lineTo(X(0), H - B); }
    g.stroke();
    g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
    (spec.fills || []).forEach(({ f, g: gg, a, b, color }) => {
      const lower = gg || (() => 0); g.fillStyle = color || "rgba(67, 56, 202, 0.18)"; g.beginPath();
      const N = 200; for (let i = 0; i <= N; i++) { const x = a + ((b - a) * i) / N; g.lineTo(X(x), Y(f(x))); }
      for (let i = N; i >= 0; i--) { const x = a + ((b - a) * i) / N; g.lineTo(X(x), Y(lower(x))); }
      g.closePath(); g.fill();
    });
    if (spec.polygon && spec.polygon.length > 2) { g.fillStyle = "rgba(5, 150, 105, 0.2)"; g.beginPath(); spec.polygon.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.closePath(); g.fill(); }
    (spec.lines || []).forEach(({ a, b, c }, i) => {
      g.strokeStyle = COLORS[i % COLORS.length]; g.lineWidth = 1.5; g.beginPath();
      if (Math.abs(b) > 1e-12) { g.moveTo(X(xmin), Y((c - a * xmin) / b)); g.lineTo(X(xmax), Y((c - a * xmax) / b)); } else { g.moveTo(X(c / a), Y(ymin)); g.lineTo(X(c / a), Y(ymax)); }
      g.stroke();
    });
    fns.forEach(({ f, color }, i) => {
      g.strokeStyle = color || COLORS[i % COLORS.length]; g.lineWidth = 2; g.beginPath(); let pen = false, py = 0;
      const N = Math.max(400, W);
      for (let k = 0; k <= N; k++) {
        const x = xmin + ((xmax - xmin) * k) / N, y = f(x);
        if (!isFinite(y) || Math.abs(y - py) > (ymax - ymin) * 2) { pen = false; py = y; continue; }
        if (pen) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y));
        pen = true; py = y;
      }
      g.stroke();
    });
    g.restore();
    (spec.points || []).forEach((p) => {
      g.fillStyle = p.color || "#111827"; g.beginPath(); g.arc(X(p.x), Y(p.y), 3.5, 0, 7); g.fill();
      if (p.label) { g.textAlign = X(p.x) > W - 90 ? "right" : "left"; g.fillText(p.label, X(p.x) + (g.textAlign === "left" ? 6 : -6), Y(p.y) - 6); }
    });
    const legend = fns.filter((f) => f.label).concat((spec.lines || []).filter((l) => l.label).map((l, i) => ({ label: l.label, color: COLORS[i % COLORS.length] })));
    const lw = Math.max(0, ...legend.map((it) => g.measureText(it.label).width)) + 34, lx = W - R - lw;
    if (legend.length) { g.fillStyle = "rgba(255, 255, 255, 0.85)"; g.fillRect(lx, T + 2, lw, legend.length * 16 + 6); }
    legend.forEach((it, i) => { const col = it.color || COLORS[fns.indexOf(it) % COLORS.length]; g.fillStyle = col; g.fillRect(lx + 6, T + 10 + i * 16, 12, 3); g.fillStyle = "#374151"; g.textAlign = "left"; g.fillText(it.label, lx + 24, T + 14 + i * 16); });
  };
})();
