/* Chapters 7, 8 and 9: Integrals, Application of Integrals, Differential Equations (Part II textbook) */
(function () {
  const ML = window.ML, math = window.math;
  const unwrap = (n) => (n.isParenthesisNode ? unwrap(n.content) : n);
  const has = (n, names) => n.filter((k) => k.isFunctionNode && names.includes(k.fn.name)).length > 0;
  const INVTRIG = ["asin", "acos", "atan", "acot", "asec", "acsc"], TRIG = ["sin", "cos", "tan", "cot", "sec", "csc"];
  // ILATE rank: Inverse trig, Logarithmic, Algebraic, Trigonometric, Exponential
  const ilate = (n) => (has(n, INVTRIG) ? 0 : has(n, ["log"]) ? 1 : ML.poly(n) ? 2 : has(n, TRIG) ? 3 : has(n, ["exp"]) || n.filter((k) => k.isOperatorNode && k.fn === "pow" && unwrap(k.args[0]).isSymbolNode && unwrap(k.args[0]).name === "e").length ? 4 : 2.5);
  const ILATE = ["inverse trigonometric", "logarithmic", "algebraic", "trigonometric", "exponential"];
  const terms = (n, sign = 1, out = []) => { n = unwrap(n); if (n.isOperatorNode && n.fn === "add") { terms(n.args[0], sign, out); terms(n.args[1], sign, out); } else if (n.isOperatorNode && n.fn === "subtract") { terms(n.args[0], sign, out); terms(n.args[1], -sign, out); } else out.push(sign < 0 ? new math.OperatorNode("-", "unaryMinus", [new math.ParenthesisNode(n)]) : n); return out; };

  // integration by parts for a product u*v (or a single log / inverse trig function)
  function byParts(o, node) {
    let n = unwrap(node), u, w;
    if (n.isFunctionNode && (INVTRIG.includes(n.fn.name) || n.fn.name === "log")) { u = n; w = math.parse("1"); }
    else if (n.isOperatorNode && n.fn === "multiply" && ML.depends(n.args[0], "x") && ML.depends(n.args[1], "x")) { const [a, b] = n.args.map(unwrap), ra = ilate(a), rb = ilate(b); if (ra === rb) return false; [u, w] = ra < rb ? [a, b] : [b, a]; }
    else return false;
    const W = ML.integrate(w); if (!W) return false;
    const du = ML.simp(ML.d(u)), restIn = ML.simp(`(${du}) * (${W.str})`), rest = ML.integrate(restIn); if (!rest) return false;
    o.p(`Use <b>integration by parts</b> (§7.6). By the ILATE order, take the ${ILATE[Math.floor(ilate(u))]} function as the first function:`);
    o.m(`\\int u\\,v\\,dx = u\\int v\\,dx - \\int\\left[\\dfrac{du}{dx}\\int v\\,dx\\right]dx, \\qquad u = ${ML.tex(u)},\\quad v = ${ML.tex(w)}`);
    o.m(`\\dfrac{du}{dx} = ${ML.tex(du)}, \\qquad \\int v\\,dx = ${ML.tex(W.node)}`);
    o.m(`\\int ${ML.tex(node)}\\,dx = \\left(${ML.tex(u)}\\right)\\left(${ML.tex(W.node)}\\right) - \\int ${ML.tex(restIn)}\\,dx = \\left(${ML.tex(u)}\\right)\\left(${ML.tex(W.node)}\\right) - \\left(${ML.tex(rest.node)}\\right)`);
    return true;
  }
  const it = (x) => { const n = typeof x === "string" ? ML.parse(x) : x, u = unwrap(n); return u.isOperatorNode && (u.fn === "add" || u.fn === "subtract") ? `\\left(${ML.tex(u)}\\right)` : ML.tex(n); };
  const explain = (o, node, r) => {
    if (r.method) { o.p(`<b>${r.method}</b>`); if (r.formula) o.m(r.formula); return; }
    if (byParts(o, node)) return;
    if (ML.poly(node)) o.p("Use $\\displaystyle\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1}$ on each power of $x$ (§7.2).");
    else o.p("Use the standard formula for this function (§7.2). When $x$ is replaced by $ax + b$, divide the result by $a$.");
  };

  ML.chapters.push({ n: 7, id: "integrals", title: "Integrals", tools: [
    { id: "indefinite", title: "Indefinite integral", sec: "7.2–7.6", desc: "Integrates a function and shows the method the textbook uses for it: standard formulas, substitution, particular forms, partial fractions or integration by parts. The answer is checked by differentiating it.",
      fields: [{ id: "f", label: "$\\displaystyle\\int f(x)\\,dx$, where $f(x) =$", def: "x^2 * e^x", wide: true }],
      solve(v, o) {
        const node = ML.parse(v.f), ts = terms(node);
        o.m(`I = \\int ${it(node)}\\,dx`);
        let total = null;
        if (ts.length > 1) {
          const parts = ts.map((t) => ({ t, r: ML.integrate(t) }));
          if (parts.every((p) => p.r)) {
            o.step("Integrate term by term"); o.m(`I = ${ts.map((t) => `\\int ${ML.tex(t)}\\,dx`).join(" + ")}`);
            parts.forEach(({ t, r }, i) => { o.step(`Term ${i + 1}: $\\displaystyle\\int ${ML.tex(t)}\\,dx$`); explain(o, t, r); o.m(`\\int ${ML.tex(t)}\\,dx = ${ML.tex(r.node)}`); });
            total = math.parse(parts.map((p) => `(${p.r.str})`).join(" + "));
          }
        }
        if (!total) {
          const r = ML.integrate(node);
          if (!r) throw new Error("I could not find this integral in closed form. Check the typing, or try the definite integral tool, which can still give a numerical value.");
          o.step("Choose the method"); explain(o, node, r); total = r.node;
        }
        o.step("Write the result and add the constant of integration"); o.m(`I = ${ML.tex(total)} + C`);
        o.p("Check: differentiating this answer gives back the integrand.");
        o.ans(`$\\displaystyle\\int ${it(node)}\\,dx = ${ML.tex(total)} + C$`);
      } },
    { id: "definite", title: "Definite integral", sec: "7.8–7.9", desc: "Evaluates $\\int_a^b f(x)\\,dx$ by the second fundamental theorem of calculus, $F(b) - F(a)$, and confirms the value numerically.",
      fields: [{ id: "f", label: "$f(x) =$", def: "x^2", wide: true }, { id: "a", label: "Lower limit $a$", def: "2" }, { id: "b", label: "Upper limit $b$", def: "3" }],
      solve(v, o) {
        const a = ML.val(v.a), b = ML.val(v.b), f = ML.fn(v.f), A = ML.tex(v.a), B = ML.tex(v.b);
        for (let i = 0; i <= 400; i++) { const y = f(a + ((b - a) * i) / 400); if (!isFinite(y)) throw new Error("The function is not defined (or not bounded) at some point between the limits, so this is not a proper definite integral."); }
        const num = ML.simpson(f, a, b), r = ML.integrate(v.f);
        o.m(`I = \\int_{${A}}^{${B}} ${it(v.f)}\\,dx`);
        let exact = false, exactVal = 0;
        if (r) {
          const F = ML.fn(r.node), Fa = F(a), Fb = F(b);
          if (isFinite(Fa) && isFinite(Fb) && Math.abs(Fb - Fa - num) < 1e-6 * Math.max(1, Math.abs(num))) {
            exact = true; exactVal = Fb - Fa;
            o.step("Find an antiderivative $F(x)$"); if (r.method) { o.p(`<b>${r.method}</b>`); if (r.formula) o.m(r.formula); } o.m(`F(x) = ${ML.tex(r.node)}`);
            o.step("Apply $\\displaystyle\\int_a^b f(x)\\,dx = F(b) - F(a)$"); o.m(`I = \\Big[${ML.tex(r.node)}\\Big]_{${A}}^{${B}} = F(${B}) - F(${A}) = ${ML.nice(Fb)} - \\left(${ML.nice(Fa)}\\right) = ${ML.approx(Fb - Fa)}`);
          }
        }
        if (!exact) o.note("A simple antiderivative was not available for these limits, so the value is found by numerical integration (Simpson's rule).");
        const pad = (b - a) * 0.15 || 1;
        o.plot({ xmin: Math.min(a, b) - Math.abs(pad), xmax: Math.max(a, b) + Math.abs(pad), fns: [{ f, label: "f(x)" }], fills: [{ f, a, b }] });
        o.ans(`$\\displaystyle\\int_{${A}}^{${B}} ${it(v.f)}\\,dx = ${ML.approx(exact ? exactVal : num)}$`);
      } },
  ] });
  ML.integrate.check = (Fnode, fnode) => { const F = ML.fn(Fnode), f = ML.fn(fnode); return [0.37, 1.13, 2.6, -0.43].filter((t) => isFinite(f(t)) && isFinite(F(t))).every((t) => Math.abs((F(t + 1e-5) - F(t - 1e-5)) / 2e-5 - f(t)) < 2e-4 * Math.max(1, Math.abs(f(t)))); };

  const pieces = (o, h, a, b, label, anti) => {
    const cuts = [a, ...ML.roots(h, a, b).filter((c) => c > a + 1e-9 && c < b - 1e-9), b]; let area = 0; const rows = [], F = anti ? ML.fn(anti.node) : null;
    for (let i = 0; i < cuts.length - 1; i++) { let s = ML.simpson(h, cuts[i], cuts[i + 1], 600); if (F) { const e = F(cuts[i + 1]) - F(cuts[i]); if (isFinite(e) && Math.abs(e - s) < 1e-2 * Math.max(1, Math.abs(s))) s = e; } area += Math.abs(s); rows.push([`$[${ML.nice(cuts[i])}, ${ML.nice(cuts[i + 1])}]$`, s >= 0 ? label[0] : label[1], `$${ML.nice(s)}$`, `$${ML.nice(Math.abs(s))}$`]); }
    return { cuts, area, rows };
  };
  ML.chapters.push({ n: 8, id: "application-of-integrals", title: "Application of Integrals", tools: [
    { id: "under", title: "Area under a curve", sec: "8.2", desc: "Finds the area bounded by the curve $y = f(x)$, the x-axis and the lines $x = a$ and $x = b$. Parts below the x-axis are counted as positive area.",
      fields: [{ id: "f", label: "$y = f(x) =$", def: "x^2 - 4", wide: true }, { id: "a", label: "From $x = a$", def: "0" }, { id: "b", label: "to $x = b$", def: "3" }],
      solve(v, o) {
        const a = ML.val(v.a), b = ML.val(v.b), f = ML.fn(v.f); if (!(b > a)) throw new Error("b must be greater than a.");
        const r = ML.integrate(v.f), { cuts, area, rows } = pieces(o, f, a, b, ["above the x-axis", "below the x-axis"], r);
        o.m(`y = ${ML.tex(v.f)}, \\qquad ${ML.nice(a)} \\le x \\le ${ML.nice(b)}`);
        o.step("Find where the curve crosses the x-axis"); o.p(cuts.length > 2 ? `$f(x) = 0$ at $x = ${cuts.slice(1, -1).map(ML.nice).join(",\\ ")}$, so split the interval there.` : "The curve does not cross the x-axis between the limits, so one integral is enough.");
        o.step("Integrate over each part and take the absolute value"); if (r) o.m(`\\int ${it(v.f)}\\,dx = ${ML.tex(r.node)}`);
        o.table(["Interval", "Curve is", "$\\int f(x)\\,dx$", "Area"], rows);
        o.step("Add the areas"); o.m(`\\text{Area} = ${rows.map((x) => x[3].replace(/\$/g, "")).join(" + ")} = ${ML.approx(area)}`);
        const pad = (b - a) * 0.15;
        o.plot({ xmin: a - pad, xmax: b + pad, fns: [{ f, label: "y = f(x)" }], fills: [{ f, a, b }] });
        o.ans(`Area $= ${ML.approx(area)}$ square units`);
      } },
    { id: "between", title: "Area between two curves", sec: "8.3", desc: "Finds the area enclosed between $y = f(x)$ and $y = g(x)$. Leave the limits empty to use the points where the curves meet.",
      fields: [{ id: "f", label: "First curve $y = f(x) =$", def: "x + 2" }, { id: "g", label: "Second curve $y = g(x) =$", def: "x^2" }, { id: "a", label: "From x = (optional)", def: "" }, { id: "b", label: "to x = (optional)", def: "" }],
      solve(v, o) {
        const f = ML.fn(v.f), g = ML.fn(v.g), h = (x) => f(x) - g(x); let a, b;
        o.m(`y = ${ML.tex(v.f)} \\qquad\\text{and}\\qquad y = ${ML.tex(v.g)}`);
        if (String(v.a).trim() && String(v.b).trim()) { a = ML.val(v.a); b = ML.val(v.b); if (!(b > a)) throw new Error("The second limit must be greater than the first."); }
        else {
          const meet = ML.roots(h, -20, 20, 8000);
          if (meet.length < 2) throw new Error("These curves do not meet at two points between x = -20 and x = 20, so they do not enclose a region. Give the limits yourself to get the area between them.");
          a = meet[0]; b = meet[meet.length - 1];
          o.step("Points of intersection: solve $f(x) = g(x)$"); o.m(`${ML.tex(v.f)} = ${ML.tex(v.g)} \\quad\\Rightarrow\\quad x = ${meet.map(ML.nice).join(",\\ ")}`); o.p(`The curves meet at $${meet.map((x) => `(${ML.nice(x)}, ${ML.nice(f(x))})`).join(",\\ ")}$.`);
        }
        const r = ML.integrate(`(${v.f}) - (${v.g})`), { area, rows } = pieces(o, h, a, b, ["f above g", "g above f"], r);
        o.step("Area $= \\displaystyle\\int_a^b \\left[\\text{upper curve} - \\text{lower curve}\\right]dx$");
        if (r) o.m(`\\int \\left[\\left(${ML.tex(v.f)}\\right) - \\left(${ML.tex(v.g)}\\right)\\right]dx = ${ML.tex(r.node)}`);
        o.table(["Interval", "Upper curve", "$\\int (f - g)\\,dx$", "Area"], rows);
        o.step("Total"); o.m(`\\text{Area} = ${rows.map((x) => x[3].replace(/\$/g, "")).join(" + ")} = ${ML.approx(area)}`);
        const pad = (b - a) * 0.2;
        o.plot({ xmin: a - pad, xmax: b + pad, fns: [{ f, label: "y = f(x)" }, { f: g, label: "y = g(x)" }], fills: [{ f, g, a, b }] });
        o.ans(`Area between the curves $= ${ML.approx(area)}$ square units`);
      } },
  ] });

  /* ---------- 9. Differential Equations ---------- */
  const I = (expr, v) => { const r = ML.integrate(expr, v); if (!r) throw new Error(`I could not integrate $${ML.tex(expr)}$ in closed form, so this equation needs a method beyond this solver.`); return r; };
  ML.chapters.push({ n: 9, id: "differential-equations", title: "Differential Equations", tools: [
    { id: "order", title: "Order and degree", sec: "9.2", desc: "Finds the order and the degree of a differential equation. Type derivatives as y', y'', y''' (or dy/dx, d2y/dx2).",
      fields: [{ id: "eq", label: "Differential equation", def: "(y''')^2 + (y'')^3 + (y')^4 + y^5 = 0", wide: true }],
      solve(v, o) {
        let s = String(v.eq).replace(/[’‘`]/g, "'").replace(/d\s*\^?\s*3\s*y\s*\/\s*dx\s*\^?\s*3/g, "y'''").replace(/d\s*\^?\s*2\s*y\s*\/\s*dx\s*\^?\s*2/g, "y''").replace(/dy\s*\/\s*dx/g, "y'");
        const orders = [...s.matchAll(/y('+)/g)].map((m) => m[1].length);
        if (!orders.length) throw new Error("I could not find a derivative in this equation. Type derivatives as y', y'' or dy/dx.");
        const order = Math.max(...orders), sides = s.replace(/y('+)/g, (_, p) => ` D${p.length} `).split("=");
        if (sides.length > 2) throw new Error("Please use only one = sign.");
        const node = ML.parse(sides.length === 2 ? `(${sides[0]}) - (${sides[1]})` : sides[0]);
        const isD = (n) => n.isSymbolNode && /^D\d$/.test(n.name), anyD = (n) => n.filter(isD).length > 0, top = `D${order}`;
        let why = null;
        const deg = (n) => {
          if (n.isParenthesisNode) return deg(n.content);
          if (n.isSymbolNode) return n.name === top ? 1 : 0;
          if (n.isConstantNode) return 0;
          if (n.isFunctionNode) { if (anyD(n)) { why = n.fn.name === "sqrt" ? "radical" : "function"; } return 0; }
          if (n.isOperatorNode) {
            const d = n.args.map(deg);
            if (n.fn === "unaryMinus" || n.fn === "unaryPlus") return d[0];
            if (n.fn === "add" || n.fn === "subtract") return Math.max(...d);
            if (n.fn === "multiply") return d[0] + d[1];
            if (n.fn === "divide") { if (anyD(n.args[1])) why = "fraction"; return d[0]; }
            if (n.fn === "pow") { if (anyD(n.args[1])) { why = "function"; return 0; } let e; try { e = n.args[1].compile().evaluate({}); } catch (x) { e = NaN; } if (anyD(n.args[0]) && !(Number.isInteger(e) && e >= 0)) { why = "radical"; return 0; } return d[0] * (Number.isInteger(e) ? e : 1); }
          }
          return 0;
        };
        const d = deg(node), prime = (k) => `y${"'".repeat(k)}`, shown = s.replace(/\*/g, " ");
        o.p(`Equation: <code>${shown.replace(/</g, "&lt;")}</code>`);
        o.step("Order = order of the highest derivative present"); o.p(`The highest derivative is $${order === 1 ? "\\dfrac{dy}{dx}" : `\\dfrac{d^${order}y}{dx^${order}}`}$ (typed as ${prime(order)}), so the <b>order is ${order}</b>.`);
        o.step("Degree = power of the highest derivative, when the equation is a polynomial in the derivatives");
        if (why === "function") { o.p("A derivative appears inside a function such as sin, log or an exponent, so the equation is not a polynomial equation in its derivatives."); o.ans(`Order $= ${order}$; the <b>degree is not defined</b>.`); }
        else if (why) { o.p(`A derivative appears under a ${why === "radical" ? "radical or fractional power" : "denominator"}. First clear it (square both sides or multiply through) so that the equation becomes a polynomial in the derivatives; then the degree is the highest power of ${prime(order)}.`); o.ans(`Order $= ${order}$. Rewrite the equation free from radicals and fractions in the derivatives to read off the degree.`); }
        else { o.p(`The equation is a polynomial in $y', y'', \\dots$ and the highest power of ${prime(order)} is ${d}, so the <b>degree is ${d}</b>.`); o.ans(`Order $= ${order}$, degree $= ${d}$`); }
      } },
    { id: "separable", title: "Variable separable", sec: "9.5.1", desc: "Solves $\\dfrac{dy}{dx} = f(x)\\,g(y)$ by separating the variables and integrating both sides.",
      fields: [{ id: "f", label: "$f(x)$ (the part in x)", def: "1 + x^2" }, { id: "g", label: "$g(y)$ (the part in y)", def: "1 + y^2" }, { id: "x0", label: "Given x = (optional)", def: "" }, { id: "y0", label: "y = (optional)", def: "" }],
      solve(v, o) {
        const f = ML.parse(v.f), g = ML.parse(v.g);
        o.m(`\\dfrac{dy}{dx} = \\left(${ML.tex(f)}\\right)\\left(${ML.tex(g)}\\right)`);
        o.step("Separate the variables"); o.m(`\\dfrac{dy}{${ML.tex(g)}} = \\left(${ML.tex(f)}\\right)dx`);
        const G = I(`1/(${g})`, "y"), Fx = I(f, "x");
        o.step("Integrate both sides"); o.m(`\\int \\dfrac{dy}{${ML.tex(g)}} = \\int \\left(${ML.tex(f)}\\right)dx`); o.m(`${ML.tex(G.node)} = ${ML.tex(Fx.node)} + C`);
        if (String(v.x0).trim() && String(v.y0).trim()) {
          const x0 = ML.val(v.x0), y0 = ML.val(v.y0), C = ML.fn(G.node, "y")(y0) - ML.fn(Fx.node)(x0);
          if (!isFinite(C)) throw new Error("The given point does not fit this solution (a term is not defined there).");
          o.step(`Use $y = ${ML.nice(y0)}$ when $x = ${ML.nice(x0)}$ to find $C$`); o.m(`C = ${ML.approx(C)}`);
          o.ans(`Particular solution: $${ML.tex(G.node)} = ${ML.tex(Fx.node)} ${C < 0 ? "-" : "+"} ${ML.nice(Math.abs(C))}$`);
        } else o.ans(`General solution: $${ML.tex(G.node)} = ${ML.tex(Fx.node)} + C$`);
      } },
    { id: "homogeneous", title: "Homogeneous equation", sec: "9.5.2", desc: "Solves $\\dfrac{dy}{dx} = F(x, y)$ when $F$ is homogeneous of degree zero, using the substitution $y = vx$.",
      fields: [{ id: "F", label: "$\\dfrac{dy}{dx} = F(x, y) =$", def: "(x^2 + y^2)/(x*y)", wide: true }],
      solve(v, o) {
        const node = ML.parse(v.F), F = ML.fn2(node);
        o.m(`\\dfrac{dy}{dx} = ${ML.tex(node)}`);
        o.step("Check that $F(\\lambda x, \\lambda y) = F(x, y)$");
        const pts = [[1.3, 0.7], [0.6, 2.1], [2.2, 1.4]], homog = pts.every(([x, y]) => [2, 3.5].every((k) => Math.abs(F(k * x, k * y) - F(x, y)) < 1e-8 * Math.max(1, Math.abs(F(x, y)))));
        if (!homog) { o.ans("$F(\\lambda x, \\lambda y) \\ne F(x, y)$, so this is <b>not a homogeneous</b> differential equation. Try the variable separable or linear method instead."); return; }
        o.p("Replacing $x$ by $\\lambda x$ and $y$ by $\\lambda y$ leaves $F$ unchanged, so $F$ is homogeneous of degree zero.");
        const gv = ML.simp(node.transform((n) => (n.isSymbolNode && n.name === "x" ? math.parse("1") : n.isSymbolNode && n.name === "y" ? new math.SymbolNode("v") : n))), h = ML.simp(`(${gv}) - v`);
        o.step("Put $y = vx$, so $\\dfrac{dy}{dx} = v + x\\dfrac{dv}{dx}$"); o.m(`v + x\\dfrac{dv}{dx} = ${ML.tex(gv)} \\quad\\Rightarrow\\quad x\\dfrac{dv}{dx} = ${ML.tex(h)}`);
        if (h.toString() === "0") { o.ans("Here $x\\dfrac{dv}{dx} = 0$, so $v$ is constant and the solution is $y = Cx$."); return; }
        o.step("Separate the variables and integrate"); const inv = ML.simp(`1/(${h})`), V = I(inv, "v");
        o.m(`\\int ${ML.tex(inv)}\\,dv = \\int \\dfrac{dx}{x}`); o.m(`${ML.tex(V.node)} = \\log|x| + C`);
        const back = V.node.transform((n) => (n.isSymbolNode && n.name === "v" ? math.parse("(y/x)") : n));
        o.step("Replace $v$ by $\\dfrac{y}{x}$"); o.m(`${ML.tex(back)} = \\log|x| + C`);
        o.ans(`General solution: $${ML.tex(back)} = \\log|x| + C$`);
      } },
    { id: "linear", title: "Linear equation", sec: "9.5.3", desc: "Solves the linear differential equation $\\dfrac{dy}{dx} + P\\,y = Q$ using the integrating factor $e^{\\int P\\,dx}$.",
      fields: [{ id: "P", label: "$P(x)$", def: "2/x" }, { id: "Q", label: "$Q(x)$", def: "x" }, { id: "x0", label: "Given x = (optional)", def: "" }, { id: "y0", label: "y = (optional)", def: "" }],
      solve(v, o) {
        const P = ML.parse(v.P), Q = ML.parse(v.Q);
        o.m(`\\dfrac{dy}{dx} + \\left(${ML.tex(P)}\\right)y = ${ML.tex(Q)}`);
        o.step("Compare with $\\dfrac{dy}{dx} + Py = Q$"); o.m(`P = ${ML.tex(P)}, \\qquad Q = ${ML.tex(Q)}`);
        const Pi = I(P, "x");
        // e^(k log u) = u^k
        const expOf = (n) => { n = unwrap(n); if (n.isFunctionNode && n.fn.name === "log") return `(${n.args[0]})`; if (n.isOperatorNode && n.fn === "unaryMinus") { const r = expOf(n.args[0]); return r && `1/(${r})`; } if (n.isOperatorNode && n.fn === "multiply") { const [a, b] = n.args; for (const [k, l] of [[a, b], [b, a]]) { const r = !ML.depends(k, "x") && expOf(l); if (r && !/^1\//.test(r)) return `${r}^(${k})`; } } return null; };
        const IF = ML.simp(expOf(ML.simp(Pi.node)) || `e^(${Pi.str})`);
        o.step("Integrating factor"); o.m(`\\int P\\,dx = ${ML.tex(Pi.node)} \\quad\\Rightarrow\\quad \\text{I.F.} = e^{\\int P\\,dx} = ${ML.tex(IF)}`);
        const rhsIn = ML.simp(`(${Q}) * (${IF})`), R = I(rhsIn, "x");
        o.step("Solution: $y \\cdot (\\text{I.F.}) = \\displaystyle\\int Q \\cdot (\\text{I.F.})\\,dx + C$"); o.m(`y\\left(${ML.tex(IF)}\\right) = \\int ${ML.tex(rhsIn)}\\,dx + C = ${ML.tex(R.node)} + C`);
        if (String(v.x0).trim() && String(v.y0).trim()) {
          const x0 = ML.val(v.x0), y0 = ML.val(v.y0), C = y0 * ML.fn(IF)(x0) - ML.fn(R.node)(x0);
          if (!isFinite(C)) throw new Error("The given point does not fit this solution (a term is not defined there).");
          o.step(`Use $y = ${ML.nice(y0)}$ when $x = ${ML.nice(x0)}$`); o.m(`C = ${ML.approx(C)}`);
          o.ans(`Particular solution: $y\\left(${ML.tex(IF)}\\right) = ${ML.tex(R.node)} ${C < 0 ? "-" : "+"} ${ML.nice(Math.abs(C))}$`);
        } else o.ans(`General solution: $y\\left(${ML.tex(IF)}\\right) = ${ML.tex(R.node)} + C$`);
      } },
  ] });
})();
