/* Chapters 1 to 4: Relations and Functions, Inverse Trigonometric Functions, Matrices, Determinants */
(function () {
  const ML = window.ML, math = window.math;
  const { F, ftex, fpar, fadd, fsub, fmul, fdiv, fzero, fnum, mtex, parseMatrix } = ML;
  const list = (text) => String(text).split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const setTex = (a) => `\\{${a.join(",\\ ")}\\}`;
  const square = (M, name = "The matrix") => { if (M.length !== M[0].length) throw new Error(`${name} must be square (same number of rows and columns).`); if (M.length > 4) throw new Error("Matrices up to 4 × 4 are supported."); return M; };

  /* ---------- 1. Relations and Functions ---------- */
  ML.chapters.push({ n: 1, id: "relations", title: "Relations and Functions", tools: [
    { id: "relation", title: "Type of relation", desc: "Checks whether a relation on a finite set is reflexive, symmetric and transitive, and lists the equivalence classes when it is an equivalence relation.",
      fields: [{ id: "A", label: "Set A", def: "1, 2, 3", hint: "Elements separated by commas" }, { id: "R", label: "Relation R (ordered pairs)", def: "(1,1), (2,2), (3,3), (1,2), (2,1)", wide: true }],
      solve(v, o) {
        const A = [...new Set(list(v.A))], pairs = [...String(v.R).matchAll(/\(\s*([^,()\s]+)\s*,\s*([^,()\s]+)\s*\)/g)].map((m) => [m[1], m[2]]);
        if (!A.length) throw new Error("Please enter the elements of set A.");
        if (!pairs.length) throw new Error("Please enter the relation as ordered pairs, e.g. (1,2), (2,1).");
        pairs.forEach(([a, b]) => { if (!A.includes(a) || !A.includes(b)) throw new Error(`The pair (${a}, ${b}) uses an element that is not in set A.`); });
        const has = (a, b) => pairs.some((p) => p[0] === a && p[1] === b), pr = (a, b) => `(${a}, ${b})`;
        o.m(`A = ${setTex(A)}, \\quad R = \\{${pairs.map((p) => pr(...p)).join(",\\ ")}\\}`);
        const miss = A.filter((a) => !has(a, a));
        o.step("Reflexive: is $(a, a) \\in R$ for every $a \\in A$?");
        o.p(miss.length ? `No. $${miss.map((a) => pr(a, a)).join(", ")} \\notin R$, so R is <b>not reflexive</b>.` : `Yes. $${A.map((a) => pr(a, a)).join(", ")}$ are all in R, so R is <b>reflexive</b>.`);
        const ns = pairs.find(([a, b]) => !has(b, a));
        o.step("Symmetric: does $(a, b) \\in R$ always give $(b, a) \\in R$?");
        o.p(ns ? `No. $${pr(...ns)} \\in R$ but $${pr(ns[1], ns[0])} \\notin R$, so R is <b>not symmetric</b>.` : "Yes. Every pair has its reverse in R, so R is <b>symmetric</b>.");
        let nt = null;
        for (const [a, b] of pairs) { for (const [c, d] of pairs) if (b === c && !has(a, d)) { nt = [a, b, d]; break; } if (nt) break; }
        o.step("Transitive: do $(a, b) \\in R$ and $(b, c) \\in R$ always give $(a, c) \\in R$?");
        o.p(nt ? `No. $${pr(nt[0], nt[1])} \\in R$ and $${pr(nt[1], nt[2])} \\in R$ but $${pr(nt[0], nt[2])} \\notin R$, so R is <b>not transitive</b>.` : "Yes. No pair of links breaks the rule, so R is <b>transitive</b>.");
        const eq = !miss.length && !ns && !nt;
        if (eq) {
          const classes = []; A.forEach((a) => { const c = A.filter((b) => has(a, b)); if (!classes.some((k) => k.join() === c.join())) classes.push(c); });
          o.step("Equivalence classes"); o.m(classes.map((c) => `[${c[0]}] = ${setTex(c)}`).join(", \\quad "));
        }
        o.ans(`R is ${miss.length ? "not reflexive" : "reflexive"}, ${ns ? "not symmetric" : "symmetric"} and ${nt ? "not transitive" : "transitive"}. ${eq ? "So R is an <b>equivalence relation</b>." : "So R is <b>not an equivalence relation</b>."}`);
      } },
    { id: "function", title: "One-one and onto", desc: "Checks whether a mapping between finite sets is a function, and whether it is one-one (injective), onto (surjective) or bijective.",
      fields: [{ id: "A", label: "Domain A", def: "1, 2, 3" }, { id: "B", label: "Codomain B", def: "4, 5, 6, 7" }, { id: "f", label: "Mapping f", def: "1->4, 2->5, 3->6", wide: true, hint: "Write each pair as element->image" }],
      solve(v, o) {
        const A = [...new Set(list(v.A))], B = [...new Set(list(v.B))];
        const map = [...String(v.f).matchAll(/([^,;\s>→:-]+)\s*(?:->|→|:)\s*([^,;\s]+)/g)].map((m) => [m[1], m[2]]);
        if (!A.length || !B.length || !map.length) throw new Error("Please enter the domain, the codomain and the mapping.");
        map.forEach(([a, b]) => { if (!A.includes(a)) throw new Error(`${a} is not in the domain A.`); if (!B.includes(b)) throw new Error(`${b} is not in the codomain B.`); });
        o.m(`f : A \\to B,\\quad A = ${setTex(A)},\; B = ${setTex(B)},\\quad f = \\{${map.map(([a, b]) => `(${a}, ${b})`).join(",\\ ")}\\}`);
        o.step("Is f a function?");
        const none = A.filter((a) => !map.some((m) => m[0] === a)), many = A.filter((a) => new Set(map.filter((m) => m[0] === a).map((m) => m[1])).size > 1);
        if (none.length || many.length) { o.p(none.length ? `$${none.join(", ")}$ has no image.` : `$${many.join(", ")}$ has more than one image.`); o.ans("f is <b>not a function</b>, because every element of the domain must have exactly one image."); return; }
        o.p("Yes. Every element of A has exactly one image in B.");
        const img = (a) => map.find((m) => m[0] === a)[1];
        o.step("One-one: do different elements have different images?");
        let clash = null; A.forEach((a, i) => A.slice(i + 1).forEach((b) => { if (!clash && img(a) === img(b)) clash = [a, b]; }));
        o.p(clash ? `No. $f(${clash[0]}) = f(${clash[1]}) = ${img(clash[0])}$ although $${clash[0]} \\ne ${clash[1]}$. f is <b>not one-one</b> (it is many-one).` : "Yes. No two elements share an image, so f is <b>one-one</b>.");
        const range = [...new Set(A.map(img))], left = B.filter((b) => !range.includes(b));
        o.step("Onto: is the range equal to the codomain?");
        o.m(`\\text{Range} = ${setTex(range)}`);
        o.p(left.length ? `No. $${left.join(", ")}$ in B has no pre-image, so f is <b>not onto</b>.` : "Yes. Every element of B has a pre-image, so f is <b>onto</b>.");
        const bij = !clash && !left.length;
        if (bij) { o.step("Inverse"); o.m(`f^{-1} = \\{${A.map((a) => `(${img(a)}, ${a})`).join(",\\ ")}\\}`); }
        o.ans(`f is ${clash ? "many-one" : "one-one"} and ${left.length ? "into (not onto)" : "onto"}. ${bij ? "So f is <b>bijective</b> and invertible." : "So f is <b>not bijective</b>."}`);
      } },
    { id: "compose", title: "Composition of functions", desc: "Finds $f \\circ g$ and $g \\circ f$ for two functions of x, and their values at a point.",
      fields: [{ id: "f", label: "$f(x)$", def: "x^2 + 1" }, { id: "g", label: "$g(x)$", def: "2x - 3" }, { id: "a", label: "Evaluate at x =", def: "2" }],
      solve(v, o) {
        const f = ML.parse(v.f), g = ML.parse(v.g);
        const sub = (outer, inner) => outer.transform((n) => (n.isSymbolNode && n.name === "x" ? new math.ParenthesisNode(inner) : n));
        const fog = sub(f, g), gof = sub(g, f), sf = ML.simp(math.rationalize ? tryRat(fog) : fog), sg = tryRat(gof);
        function tryRat(n) { try { return math.rationalize(n); } catch (e) { return ML.simp(n); } }
        o.m(`f(x) = ${ML.tex(f)}, \\qquad g(x) = ${ML.tex(g)}`);
        o.step("$f \\circ g$: put $g(x)$ in place of $x$ in $f$");
        o.m(`(f \\circ g)(x) = f(g(x)) = ${ML.tex(fog)} = ${ML.tex(tryRat(fog))}`);
        o.step("$g \\circ f$: put $f(x)$ in place of $x$ in $g$");
        o.m(`(g \\circ f)(x) = g(f(x)) = ${ML.tex(gof)} = ${ML.tex(sg)}`);
        let extra = "";
        if (String(v.a).trim()) { const a = ML.val(v.a), p = ML.fn(fog)(a), q = ML.fn(gof)(a); o.step(`Values at $x = ${ML.nice(a)}$`); o.m(`(f \\circ g)(${ML.nice(a)}) = ${ML.approx(p)}, \\qquad (g \\circ f)(${ML.nice(a)}) = ${ML.approx(q)}`); extra = Math.abs(p - q) > 1e-9 ? " Here $f \\circ g \\ne g \\circ f$: composition is not commutative in general." : ""; }
        o.ans(`$(f \\circ g)(x) = ${ML.tex(tryRat(fog))}$ and $(g \\circ f)(x) = ${ML.tex(sg)}$.${extra}`);
      } },
  ] });

  /* ---------- 2. Inverse Trigonometric Functions ---------- */
  const INV = {
    asin: ["\\sin^{-1}", "\\sin", "\\left[-\\dfrac{\\pi}{2}, \\dfrac{\\pi}{2}\\right]", (x) => Math.abs(x) <= 1, "[-1, 1]"],
    acos: ["\\cos^{-1}", "\\cos", "[0, \\pi]", (x) => Math.abs(x) <= 1, "[-1, 1]"],
    atan: ["\\tan^{-1}", "\\tan", "\\left(-\\dfrac{\\pi}{2}, \\dfrac{\\pi}{2}\\right)", () => true, "\\mathbb{R}"],
    acsc: ["\\text{cosec}^{-1}", "\\text{cosec}", "\\left[-\\dfrac{\\pi}{2}, \\dfrac{\\pi}{2}\\right] - \\{0\\}", (x) => Math.abs(x) >= 1, "\\mathbb{R} - (-1, 1)"],
    asec: ["\\sec^{-1}", "\\sec", "[0, \\pi] - \\left\\{\\dfrac{\\pi}{2}\\right\\}", (x) => Math.abs(x) >= 1, "\\mathbb{R} - (-1, 1)"],
    acot: ["\\cot^{-1}", "\\cot", "(0, \\pi)", () => true, "\\mathbb{R}"],
  };
  const deg = (r) => `${+((r * 180) / Math.PI).toFixed(4)}^{\\circ}`;
  ML.chapters.push({ n: 2, id: "inverse-trig", title: "Inverse Trigonometric Functions", tools: [
    { id: "principal", title: "Principal value", desc: "Finds the principal value of an inverse trigonometric function, using the principal value branch from the textbook.",
      fields: [{ id: "fn", label: "Function", type: "select", def: "asin", options: [["asin", "sin⁻¹"], ["acos", "cos⁻¹"], ["atan", "tan⁻¹"], ["acsc", "cosec⁻¹"], ["asec", "sec⁻¹"], ["acot", "cot⁻¹"]] }, { id: "x", label: "Value", def: "-1/2", hint: "For example 1/2, -sqrt(3)/2, 1/sqrt(2), sqrt(3)" }],
      solve(v, o) {
        const [name, direct, range, ok, dom] = INV[v.fn], x = ML.val(v.x), xt = ML.tex(v.x);
        if (!ok(x)) throw new Error(`$${name}$ is defined only for values in $${dom}$, so this has no value.`);
        const y = math[v.fn](x);
        o.step(`Let $y = ${name}\\left(${xt}\\right)$`); o.m(`${direct}\\, y = ${xt}`);
        o.step("Use the principal value branch"); o.p(`The principal value branch of $${name}$ is $${range}$.`);
        o.step("Pick the angle in that range"); o.m(`${direct}\\left(${ML.nice(y)}\\right) = ${ML.nice(x)} \\quad\\text{and}\\quad ${ML.nice(y)} \\in ${range}`);
        o.ans(`$${name}\\left(${xt}\\right) = ${ML.approx(y)}$ radians $= ${deg(y)}$`);
      } },
    { id: "evaluate", title: "Evaluate an expression", desc: "Evaluates an expression made of inverse trigonometric functions, using the principal value of each one.",
      fields: [{ id: "e", label: "Expression", def: "atan(1) + acos(-1/2) + asin(-1/2)", wide: true, hint: "Use asin, acos, atan, acot, asec, acosec (or sin^-1 and so on)" }],
      solve(v, o) {
        const node = ML.parse(String(v.e).replace(/acosec/g, "acsc")), seen = [];
        node.traverse((n) => { if (n.isFunctionNode && INV[n.fn.name] && n.args.length === 1) { try { const a = n.args[0].compile().evaluate({}); if (typeof a === "number" && !seen.some((s) => s.t === n.toString())) seen.push({ t: n.toString(), n, a }); } catch (e) { /* inner value depends on something else */ } } });
        o.m(ML.tex(node));
        if (seen.length) {
          o.step("Principal value of each inverse function");
          seen.forEach(({ n, a }) => { const I = INV[n.fn.name]; if (!I[3](a)) throw new Error(`$${ML.tex(n)}$ is not defined, because ${ML.dec(a)} is outside $${I[4]}$.`); o.m(`${ML.tex(n)} = ${ML.nice(math[n.fn.name](a))} \\qquad \\text{(range } ${I[2]}\\text{)}`); });
        }
        const val = node.compile().evaluate({});
        if (typeof val !== "number" || !isFinite(val)) throw new Error("This expression does not have a real value.");
        o.step("Combine"); o.m(`${ML.tex(node)} = ${ML.approx(val)}`);
        o.ans(`Value $= ${ML.approx(val)}$`);
      } },
  ] });

  /* ---------- 3. Matrices ---------- */
  const order = (M) => `${M.length} \\times ${M[0].length}`;
  ML.chapters.push({ n: 3, id: "matrices", title: "Matrices", tools: [
    { id: "operations", title: "Matrix operations", desc: "Adds, subtracts and multiplies matrices, multiplies by a scalar, and finds the transpose. Type one row per line.",
      fields: [{ id: "op", label: "Operation", type: "select", def: "mul", options: [["add", "A + B"], ["sub", "A − B"], ["mul", "AB"], ["scalar", "kA"], ["transpose", "Transpose of A"]] }, { id: "k", label: "Scalar k (for kA)", def: "2" },
        { id: "A", label: "Matrix A", type: "area", def: "1 2 3\n4 5 6", rows: 3 }, { id: "B", label: "Matrix B", type: "area", def: "7 8\n9 10\n11 12", rows: 3 }],
      solve(v, o) {
        const A = parseMatrix(v.A, "Matrix A");
        if (v.op === "transpose") { o.m(`A = ${mtex(A)}`); o.step("Interchange rows and columns"); o.m(`A' = ${mtex(ML.T(A))}`); o.ans(`$A'$ is of order $${order(ML.T(A))}$.`); return; }
        if (v.op === "scalar") { const k = F(v.k); o.m(`A = ${mtex(A)}`); o.step(`Multiply every entry by $${ftex(k)}$`); o.m(`${ftex(k)}A = ${mtex(A.map((r) => r.map((x) => `${ftex(k)} \\times ${fpar(x)}`)))} = ${mtex(A.map((r) => r.map((x) => fmul(k, x))))}`); o.ans(`$${ftex(k)}A = ${mtex(A.map((r) => r.map((x) => fmul(k, x))))}$`); return; }
        const B = parseMatrix(v.B, "Matrix B");
        o.m(`A = ${mtex(A)}_{${order(A)}}, \\qquad B = ${mtex(B)}_{${order(B)}}`);
        if (v.op === "mul") {
          o.step("Check the orders");
          if (A[0].length !== B.length) { o.p(`A has ${A[0].length} columns but B has ${B.length} rows.`); o.ans("<b>AB is not defined</b>: the number of columns of A must equal the number of rows of B."); return; }
          o.p(`Columns of A = rows of B = ${B.length}, so AB is defined and has order $${A.length} \\times ${B[0].length}$.`);
          o.step("Multiply each row of A with each column of B");
          const C = ML.mmul(A, B);
          o.m(`AB = ${mtex(A.map((r) => B[0].map((_, j) => r.map((x, k) => `${fpar(x)}(${ftex(B[k][j])})`).join(" + "))))}`);
          o.ans(`$AB = ${mtex(C)}$`); return;
        }
        o.step("Check the orders");
        if (A.length !== B.length || A[0].length !== B[0].length) { o.ans(`<b>Not defined</b>: A is $${order(A)}$ and B is $${order(B)}$. Matrices can be added or subtracted only when they have the same order.`); return; }
        o.p("Both matrices have the same order, so work entry by entry.");
        const sgn = v.op === "add" ? "+" : "-", C = A.map((r, i) => r.map((x, j) => (v.op === "add" ? fadd : fsub)(x, B[i][j])));
        o.m(`A ${sgn} B = ${mtex(A.map((r, i) => r.map((x, j) => `${ftex(x)} ${sgn} ${fpar(B[i][j])}`)))}`);
        o.ans(`$A ${sgn} B = ${mtex(C)}$`);
      } },
    { id: "symmetric", title: "Symmetric + skew-symmetric", desc: "Writes a square matrix as the sum of a symmetric matrix and a skew-symmetric matrix.",
      fields: [{ id: "A", label: "Square matrix A", type: "area", def: "2 -2 -4\n-1 3 4\n1 -2 -3", rows: 3 }],
      solve(v, o) {
        const A = square(parseMatrix(v.A)), At = ML.T(A), h = math.fraction(1, 2);
        const P = A.map((r, i) => r.map((x, j) => fmul(h, fadd(x, At[i][j])))), Q = A.map((r, i) => r.map((x, j) => fmul(h, fsub(x, At[i][j]))));
        o.m(`A = ${mtex(A)}, \\qquad A' = ${mtex(At)}`);
        o.step("Symmetric part $P = \\dfrac{1}{2}(A + A')$"); o.m(`P = \\dfrac{1}{2}${mtex(A.map((r, i) => r.map((x, j) => fadd(x, At[i][j]))))} = ${mtex(P)}`); o.p("$P' = P$, so P is symmetric.");
        o.step("Skew-symmetric part $Q = \\dfrac{1}{2}(A - A')$"); o.m(`Q = \\dfrac{1}{2}${mtex(A.map((r, i) => r.map((x, j) => fsub(x, At[i][j]))))} = ${mtex(Q)}`); o.p("$Q' = -Q$, so Q is skew-symmetric.");
        o.step("Check"); o.m(`P + Q = ${mtex(P.map((r, i) => r.map((x, j) => fadd(x, Q[i][j]))))} = A`);
        o.ans(`$A = ${mtex(P)} + ${mtex(Q)}$`);
      } },
    { id: "row-inverse", title: "Inverse by row operations", desc: "Finds $A^{-1}$ using elementary row operations on $A = IA$.",
      fields: [{ id: "A", label: "Square matrix A", type: "area", def: "1 2\n2 -1", rows: 3 }],
      solve(v, o) {
        const A = square(parseMatrix(v.A)), n = A.length;
        let M = A.map((r, i) => [...r, ...r.map((_, j) => math.fraction(i === j ? 1 : 0))]);
        const show = () => `\\left[\\begin{array}{${"c".repeat(n)}|${"c".repeat(n)}}${M.map((r) => r.map(ftex).join(" & ")).join(" \\\\[2pt] ")}\\end{array}\\right]`;
        o.p("Write $[A \\mid I]$ and reduce the left block to $I$ using row operations. The right block then becomes $A^{-1}$."); o.m(show());
        for (let c = 0; c < n; c++) {
          let p = c; while (p < n && fzero(M[p][c])) p++;
          if (p === n) { o.ans("A row of zeros appears on the left, so <b>$A^{-1}$ does not exist</b> (A is singular)."); return; }
          if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; o.step(`$R_{${c + 1}} \\leftrightarrow R_{${p + 1}}$`); o.m(show()); }
          const piv = M[c][c];
          if (fnum(piv) !== 1) { M[c] = M[c].map((x) => fdiv(x, piv)); o.step(`$R_{${c + 1}} \\to ${ftex(fdiv(math.fraction(1), piv))}\\,R_{${c + 1}}$`); o.m(show()); }
          const ops = [];
          for (let r = 0; r < n; r++) if (r !== c && !fzero(M[r][c])) { const k = M[r][c]; M[r] = M[r].map((x, j) => fsub(x, fmul(k, M[c][j]))); ops.push(`R_{${r + 1}} \\to R_{${r + 1}} ${fnum(k) < 0 ? "+" : "-"} ${fnum(math.abs(k)) === 1 ? "" : ftex(math.abs(k))}R_{${c + 1}}`); }
          if (ops.length) { o.step(`$${ops.join(",\\quad ")}$`); o.m(show()); }
        }
        o.ans(`$A^{-1} = ${mtex(M.map((r) => r.slice(n)))}$`);
      } },
  ] });

  /* ---------- 4. Determinants ---------- */
  const detSteps = (A, o, name = "A") => {
    const n = A.length, D = ML.det(A);
    if (n === 1) { o.m(`|${name}| = ${ftex(D)}`); return D; }
    if (n === 2) { o.m(`|${name}| = ${mtex(A, "vmatrix")} = ${fpar(A[0][0])}(${ftex(A[1][1])}) - ${fpar(A[0][1])}(${ftex(A[1][0])}) = ${ftex(D)}`); return D; }
    const parts = A[0].map((x, j) => `${j ? (j % 2 ? "-" : "+") : ""} ${fpar(x)}${mtex(ML.minor(A, 0, j), "vmatrix")}`);
    const vals = A[0].map((x, j) => `${j ? (j % 2 ? "-" : "+") : ""} ${fpar(x)}(${ftex(ML.det(ML.minor(A, 0, j)))})`);
    o.m(`|${name}| = ${mtex(A, "vmatrix")} = ${parts.join(" ")}`); o.m(`= ${vals.join(" ")} = ${ftex(D)}`);
    return D;
  };
  ML.detSteps = detSteps;
  ML.chapters.push({ n: 4, id: "determinants", title: "Determinants", tools: [
    { id: "determinant", title: "Determinant", desc: "Evaluates a determinant by expanding along the first row.",
      fields: [{ id: "A", label: "Square matrix A", type: "area", def: "1 2 4\n-1 3 0\n4 1 0", rows: 3 }],
      solve(v, o) { const A = square(parseMatrix(v.A)); o.step("Expand along the first row $R_1$"); const D = detSteps(A, o); o.ans(`$|A| = ${ftex(D)}$${fzero(D) ? ", so A is a <b>singular</b> matrix." : ", so A is <b>non-singular</b>."}`); } },
    { id: "inverse", title: "Adjoint and inverse", desc: "Finds the minors and cofactors, the adjoint, and the inverse $A^{-1} = \\dfrac{1}{|A|}\\,\\text{adj}\\,A$.",
      fields: [{ id: "A", label: "Square matrix A", type: "area", def: "1 3 3\n1 4 3\n1 3 4", rows: 3 }],
      solve(v, o) {
        const A = square(parseMatrix(v.A)), n = A.length;
        if (n < 2) throw new Error("Please enter a 2 × 2, 3 × 3 or 4 × 4 matrix.");
        o.step("Find $|A|$"); const D = detSteps(A, o);
        o.step("Cofactors $A_{ij} = (-1)^{i+j} M_{ij}$"); const C = ML.cofactors(A);
        if (n === 3) o.m(`\\begin{aligned}${A.map((r, i) => r.map((_, j) => `A_{${i + 1}${j + 1}} &= ${(i + j) % 2 ? "-" : ""}${mtex(ML.minor(A, i, j), "vmatrix")} = ${ftex(C[i][j])}`).join(" & ")).join(" \\\\[4pt] ")}\\end{aligned}`);
        else o.m(`\\text{Cofactor matrix} = ${mtex(C)}`);
        o.step("Adjoint = transpose of the cofactor matrix"); const adj = ML.T(C); o.m(`\\text{adj}\\,A = ${mtex(adj)}`);
        if (fzero(D)) { o.ans("$|A| = 0$, so A is singular and <b>$A^{-1}$ does not exist</b>."); return; }
        o.step("$A^{-1} = \\dfrac{1}{|A|}\\,\\text{adj}\\,A$");
        const inv = adj.map((r) => r.map((x) => fdiv(x, D)));
        o.m(`A^{-1} = \\dfrac{1}{${ftex(D)}}${mtex(adj)}`);
        o.ans(`$A^{-1} = ${mtex(inv)}$`);
      } },
    { id: "system", title: "Solve linear equations", desc: "Solves a system of linear equations by the matrix method $X = A^{-1}B$, and tests consistency when $|A| = 0$.",
      fields: [{ id: "A", label: "Coefficient matrix A", type: "area", def: "3 -2 3\n2 1 -1\n4 -3 2", rows: 3, hint: "One equation per line: the coefficients of x, y, z" }, { id: "B", label: "Constants B", def: "8, 1, 4", hint: "Right-hand sides, in the same order" }],
      solve(v, o) {
        const A = square(parseMatrix(v.A, "The coefficient matrix")), n = A.length, B = list(v.B).map(F), names = ["x", "y", "z", "w"].slice(0, n);
        if (B.length !== n) throw new Error(`Please give ${n} constants, one for each equation.`);
        const Bc = B.map((b) => [b]);
        o.step("Write the system as $AX = B$"); o.m(`${mtex(A)}${mtex(names.map((x) => [x]))} = ${mtex(Bc)}`);
        o.step("Find $|A|$"); const D = detSteps(A, o), adj = ML.T(ML.cofactors(A));
        if (fzero(D)) {
          const t = ML.mmul(adj, Bc);
          o.step("$|A| = 0$, so find $(\\text{adj}\\,A)B$"); o.m(`\\text{adj}\\,A = ${mtex(adj)}, \\qquad (\\text{adj}\\,A)B = ${mtex(t)}`);
          if (t.some((r) => !fzero(r[0]))) o.ans("$(\\text{adj}\\,A)B \\ne O$, so the system is <b>inconsistent</b>: it has no solution.");
          else o.ans("$(\\text{adj}\\,A)B = O$, so the system has either <b>infinitely many solutions or no solution</b>. Solve two of the equations in terms of the third variable to decide.");
          return;
        }
        o.p("$|A| \\ne 0$, so A is non-singular and the system has a <b>unique solution</b> $X = A^{-1}B$.");
        o.step("Find $A^{-1}$"); const inv = adj.map((r) => r.map((x) => fdiv(x, D))); o.m(`\\text{adj}\\,A = ${mtex(adj)}, \\qquad A^{-1} = \\dfrac{1}{${ftex(D)}}${mtex(adj)}`);
        o.step("$X = A^{-1}B$"); const X = ML.mmul(inv, Bc); o.m(`${mtex(names.map((x) => [x]))} = \\dfrac{1}{${ftex(D)}}${mtex(adj)}${mtex(Bc)} = \\dfrac{1}{${ftex(D)}}${mtex(ML.mmul(adj, Bc))} = ${mtex(X)}`);
        o.ans(`$${names.map((x, i) => `${x} = ${ftex(X[i][0])}`).join(",\\quad ")}$`);
      } },
    { id: "triangle", title: "Area of a triangle", desc: "Finds the area of a triangle from its vertices using a determinant, and checks whether three points are collinear.",
      fields: [{ id: "P", label: "Vertices", def: "(3, 8), (-4, 2), (5, 1)", wide: true, hint: "Three points as (x, y)" }],
      solve(v, o) {
        const pts = [...String(v.P).replace(/[−–]/g, "-").matchAll(/\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/g)].map((m) => [F(m[1]), F(m[2])]);
        if (pts.length !== 3) throw new Error("Please enter exactly three points, e.g. (3, 8), (-4, 2), (5, 1).");
        const M = pts.map((p) => [p[0], p[1], math.fraction(1)]);
        o.step("Area $= \\dfrac{1}{2}\\left|\\,\\begin{vmatrix} x_1 & y_1 & 1 \\\\ x_2 & y_2 & 1 \\\\ x_3 & y_3 & 1 \\end{vmatrix}\\,\\right|$");
        const D = detSteps(M, o, "\\Delta"), area = fmul(math.fraction(1, 2), math.abs(D));
        o.step("Take half of the absolute value"); o.m(`\\text{Area} = \\dfrac{1}{2}\\left|${ftex(D)}\\right| = ${ftex(area)}`);
        o.ans(fzero(D) ? "The determinant is 0, so the area is 0 and the three points are <b>collinear</b>." : `Area $= ${ftex(area)}$ square units. The points are not collinear.`);
      } },
  ] });
})();
