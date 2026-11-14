/* Chapters 5 and 6: Continuity and Differentiability, Application of Derivatives */
(function () {
  const ML = window.ML, math = window.math;
  const showDiff = (o, expr, v, lhs) => {
    const r = ML.diff(expr, v);
    r.steps.forEach((s) => { o.step(s.rule); o.m(s.tex); });
    if (r.fallback) o.note("This function uses a form I cannot break into steps, so only the final derivative is shown.");
    o.step("Put the pieces together and simplify"); o.m(`${lhs} = ${ML.tex(r.node)}`);
    return r;
  };
  // limit of f at a from one side (dir = -1 left, +1 right)
  const limit = (f, a, dir) => {
    const at = f(a), near = [1e-3, 1e-4, 1e-5, 1e-6, 1e-7].map((h) => f(a + dir * h));
    if (isFinite(at) && Math.abs(near[4] - at) < 1e-5 * Math.max(1, Math.abs(at))) return at;
    if (near.every(isFinite) && Math.abs(near[4] - near[3]) < 1e-5 * Math.max(1, Math.abs(near[4]))) { const q = Math.round(near[4] * 1e5) / 1e5; return Math.abs(q - near[4]) < 2e-6 ? q : near[4]; }
    return NaN;
  };

  ML.chapters.push({ n: 5, id: "differentiability", title: "Continuity and Differentiability", tools: [
    { id: "derivative", title: "Derivative with steps", desc: "Differentiates a function and names the rule used at each stage: product, quotient, chain, exponential, logarithmic and inverse trigonometric rules. Functions like $x^x$ are done by logarithmic differentiation.",
      fields: [{ id: "f", label: "$y =$", def: "x^2 * sin(3x)", wide: true }, { id: "order", label: "Find", type: "select", def: "1", options: [["1", "First derivative dy/dx"], ["2", "Second derivative d²y/dx²"]] }],
      solve(v, o) {
        o.m(`y = ${ML.tex(v.f)}`);
        const r1 = showDiff(o, v.f, "x", "\\dfrac{dy}{dx}");
        if (v.order === "2") {
          o.p("<b>Now differentiate once more.</b>");
          const r2 = showDiff(o, r1.node, "x", "\\dfrac{d^2y}{dx^2}");
          o.ans(`$\\dfrac{d^2y}{dx^2} = ${ML.tex(r2.node)}$`);
        } else o.ans(`$\\dfrac{dy}{dx} = ${ML.tex(r1.node)}$`);
      } },
    { id: "continuity", title: "Continuity at a point", desc: "Tests a function defined by two rules for continuity at the point where the rule changes, by comparing the left-hand limit, the right-hand limit and the value of the function.",
      fields: [{ id: "L", label: "$f(x)$ for $x < a$", def: "2x + 3" }, { id: "R", label: "$f(x)$ for $x > a$", def: "2x - 3" }, { id: "a", label: "Point $a$", def: "2" }, { id: "fa", label: "$f(a)$", def: "7", hint: "The value given at x = a" }],
      solve(v, o) {
        const a = ML.val(v.a), at = ML.nice(a), l = limit(ML.fn(v.L), a, -1), r = limit(ML.fn(v.R), a, 1), fa = ML.val(v.fa);
        o.m(`f(x) = \\begin{cases} ${ML.tex(v.L)}, & x < ${at} \\\\[3pt] ${ML.nice(fa)}, & x = ${at} \\\\[3pt] ${ML.tex(v.R)}, & x > ${at} \\end{cases}`);
        o.step("Left-hand limit"); o.m(`\\lim_{x \\to ${at}^-} f(x) = \\lim_{x \\to ${at}^-} \\left(${ML.tex(v.L)}\\right) = ${ML.nice(l)}`);
        o.step("Right-hand limit"); o.m(`\\lim_{x \\to ${at}^+} f(x) = \\lim_{x \\to ${at}^+} \\left(${ML.tex(v.R)}\\right) = ${ML.nice(r)}`);
        o.step("Value of the function"); o.m(`f(${at}) = ${ML.nice(fa)}`);
        const same = (p, q) => isFinite(p) && isFinite(q) && Math.abs(p - q) < 1e-6 * Math.max(1, Math.abs(p));
        if (!isFinite(l) || !isFinite(r)) o.ans(`A one-sided limit does not exist as a finite number, so f is <b>discontinuous</b> at $x = ${at}$.`);
        else if (!same(l, r)) o.ans(`LHL $= ${ML.nice(l)} \\ne$ RHL $= ${ML.nice(r)}$, so $\\lim_{x \\to ${at}} f(x)$ does not exist and f is <b>discontinuous</b> at $x = ${at}$.`);
        else if (!same(l, fa)) o.ans(`LHL $=$ RHL $= ${ML.nice(l)}$ but $f(${at}) = ${ML.nice(fa)}$, so f is <b>discontinuous</b> at $x = ${at}$. It becomes continuous if $f(${at})$ is defined as $${ML.nice(l)}$.`);
        else o.ans(`LHL $=$ RHL $= f(${at}) = ${ML.nice(l)}$, so f is <b>continuous</b> at $x = ${at}$.`);
      } },
    { id: "parametric", title: "Parametric functions", desc: "Finds $\\dfrac{dy}{dx}$ when $x$ and $y$ are both given in terms of a parameter $t$.",
      fields: [{ id: "x", label: "$x(t) =$", def: "a*(t - sin(t))", hint: "Use t for the parameter (θ in the textbook)" }, { id: "y", label: "$y(t) =$", def: "a*(1 + cos(t))" }],
      solve(v, o) {
        o.m(`x = ${ML.tex(v.x)}, \\qquad y = ${ML.tex(v.y)}`);
        o.p("<b>Differentiate x with respect to t.</b>"); const dx = showDiff(o, v.x, "t", "\\dfrac{dx}{dt}");
        o.p("<b>Differentiate y with respect to t.</b>"); const dy = showDiff(o, v.y, "t", "\\dfrac{dy}{dt}");
        const res = ML.simp(`(${dy.str}) / (${dx.str})`);
        o.step("Divide"); o.m(`\\dfrac{dy}{dx} = \\dfrac{dy/dt}{dx/dt} = \\dfrac{${ML.tex(dy.node)}}{${ML.tex(dx.node)}} = ${ML.tex(res)}`);
        o.ans(`$\\dfrac{dy}{dx} = ${ML.tex(res)}$`);
      } },
    { id: "implicit", title: "Implicit functions", desc: "Finds $\\dfrac{dy}{dx}$ from an equation in $x$ and $y$ that is not solved for $y$.",
      fields: [{ id: "eq", label: "Equation in x and y", def: "x^2 + x*y + y^2 = 100", wide: true }, { id: "x0", label: "At x = (optional)", def: "" }, { id: "y0", label: "and y = (optional)", def: "" }],
      solve(v, o) {
        const parts = String(v.eq).split("=");
        if (parts.length !== 2) throw new Error("Please write the equation with one = sign, e.g. x^2 + y^2 = 25.");
        const Fn = ML.parse(`(${parts[0]}) - (${parts[1]})`);
        const Fx = ML.simp(ML.d(Fn, "x")), Fy = ML.simp(ML.d(Fn, "y"));
        if (Fy.toString() === "0") throw new Error("The equation has no y in it, so there is nothing to differentiate implicitly.");
        o.m(`${ML.tex(parts[0])} = ${ML.tex(parts[1])}`);
        o.step("Differentiate both sides with respect to $x$, treating $y$ as a function of $x$");
        o.p("Each term in $y$ picks up a factor $\\dfrac{dy}{dx}$ by the chain rule. Collecting terms gives");
        o.m(`\\left(${ML.tex(Fx)}\\right) + \\left(${ML.tex(Fy)}\\right)\\dfrac{dy}{dx} = 0`);
        const res = ML.simp(`-(${Fx}) / (${Fy})`);
        o.step("Solve for $\\dfrac{dy}{dx}$"); o.m(`\\dfrac{dy}{dx} = -\\dfrac{${ML.tex(Fx)}}{${ML.tex(Fy)}}`);
        let tail = "";
        if (String(v.x0).trim() && String(v.y0).trim()) { const x0 = ML.val(v.x0), y0 = ML.val(v.y0), val = ML.fn2(res)(x0, y0); o.step(`Value at $(${ML.nice(x0)}, ${ML.nice(y0)})$`); o.m(`\\dfrac{dy}{dx} = ${ML.approx(val)}`); tail = ` At $(${ML.nice(x0)}, ${ML.nice(y0)})$ its value is $${ML.nice(val)}$.`; }
        o.ans(`$\\dfrac{dy}{dx} = -\\dfrac{${ML.tex(Fx)}}{${ML.tex(Fy)}} = ${ML.tex(res)}$.${tail}`);
      } },
  ] });

  ML.chapters.push({ n: 6, id: "application-of-derivatives", title: "Application of Derivatives", tools: [
    { id: "maxmin", title: "Increasing, decreasing, maxima and minima", desc: "Finds the critical points of $f$ on an interval, where it is increasing or decreasing, the local maxima and minima (second derivative test), and the absolute maximum and minimum on the closed interval.",
      fields: [{ id: "f", label: "$f(x) =$", def: "2x^3 - 15x^2 + 36x + 1", wide: true }, { id: "a", label: "Interval from", def: "1" }, { id: "b", label: "to", def: "5" }],
      solve(v, o) {
        const a = ML.val(v.a), b = ML.val(v.b);
        if (!(b > a)) throw new Error("The interval must end after it starts.");
        const f = ML.fn(v.f), d1 = ML.simp(ML.d(v.f)), d2 = ML.simp(ML.d(d1)), f1 = ML.fn(d1), f2 = ML.fn(d2);
        o.m(`f(x) = ${ML.tex(v.f)}, \\qquad x \\in [${ML.nice(a)}, ${ML.nice(b)}]`);
        o.step("Differentiate"); o.m(`f'(x) = ${ML.tex(d1)}`);
        const crit = ML.roots(f1, a, b).filter((c) => c > a + 1e-9 && c < b - 1e-9);
        o.step("Critical points: solve $f'(x) = 0$");
        o.p(crit.length ? `In the interval, $f'(x) = 0$ at $x = ${crit.map(ML.nice).join(",\\ ")}$.` : "$f'(x)$ is never zero inside the interval, so there are no critical points there.");
        const cuts = [a, ...crit, b], rows = [], inc = [], dec = [];
        for (let i = 0; i < cuts.length - 1; i++) { const m = (cuts[i] + cuts[i + 1]) / 2, s = f1(m), I = `(${ML.nice(cuts[i])}, ${ML.nice(cuts[i + 1])})`; (s > 0 ? inc : dec).push(I); rows.push([`$${I}$`, `$f'(${ML.nice(m)}) = ${ML.dec(s)}$`, s > 0 ? "positive" : "negative", s > 0 ? "increasing" : "decreasing"]); }
        o.step("Sign of $f'(x)$ on each part"); o.table(["Interval", "Test value", "Sign of $f'$", "$f$ is"], rows);
        const pts = [];
        if (crit.length) {
          o.step("Second derivative test"); o.m(`f''(x) = ${ML.tex(d2)}`);
          crit.forEach((c) => {
            const s2 = f2(c), before = f1(c - 1e-4), after = f1(c + 1e-4);
            let kind = Math.abs(s2) > 1e-7 ? (s2 > 0 ? "local minimum" : "local maximum") : before > 0 && after < 0 ? "local maximum" : before < 0 && after > 0 ? "local minimum" : "point of inflection (neither)";
            o.p(`At $x = ${ML.nice(c)}$: $f''(${ML.nice(c)}) = ${ML.nice(s2)}$${Math.abs(s2) > 1e-7 ? (s2 > 0 ? " $> 0$" : " $< 0$") : ", so the test fails; using the sign change of $f'$"}, giving a <b>${kind}</b> with value $f(${ML.nice(c)}) = ${ML.approx(f(c))}$.`);
            pts.push({ x: c, y: f(c), label: kind.startsWith("local max") ? "max" : kind.startsWith("local min") ? "min" : "" });
          });
        }
        const cand = [a, ...crit, b].map((x) => ({ x, y: f(x) })).filter((p) => isFinite(p.y));
        const hi = cand.reduce((p, q) => (q.y > p.y ? q : p)), lo = cand.reduce((p, q) => (q.y < p.y ? q : p));
        o.step("Absolute maximum and minimum on the closed interval"); o.p("Compare the values of $f$ at the end points and at the critical points.");
        o.table(["$x$", ...cand.map((p) => `$${ML.nice(p.x)}$`)], [["$f(x)$", ...cand.map((p) => `$${ML.nice(p.y)}$`)]]);
        o.plot({ xmin: a - (b - a) * 0.08, xmax: b + (b - a) * 0.08, fns: [{ f, label: "f(x)" }], points: pts });
        o.ans(`${inc.length ? `Increasing on $${inc.join(" \\cup ")}$. ` : ""}${dec.length ? `Decreasing on $${dec.join(" \\cup ")}$. ` : ""}Absolute maximum $= ${ML.approx(hi.y)}$ at $x = ${ML.nice(hi.x)}$; absolute minimum $= ${ML.approx(lo.y)}$ at $x = ${ML.nice(lo.x)}$.`);
      } },
    { id: "tangent", title: "Tangent and normal", desc: "Finds the slope and the equations of the tangent and the normal to the curve $y = f(x)$ at a given point.",
      fields: [{ id: "f", label: "$y = f(x) =$", def: "x^3 - x", wide: true }, { id: "x0", label: "At x =", def: "2" }],
      solve(v, o) {
        const x0 = ML.val(v.x0), f = ML.fn(v.f), d1 = ML.simp(ML.d(v.f)), y0 = f(x0), m = ML.fn(d1)(x0), X = ML.nice(x0), Y = ML.nice(y0);
        if (!isFinite(y0)) throw new Error("The curve is not defined at this value of x.");
        const sub = (val) => (val < 0 ? `+ ${ML.nice(-val)}` : `- ${ML.nice(val)}`);
        o.m(`y = ${ML.tex(v.f)}`);
        o.step("Point on the curve"); o.m(`y(${X}) = ${Y} \\quad\\Rightarrow\\quad \\text{point } (${X}, ${Y})`);
        o.step("Slope of the tangent"); o.m(`\\dfrac{dy}{dx} = ${ML.tex(d1)} \\quad\\Rightarrow\\quad m = \\left.\\dfrac{dy}{dx}\\right|_{x = ${X}} = ${ML.nice(m)}`);
        if (!isFinite(m)) { o.ans(`The slope is not finite, so the tangent is the vertical line $x = ${X}$ and the normal is $y = ${Y}$.`); return; }
        const c = y0 - m * x0;
        const lineT = (mm, cc) => { const z = (t) => Math.abs(t) < 1e-12; if (z(mm)) return `y = ${ML.nice(cc)}`; const k = ML.nice(Math.abs(mm)); return `y = ${mm < 0 ? "-" : ""}${k === "1" ? "" : k}x${z(cc) ? "" : ` ${cc < 0 ? "-" : "+"} ${ML.nice(Math.abs(cc))}`}`; };
        o.step("Tangent: $y - y_1 = m(x - x_1)$"); o.m(`y ${sub(y0)} = ${ML.nice(m)}\\left(x ${sub(x0)}\\right) \\quad\\Rightarrow\\quad ${lineT(m, c)}`);
        o.step("Normal: slope $= -\\dfrac{1}{m}$");
        let normal;
        if (Math.abs(m) < 1e-12) { normal = `x = ${X}`; o.p(`The tangent is horizontal, so the normal is the vertical line $x = ${X}$.`); }
        else { const mn = -1 / m, cn = y0 - mn * x0; normal = lineT(mn, cn); o.m(`y ${sub(y0)} = ${ML.nice(mn)}\\left(x ${sub(x0)}\\right) \\quad\\Rightarrow\\quad ${normal}`); }
        const w = Math.max(2, Math.abs(x0));
        o.plot({ xmin: x0 - w, xmax: x0 + w, fns: [{ f, label: "curve" }, { f: (x) => m * x + c, label: "tangent" }], points: [{ x: x0, y: y0 }] });
        o.ans(`Slope $= ${ML.nice(m)}$. Tangent: $${lineT(m, c)}$. Normal: $${normal}$.`);
      } },
    { id: "rate", title: "Rate of change", desc: "Finds how fast one quantity changes with time when it depends on another quantity whose rate is known, using the chain rule.",
      fields: [{ id: "q", label: "Quantity (formula)", def: "pi*r^2", hint: "e.g. area of a circle pi*r^2, volume of a sphere (4/3)*pi*r^3" }, { id: "var", label: "Variable", def: "r" }, { id: "rate", label: "Rate of the variable (per unit time)", def: "3" }, { id: "at", label: "When the variable equals", def: "10" }],
      solve(v, o) {
        const x = String(v.var).trim();
        if (!/^[a-zA-Z]$/.test(x) || x === "e") throw new Error("The variable should be a single letter such as r, x or h.");
        const rate = ML.val(v.rate), at = ML.val(v.at), d = ML.simp(ML.d(v.q, x)), dv = ML.fn(d, x)(at), ans = dv * rate;
        o.m(`Q = ${ML.tex(v.q)}, \\qquad \\dfrac{d${x}}{dt} = ${ML.nice(rate)}`);
        o.step(`Differentiate $Q$ with respect to $${x}$`); o.m(`\\dfrac{dQ}{d${x}} = ${ML.tex(d)}`);
        o.step("Chain rule"); o.m(`\\dfrac{dQ}{dt} = \\dfrac{dQ}{d${x}} \\cdot \\dfrac{d${x}}{dt} = \\left(${ML.tex(d)}\\right)(${ML.nice(rate)})`);
        o.step(`Substitute $${x} = ${ML.nice(at)}$`); o.m(`\\dfrac{dQ}{dt} = (${ML.nice(dv)})(${ML.nice(rate)}) = ${ML.approx(ans)}`);
        o.ans(`$\\dfrac{dQ}{dt} = ${ML.approx(ans)}$ units per unit time when $${x} = ${ML.nice(at)}$. ${ans < 0 ? "The negative sign means the quantity is decreasing." : ""}`);
      } },
  ] });
})();
