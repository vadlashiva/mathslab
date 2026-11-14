/* Chapters 12 and 13: Linear Programming, Probability (Part II textbook) */
(function () {
  const ML = window.ML, math = window.math, N = ML.nice;
  const { F, ftex, fadd, fsub, fmul, fdiv, fnum } = ML;

  /* ---------- 12. Linear Programming ---------- */
  const linear = (text) => {
    const f = ML.fn2(text), c = f(0, 0), a = f(1, 0) - c, b = f(0, 1) - c;
    if (![a, b, c].every(isFinite) || Math.abs(f(2, 3) - (c + 2 * a + 3 * b)) > 1e-9) throw new Error(`"${text}" must be linear in x and y, like 3x + 2y.`);
    return { a, b, c };
  };
  const linT = (a, b) => { let s = ""; [[a, "x"], [b, "y"]].forEach(([c, n]) => { if (Math.abs(c) < 1e-12) return; const m = N(Math.abs(c)); s += (c < 0 ? (s ? " - " : "-") : s ? " + " : "") + (m === "1" ? "" : m) + n; }); return s || "0"; };
  const OPS = { le: "\\le", ge: "\\ge", eq: "=" };
  const holds = (k, x, y, eps = 1e-7) => { const v = k.a * x + k.b * y - k.c, t = eps * Math.max(1, Math.abs(k.c)); return k.op === "le" ? v <= t : k.op === "ge" ? v >= -t : Math.abs(v) <= t; };
  const corners = (cons) => {
    const pts = [];
    for (let i = 0; i < cons.length; i++) for (let j = i + 1; j < cons.length; j++) {
      const p = cons[i], q = cons[j], det = p.a * q.b - q.a * p.b; if (Math.abs(det) < 1e-12) continue;
      const x = (p.c * q.b - q.c * p.b) / det, y = (p.a * q.c - q.a * p.c) / det;
      if (cons.every((k) => holds(k, x, y)) && !pts.some((t) => Math.abs(t[0] - x) < 1e-7 && Math.abs(t[1] - y) < 1e-7)) pts.push([x, y]);
    }
    return pts;
  };
  // clip a polygon by the half-plane of one constraint (Sutherland–Hodgman)
  const clip = (poly, k) => {
    if (k.op === "eq") return poly;
    const inside = (p) => (k.op === "le" ? k.a * p[0] + k.b * p[1] <= k.c + 1e-9 : k.a * p[0] + k.b * p[1] >= k.c - 1e-9), out = [];
    poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], ip = inside(p), iq = inside(q); if (ip) out.push(p); if (ip !== iq) { const t = (k.c - k.a * p[0] - k.b * p[1]) / (k.a * (q[0] - p[0]) + k.b * (q[1] - p[1])); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } });
    return out;
  };
  ML.chapters.push({ n: 12, id: "linear-programming", title: "Linear Programming", tools: [
    { id: "graphical", title: "Graphical (corner point) method", sec: "12.2", desc: "Solves a linear programming problem in two variables by the corner point method: draws the feasible region, lists its corner points and evaluates $Z$ at each one. Unbounded regions are tested the way the textbook describes.",
      fields: [{ id: "type", label: "Objective", type: "select", def: "max", options: [["max", "Maximise Z"], ["min", "Minimise Z"]] }, { id: "Z", label: "$Z =$", def: "4x + y" },
        { id: "cons", label: "Constraints (one per line)", type: "area", rows: 4, def: "x + y <= 50\n3x + y <= 90", hint: "Use <= and >= for ≤ and ≥" }, { id: "nn", label: "Non-negativity", type: "select", def: "yes", options: [["yes", "x ≥ 0, y ≥ 0"], ["no", "Not required"]] }],
      solve(v, o) {
        const Z = linear(v.Z), isMax = v.type === "max", cons = [];
        String(v.cons).split(/\n|;/).map((s) => s.trim()).filter(Boolean).forEach((line) => {
          const m = line.replace(/≤/g, "<=").replace(/≥/g, ">=").match(/^(.*?)(<=|>=|=<|=>|<|>|=)(.*)$/);
          if (!m) throw new Error(`"${line}" needs <=, >= or = between its two sides.`);
          const L = linear(`(${m[1]}) - (${m[3]})`);
          if (Math.abs(L.a) < 1e-12 && Math.abs(L.b) < 1e-12) throw new Error(`"${line}" has no x or y in it.`);
          cons.push({ a: L.a, b: L.b, c: -L.c, op: /</.test(m[2]) ? "le" : />/.test(m[2]) ? "ge" : "eq", user: true });
        });
        if (!cons.length) throw new Error("Please enter at least one constraint.");
        if (v.nn === "yes") cons.push({ a: 1, b: 0, c: 0, op: "ge" }, { a: 0, b: 1, c: 0, op: "ge" });
        const zval = (p) => Z.a * p[0] + Z.b * p[1] + Z.c;
        o.m(`\\text{${isMax ? "Maximise" : "Minimise"} } Z = ${linT(Z.a, Z.b)}${Z.c ? ` + ${N(Z.c)}` : ""}`); o.m(`\\text{subject to}\\quad ${cons.map((k) => `${linT(k.a, k.b)} ${OPS[k.op]} ${N(k.c)}`).join(",\\quad ")}`);
        const pts = corners(cons);
        const M = 1e6, box = [{ a: 1, b: 0, c: M, op: "le" }, { a: 1, b: 0, c: -M, op: "ge" }, { a: 0, b: 1, c: M, op: "le" }, { a: 0, b: 1, c: -M, op: "ge" }], big = corners([...cons, ...box]);
        if (!big.length) { o.ans("No point satisfies all the constraints together, so there is <b>no feasible region</b> and the problem has no solution."); return; }
        const unbounded = big.some((p) => Math.abs(Math.abs(p[0]) - M) < 1 || Math.abs(Math.abs(p[1]) - M) < 1);
        if (!pts.length) { o.ans("The feasible region has no corner point, so the corner point method does not give an optimal value here."); return; }
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
        o.step("Draw each constraint as a line and shade the common region"); o.p(`The feasible region is <b>${unbounded ? "unbounded" : "bounded"}</b>.`);
        const xs = pts.map((p) => p[0]).concat(0), ys = pts.map((p) => p[1]).concat(0), w = Math.max(...xs) - Math.min(...xs) || 1, h = Math.max(...ys) - Math.min(...ys) || 1;
        const view = { xmin: Math.min(...xs) - w * 0.15, xmax: Math.max(...xs) + w * (unbounded ? 0.6 : 0.25), ymin: Math.min(...ys) - h * 0.15, ymax: Math.max(...ys) + h * (unbounded ? 0.6 : 0.25) };
        let poly = [[view.xmin, view.ymin], [view.xmax, view.ymin], [view.xmax, view.ymax], [view.xmin, view.ymax]]; cons.forEach((k) => { if (poly.length) poly = clip(poly, k); });
        const names = "ABCDEFGHJK";
        o.plot({ ...view, polygon: poly, lines: cons.filter((k) => k.user).map((k) => ({ a: k.a, b: k.b, c: k.c, label: `${linT(k.a, k.b).replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, "$1/$2")} = ${ML.dec(k.c)}` })), points: pts.map((p, i) => ({ x: p[0], y: p[1], label: `${names[i] || ""} (${ML.dec(p[0])}, ${ML.dec(p[1])})` })) });
        o.step("Find the corner points"); o.p("Each corner is the intersection of two boundary lines that also satisfies every other constraint.");
        const vals = pts.map(zval), best = isMax ? Math.max(...vals) : Math.min(...vals), at = pts.filter((_, i) => Math.abs(vals[i] - best) < 1e-9 * Math.max(1, Math.abs(best)));
        o.step("Evaluate $Z$ at each corner point");
        o.table(["Corner point", `$Z = ${linT(Z.a, Z.b)}$`, ""], pts.map((p, i) => [`$${names[i] || ""}\\,(${N(p[0])}, ${N(p[1])})$`, `$${N(vals[i])}$`, Math.abs(vals[i] - best) < 1e-9 * Math.max(1, Math.abs(best)) ? `← ${isMax ? "Maximum" : "Minimum"}` : ""]));
        const where = at.length > 1 ? `every point on the segment joining $(${N(at[0][0])}, ${N(at[0][1])})$ and $(${N(at[1][0])}, ${N(at[1][1])})$` : `$(${N(at[0][0])}, ${N(at[0][1])})$`;
        if (unbounded) {
          const bv = big.map(zval), beyond = isMax ? Math.max(...bv) > best + 1e-6 * Math.max(1, Math.abs(best)) : Math.min(...bv) < best - 1e-6 * Math.max(1, Math.abs(best));
          o.step(`The region is unbounded, so test the open half-plane $${linT(Z.a, Z.b)} ${isMax ? ">" : "<"} ${N(best)}$`);
          if (beyond) { o.p("This half-plane has points in common with the feasible region."); o.ans(`$Z$ has <b>no ${isMax ? "maximum" : "minimum"} value</b>: it can be made ${isMax ? "as large" : "as small"} as we like within the feasible region.`); return; }
          o.p(`This half-plane has no point in common with the feasible region, so $${N(best)}$ is the ${isMax ? "maximum" : "minimum"} value.`);
        }
        o.ans(`${isMax ? "Maximum" : "Minimum"} $Z = ${N(best)}$ at ${where}.`);
      } },
  ] });

  /* ---------- 13. Probability ---------- */
  const prob = (s, name) => { const p = F(s), x = fnum(p); if (x < 0 || x > 1) throw new Error(`${name} must be between 0 and 1.`); return p; };
  const fd = (p) => { const t = ftex(p); return /dfrac/.test(t) ? `${t} \\approx ${ML.dec(fnum(p))}` : t; };
  const ONE = () => math.fraction(1);
  const fpow = (p, k) => { let r = ONE(); for (let i = 0; i < k; i++) r = fmul(r, p); return r; };
  const comb = (n, r) => { let c = ONE(); for (let i = 1; i <= r; i++) c = fdiv(fmul(c, math.fraction(n - r + i)), math.fraction(i)); return c; };
  ML.chapters.push({ n: 13, id: "probability", title: "Probability", tools: [
    { id: "conditional", title: "Conditional probability and independence", sec: "13.2–13.4", desc: "From $P(A)$, $P(B)$ and $P(A \\cap B)$, finds $P(A|B)$, $P(B|A)$ and $P(A \\cup B)$, and tests whether the events are independent.",
      fields: [{ id: "A", label: "$P(A)$", def: "7/13" }, { id: "B", label: "$P(B)$", def: "9/13" }, { id: "AB", label: "$P(A \\cap B)$", def: "4/13" }],
      solve(v, o) {
        const A = prob(v.A, "P(A)"), B = prob(v.B, "P(B)"), AB = prob(v.AB, "P(A ∩ B)");
        if (fnum(AB) > Math.min(fnum(A), fnum(B)) + 1e-12) throw new Error("P(A ∩ B) cannot be larger than P(A) or P(B).");
        if (fnum(A) === 0 || fnum(B) === 0) throw new Error("P(A) and P(B) must be greater than 0 for the conditional probabilities to exist.");
        const U = fsub(fadd(A, B), AB); if (fnum(U) > 1 + 1e-12) throw new Error("These values give P(A ∪ B) greater than 1, so they are not possible together.");
        o.step("$P(A|B) = \\dfrac{P(A \\cap B)}{P(B)}$"); o.m(`P(A|B) = \\dfrac{${ftex(AB)}}{${ftex(B)}} = ${fd(fdiv(AB, B))}`);
        o.step("$P(B|A) = \\dfrac{P(A \\cap B)}{P(A)}$"); o.m(`P(B|A) = \\dfrac{${ftex(AB)}}{${ftex(A)}} = ${fd(fdiv(AB, A))}`);
        o.step("$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$"); o.m(`P(A \\cup B) = ${ftex(A)} + ${ftex(B)} - ${ftex(AB)} = ${fd(U)}`);
        const ind = fnum(fsub(fmul(A, B), AB)) === 0;
        o.step("Independence: is $P(A \\cap B) = P(A)\\,P(B)$?"); o.m(`P(A)\\,P(B) = ${ftex(A)} \\times ${ftex(B)} = ${ftex(fmul(A, B))} ${ind ? "=" : "\\ne"} ${ftex(AB)} = P(A \\cap B)`);
        o.ans(`$P(A|B) = ${ftex(fdiv(AB, B))}$, $P(B|A) = ${ftex(fdiv(AB, A))}$, $P(A \\cup B) = ${ftex(U)}$. A and B are <b>${ind ? "independent" : "not independent"}</b>.`);
      } },
    { id: "bayes", title: "Bayes' theorem", sec: "13.5", desc: "Finds the total probability of an event $A$ and the probability of each cause $E_i$ given that $A$ has occurred.",
      fields: [{ id: "rows", label: "One line per hypothesis: name, $P(E_i)$, $P(A|E_i)$", type: "area", rows: 4, def: "Bag I, 1/2, 3/7\nBag II, 1/2, 5/11", hint: "Example: a red ball is drawn; Bag I has 3 red of 7 balls and Bag II has 5 red of 11" }],
      solve(v, o) {
        const rows = String(v.rows).split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => { const p = line.split(","); if (p.length < 3) throw new Error(`Line ${i + 1} needs a name and two probabilities, separated by commas.`); return { name: p.slice(0, -2).join(",").trim() || `E${i + 1}`, pe: prob(p[p.length - 2], "Each P(E)"), pa: prob(p[p.length - 1], "Each P(A|E)") }; });
        if (rows.length < 2) throw new Error("Please enter at least two hypotheses.");
        const sum = rows.reduce((s, r) => fadd(s, r.pe), math.fraction(0));
        if (fnum(sum) !== 1) throw new Error(`The probabilities $P(E_i)$ must add up to 1, but they add up to ${sum.toFraction()}.`);
        o.step("Write what is given"); o.table(["Hypothesis $E_i$", "$P(E_i)$", "$P(A|E_i)$"], rows.map((r) => [r.name, `$${ftex(r.pe)}$`, `$${ftex(r.pa)}$`]));
        const tot = rows.reduce((s, r) => fadd(s, fmul(r.pe, r.pa)), math.fraction(0));
        if (fnum(tot) === 0) throw new Error("P(A) works out to 0, so A cannot occur and the conditional probabilities are not defined.");
        o.step("Total probability $P(A) = \\sum P(E_i)\\,P(A|E_i)$"); o.m(`P(A) = ${rows.map((r) => `${ftex(r.pe)} \\times ${ftex(r.pa)}`).join(" + ")} = ${fd(tot)}`);
        o.step("Bayes' theorem $P(E_i|A) = \\dfrac{P(E_i)\\,P(A|E_i)}{P(A)}$");
        rows.forEach((r) => { r.post = fdiv(fmul(r.pe, r.pa), tot); o.m(`P(\\text{${r.name.replace(/[\\{}$%#&_^~]/g, "")}}\\,|\\,A) = \\dfrac{${ftex(r.pe)} \\times ${ftex(r.pa)}}{${ftex(tot)}} = ${fd(r.post)}`); });
        o.ans(`$P(A) = ${ftex(tot)}$. ` + rows.map((r) => `P(${r.name} | A) $= ${ftex(r.post)}$`).join(", ") + ".");
      } },
    { id: "random-variable", title: "Mean and variance of a random variable", sec: "13.6", desc: "Finds the mean $E(X)$, the variance and the standard deviation of a random variable from its probability distribution.",
      fields: [{ id: "x", label: "Values of $X$", def: "1, 2, 3, 4, 5, 6", wide: true }, { id: "p", label: "Probabilities $P(X)$", def: "1/6, 1/6, 1/6, 1/6, 1/6, 1/6", wide: true }],
      solve(v, o) {
        const xs = String(v.x).split(/[\s,]+/).filter(Boolean).map(F), ps = String(v.p).split(/[\s,]+/).filter(Boolean).map((s) => prob(s, "Each probability"));
        if (xs.length !== ps.length || !xs.length) throw new Error("Give the same number of values and probabilities.");
        const Z = () => math.fraction(0), sum = ps.reduce(fadd, Z());
        if (fnum(sum) !== 1) throw new Error(`The probabilities must add up to 1, but they add up to ${sum.toFraction()}.`);
        const xp = xs.map((x, i) => fmul(x, ps[i])), x2p = xs.map((x, i) => fmul(fmul(x, x), ps[i])), mean = xp.reduce(fadd, Z()), ex2 = x2p.reduce(fadd, Z()), vr = fsub(ex2, fmul(mean, mean));
        o.step("Build the table"); o.table(["$x_i$", "$p_i$", "$x_i p_i$", "$x_i^2 p_i$"], xs.map((x, i) => [`$${ftex(x)}$`, `$${ftex(ps[i])}$`, `$${ftex(xp[i])}$`, `$${ftex(x2p[i])}$`]).concat([["<b>Total</b>", "$1$", `$${ftex(mean)}$`, `$${ftex(ex2)}$`]]));
        o.step("Mean $E(X) = \\sum x_i p_i$"); o.m(`E(X) = ${fd(mean)}`);
        o.step("Variance $= E(X^2) - [E(X)]^2$"); o.m(`\\text{Var}(X) = ${ftex(ex2)} - \\left(${ftex(mean)}\\right)^2 = ${fd(vr)}`);
        o.step("Standard deviation $= \\sqrt{\\text{Var}(X)}$"); o.m(`\\sigma = ${ML.approx(Math.sqrt(fnum(vr)))}`);
        o.ans(`Mean $= ${ftex(mean)}$, variance $= ${ftex(vr)}$, standard deviation $\\approx ${ML.dec(Math.sqrt(fnum(vr)))}$`);
      } },
    { id: "binomial", title: "Binomial distribution", sec: "13.7", desc: "For $n$ Bernoulli trials with probability of success $p$, finds $P(X = r)$, $P(X \\le r)$ or $P(X \\ge r)$ along with the mean and variance.",
      fields: [{ id: "n", label: "Number of trials $n$", def: "10" }, { id: "p", label: "Probability of success $p$", def: "1/2" }, { id: "type", label: "Find", type: "select", def: "eq", options: [["eq", "Exactly r successes"], ["le", "At most r successes"], ["ge", "At least r successes"]] }, { id: "r", label: "$r$", def: "6" }],
      solve(v, o) {
        const n = Number(v.n), r = Number(v.r), p = prob(v.p, "p"), q = fsub(ONE(), p);
        if (!Number.isInteger(n) || n < 1 || n > 60) throw new Error("n should be a whole number from 1 to 60.");
        if (!Number.isInteger(r) || r < 0 || r > n) throw new Error("r should be a whole number from 0 to n.");
        const P = (k) => fmul(comb(n, k), fmul(fpow(p, k), fpow(q, n - k)));
        o.m(`n = ${n}, \\quad p = ${ftex(p)}, \\quad q = 1 - p = ${ftex(q)}`);
        o.step("Binomial distribution $P(X = x) = {}^{n}C_{x}\\,q^{\\,n-x}\\,p^{x}$");
        const ks = v.type === "eq" ? [r] : v.type === "le" ? [...Array(r + 1).keys()] : [...Array(n - r + 1).keys()].map((i) => i + r), useComp = ks.length > n / 2 + 1 && v.type !== "eq";
        const sym = v.type === "eq" ? `P(X = ${r})` : v.type === "le" ? `P(X \\le ${r})` : `P(X \\ge ${r})`;
        let ans;
        if (useComp) {
          const rest = [...Array(n + 1).keys()].filter((k) => !ks.includes(k)), s = rest.reduce((t, k) => fadd(t, P(k)), math.fraction(0)); ans = fsub(ONE(), s);
          o.p("It is shorter to use the complement."); o.m(`${sym} = 1 - \\left[${rest.map((k) => `P(X = ${k})`).join(" + ")}\\right]`);
          rest.forEach((k) => o.m(`P(X = ${k}) = {}^{${n}}C_{${k}}\\left(${ftex(q)}\\right)^{${n - k}}\\left(${ftex(p)}\\right)^{${k}} = ${ftex(P(k))}`)); o.m(`${sym} = 1 - ${ftex(s)} = ${fd(ans)}`);
        } else {
          ans = ks.reduce((t, k) => fadd(t, P(k)), math.fraction(0));
          if (ks.length > 1) o.m(`${sym} = ${ks.map((k) => `P(X = ${k})`).join(" + ")}`);
          ks.forEach((k) => o.m(`P(X = ${k}) = {}^{${n}}C_{${k}}\\left(${ftex(q)}\\right)^{${n - k}}\\left(${ftex(p)}\\right)^{${k}} = ${ftex(comb(n, k))} \\times ${ftex(fpow(q, n - k))} \\times ${ftex(fpow(p, k))} = ${ftex(P(k))}`));
          if (ks.length > 1) o.m(`${sym} = ${fd(ans)}`);
        }
        const mean = fmul(math.fraction(n), p), vr = fmul(mean, q);
        o.step("Mean $= np$ and variance $= npq$"); o.m(`\\text{Mean} = ${ftex(mean)}, \\qquad \\text{Variance} = ${ftex(vr)}`);
        o.ans(`$${sym} = ${fd(ans)}$. Mean $= ${ftex(mean)}$, variance $= ${ftex(vr)}$.`);
      } },
  ] });
})();
