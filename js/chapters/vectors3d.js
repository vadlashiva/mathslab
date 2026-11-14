/* Chapters 10 and 11: Vector Algebra, Three Dimensional Geometry (Part II textbook) */
(function () {
  const ML = window.ML, math = window.math, N = ML.nice;
  const vec = (text, name) => ML.parseVec(text, name).map(ML.fnum);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mag = (a) => Math.sqrt(dot(a, a)), sub = (a, b) => a.map((x, i) => x - b[i]), add = (a, b) => a.map((x, i) => x + b[i]), sc = (k, a) => a.map((x) => k * x);
  const V = ML.vtex, pt = (p) => `(${p.map(N).join(", ")})`, par = (x) => (x < 0 ? `(${N(x)})` : N(x));
  const magT = (a) => `\\sqrt{${a.map((x) => `${par(x)}^2`).join(" + ")}} = ${N(mag(a))}`;
  const dotT = (a, b) => `${a.map((x, i) => `${par(x)}${par(b[i])}`).join(" + ")} = ${N(dot(a, b))}`;
  const crossT = (a, b) => `\\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ ${a.map(N).join(" & ")} \\\\ ${b.map(N).join(" & ")} \\end{vmatrix}`;
  const deg = (r) => `${+((r * 180) / Math.PI).toFixed(2)}^{\\circ}`;
  const acosT = (c) => { const th = Math.acos(Math.max(-1, Math.min(1, c))); return { th, tex: `\\cos^{-1}\\left(${N(c)}\\right) = ${N(th) === ML.dec(th) ? deg(th) : `${N(th)} = ${deg(th)}`}` }; };
  const nz = (a, name) => { if (mag(a) < 1e-12) throw new Error(`${name} is the zero vector, which has no direction.`); return a; };
  const fa = { id: "a", label: "$\\vec{a}$ (components)", def: "2, 3, 2", hint: "Coefficients of î, ĵ, k̂" }, fb = { id: "b", label: "$\\vec{b}$ (components)", def: "1, 2, 1" };

  ML.chapters.push({ n: 10, id: "vectors", title: "Vector Algebra", tools: [
    { id: "basics", title: "Magnitude, unit vector, sum", sec: "10.2–10.5", desc: "Finds the magnitude and unit vector of each vector, their sum and difference, and the direction cosines.",
      fields: [fa, fb],
      solve(v, o) {
        const a = vec(v.a, "Vector a"), b = vec(v.b, "Vector b"); nz(a, "Vector a");
        o.m(`\\vec{a} = ${V(a)}, \\qquad \\vec{b} = ${V(b)}`);
        o.step("Magnitudes"); o.m(`|\\vec{a}| = ${magT(a)}, \\qquad |\\vec{b}| = ${magT(b)}`);
        o.step("Unit vector $\\hat{a} = \\dfrac{\\vec{a}}{|\\vec{a}|}$"); o.m(`\\hat{a} = \\dfrac{1}{${N(mag(a))}}\\left(${V(a)}\\right) = ${V(sc(1 / mag(a), a))}`);
        o.step("Direction cosines of $\\vec{a}$"); o.m(`l = ${N(a[0] / mag(a))}, \\quad m = ${N(a[1] / mag(a))}, \\quad n = ${N(a[2] / mag(a))}`);
        o.step("Sum and difference (add the corresponding components)"); o.m(`\\vec{a} + \\vec{b} = ${V(add(a, b))}, \\qquad \\vec{a} - \\vec{b} = ${V(sub(a, b))}`);
        o.ans(`$|\\vec{a}| = ${N(mag(a))}$, $\\hat{a} = ${V(sc(1 / mag(a), a))}$, $\\vec{a} + \\vec{b} = ${V(add(a, b))}$, $|\\vec{a} + \\vec{b}| = ${N(mag(add(a, b)))}$`);
      } },
    { id: "dot", title: "Dot product, angle, projection", sec: "10.6.1–10.6.2", desc: "Finds the scalar (dot) product, the angle between two vectors, and the projection of one vector on the other.",
      fields: [fa, fb],
      solve(v, o) {
        const a = nz(vec(v.a), "Vector a"), b = nz(vec(v.b), "Vector b"), d = dot(a, b), c = d / (mag(a) * mag(b)), A = acosT(c);
        o.m(`\\vec{a} = ${V(a)}, \\qquad \\vec{b} = ${V(b)}`);
        o.step("Scalar product $\\vec{a} \\cdot \\vec{b} = a_1b_1 + a_2b_2 + a_3b_3$"); o.m(`\\vec{a} \\cdot \\vec{b} = ${dotT(a, b)}`);
        o.step("Magnitudes"); o.m(`|\\vec{a}| = ${magT(a)}, \\qquad |\\vec{b}| = ${magT(b)}`);
        o.step("Angle: $\\cos\\theta = \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}||\\vec{b}|}$"); o.m(`\\cos\\theta = \\dfrac{${N(d)}}{(${N(mag(a))})(${N(mag(b))})} = ${N(c)} \\quad\\Rightarrow\\quad \\theta = ${A.tex}`);
        o.step("Projection of $\\vec{a}$ on $\\vec{b}$ $= \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{b}|}$"); o.m(`\\dfrac{${N(d)}}{${N(mag(b))}} = ${ML.approx(d / mag(b))}`);
        o.ans(`$\\vec{a} \\cdot \\vec{b} = ${N(d)}$, $\\theta = ${deg(A.th)}$, projection of $\\vec{a}$ on $\\vec{b}$ $= ${N(d / mag(b))}$. ${Math.abs(d) < 1e-12 ? "Since $\\vec{a} \\cdot \\vec{b} = 0$, the vectors are <b>perpendicular</b>." : ""}`);
      } },
    { id: "cross", title: "Cross product and area", sec: "10.6.3", desc: "Finds the vector (cross) product, a unit vector perpendicular to both vectors, and the area of the parallelogram and triangle they form.",
      fields: [{ ...fa, def: "3, 1, 4" }, { ...fb, def: "1, -1, 1" }],
      solve(v, o) {
        const a = vec(v.a), b = vec(v.b), c = cross(a, b), m = mag(c);
        o.m(`\\vec{a} = ${V(a)}, \\qquad \\vec{b} = ${V(b)}`);
        o.step("Write the determinant"); o.m(`\\vec{a} \\times \\vec{b} = ${crossT(a, b)}`);
        o.step("Expand along the first row"); o.m(`= \\hat{i}\\left[${par(a[1])}${par(b[2])} - ${par(a[2])}${par(b[1])}\\right] - \\hat{j}\\left[${par(a[0])}${par(b[2])} - ${par(a[2])}${par(b[0])}\\right] + \\hat{k}\\left[${par(a[0])}${par(b[1])} - ${par(a[1])}${par(b[0])}\\right] = ${V(c)}`);
        if (m < 1e-12) { o.ans("$\\vec{a} \\times \\vec{b} = \\vec{0}$, so the vectors are <b>parallel (collinear)</b> and enclose no area."); return; }
        o.step("Magnitude"); o.m(`|\\vec{a} \\times \\vec{b}| = ${magT(c)}`);
        o.step("Unit vector perpendicular to both"); o.m(`\\hat{n} = \\pm\\dfrac{\\vec{a} \\times \\vec{b}}{|\\vec{a} \\times \\vec{b}|} = \\pm\\left(${V(sc(1 / m, c))}\\right)`);
        o.ans(`$\\vec{a} \\times \\vec{b} = ${V(c)}$. Area of the parallelogram with adjacent sides $\\vec{a}, \\vec{b}$ $= ${ML.approx(m)}$ sq. units; area of the triangle $= ${ML.approx(m / 2)}$ sq. units.`);
      } },
    { id: "points", title: "Points: joining vector, section formula, triangle", sec: "10.5", desc: "For points given by coordinates: the vector joining two points, the point dividing the join in a given ratio, and the area of the triangle formed with a third point.",
      fields: [{ id: "P", label: "Point A", def: "1, 1, 1" }, { id: "Q", label: "Point B", def: "1, 2, 3" }, { id: "R", label: "Point C (optional, for the triangle)", def: "2, 3, 1" }, { id: "m", label: "Ratio m : n", def: "2 : 1", hint: "Divides AB in this ratio" }],
      solve(v, o) {
        const A = vec(v.P, "Point A"), B = vec(v.Q, "Point B"), AB = sub(B, A);
        o.step("Vector joining A and B $= $ (position vector of B) $-$ (position vector of A)"); o.m(`\\vec{AB} = ${V(AB)}, \\qquad |\\vec{AB}| = ${magT(AB)}`);
        const r = String(v.m).split(/[:\s,]+/).filter(Boolean).map((x) => ML.fnum(ML.F(x)));
        let extra = "";
        if (r.length === 2) {
          const [m, n] = r, I = add(sc(m, B), sc(n, A)).map((x) => x / (m + n));
          o.step(`Section formula, ratio $${N(m)} : ${N(n)}$`); o.m(`\\text{Internally: } \\dfrac{m\\vec{b} + n\\vec{a}}{m + n} = ${pt(I)}`);
          if (Math.abs(m - n) > 1e-12) o.m(`\\text{Externally: } \\dfrac{m\\vec{b} - n\\vec{a}}{m - n} = ${pt(sub(sc(m, B), sc(n, A)).map((x) => x / (m - n)))}`);
          extra = ` The point dividing AB internally in the ratio $${N(m)} : ${N(n)}$ is $${pt(I)}$.`;
        }
        if (String(v.R).trim()) {
          const C = vec(v.R, "Point C"), AC = sub(C, A), c = cross(AB, AC);
          o.step("Triangle ABC: area $= \\dfrac{1}{2}|\\vec{AB} \\times \\vec{AC}|$"); o.m(`\\vec{AC} = ${V(AC)}, \\qquad \\vec{AB} \\times \\vec{AC} = ${crossT(AB, AC)} = ${V(c)}`); o.m(`\\text{Area} = \\dfrac{1}{2}${magT(c).replace(/= [^=]*$/, "")} = ${ML.approx(mag(c) / 2)}`);
          extra += mag(c) < 1e-12 ? " A, B and C are <b>collinear</b> (the area is 0)." : ` Area of triangle ABC $= ${ML.approx(mag(c) / 2)}$ sq. units.`;
        }
        o.ans(`$\\vec{AB} = ${V(AB)}$, $|\\vec{AB}| = ${N(mag(AB))}$.${extra}`);
      } },
    { id: "triple", title: "Scalar triple product", sec: "10.7", desc: "Finds $[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = \\vec{a} \\cdot (\\vec{b} \\times \\vec{c})$, tests whether three vectors are coplanar, and gives the volume of the parallelepiped.",
      fields: [{ ...fa, def: "2, 1, 3" }, { ...fb, def: "-1, 2, 1" }, { id: "c", label: "$\\vec{c}$ (components)", def: "3, 1, 2" }],
      solve(v, o) {
        const a = vec(v.a), b = vec(v.b), c = vec(v.c, "Vector c"), M = [a, b, c].map((r) => r.map((x) => math.fraction(x)));
        o.step("Write the components as a determinant and expand along the first row"); const D = ML.detSteps(M, o, "[\\vec{a}\\ \\vec{b}\\ \\vec{c}]"), d = ML.fnum(D);
        o.ans(Math.abs(d) < 1e-12 ? "$[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = 0$, so the three vectors are <b>coplanar</b>." : `$[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = ${N(d)} \\ne 0$, so the vectors are <b>not coplanar</b>. Volume of the parallelepiped $= ${N(Math.abs(d))}$ cubic units.`);
      } },
  ] });

  const plane = (text, name = "The plane") => { const p = String(text).replace(/[−–]/g, "-").split(/[\s,]+/).filter(Boolean).map((x) => ML.fnum(ML.F(x))); if (p.length !== 4) throw new Error(`${name} needs four numbers a, b, c, d for ax + by + cz = d.`); if (mag(p.slice(0, 3)) < 1e-12) throw new Error(`${name}: a, b and c cannot all be zero.`); return p; };
  const planeT = (p) => { let s = ""; ["x", "y", "z"].forEach((n, i) => { const c = p[i]; if (Math.abs(c) < 1e-12) return; const m = N(Math.abs(c)); s += (c < 0 ? (s ? " - " : "-") : s ? " + " : "") + (m === "1" ? "" : m) + n; }); return `${s} = ${N(p[3])}`; };
  const cart = (a, b) => ["x", "y", "z"].map((n, i) => `\\dfrac{${n}${Math.abs(a[i]) < 1e-12 ? "" : a[i] < 0 ? ` + ${N(-a[i])}` : ` - ${N(a[i])}`}}{${N(b[i])}}`).join(" = ");
  const dA = { id: "a1", label: "Line 1 passes through", def: "1, 1, 0" }, dB = { id: "b1", label: "Line 1 direction", def: "2, -1, 1" }, dC = { id: "a2", label: "Line 2 passes through", def: "2, 1, -1" }, dD = { id: "b2", label: "Line 2 direction", def: "3, -5, 2" };
  ML.chapters.push({ n: 11, id: "three-d-geometry", title: "Three Dimensional Geometry", tools: [
    { id: "direction", title: "Direction cosines and ratios", sec: "11.2", desc: "Finds the direction cosines of a line from its direction ratios, or of the line joining two points.",
      fields: [{ id: "mode", label: "Given", type: "select", def: "ratios", options: [["ratios", "Direction ratios a, b, c"], ["points", "Two points P and Q"]] }, { id: "p", label: "Direction ratios, or point P", def: "2, -1, -2" }, { id: "q", label: "Point Q (if two points)", def: "" }],
      solve(v, o) {
        let d = vec(v.p, "The first input");
        if (v.mode === "points") { const Q = vec(v.q, "Point Q"); o.step("Direction ratios of PQ $= (x_2 - x_1,\\ y_2 - y_1,\\ z_2 - z_1)$"); d = sub(Q, d); o.m(`${d.map(N).join(",\\ ")}`); }
        nz(d, "The direction"); const m = mag(d);
        o.step("Divide each ratio by $\\sqrt{a^2 + b^2 + c^2}$"); o.m(`\\sqrt{a^2 + b^2 + c^2} = ${magT(d)}`); o.m(`l = \\dfrac{${N(d[0])}}{${N(m)}} = ${N(d[0] / m)}, \\quad m = \\dfrac{${N(d[1])}}{${N(m)}} = ${N(d[1] / m)}, \\quad n = \\dfrac{${N(d[2])}}{${N(m)}} = ${N(d[2] / m)}`);
        o.p("Check: $l^2 + m^2 + n^2 = 1$.");
        o.ans(`Direction cosines: $${d.map((x) => N(x / m)).join(",\\ ")}$ (or all three with the opposite sign).`);
      } },
    { id: "line", title: "Equation of a line", sec: "11.3", desc: "Writes the vector and Cartesian equations of a line through a point with a given direction, or through two points.",
      fields: [{ id: "mode", label: "Given", type: "select", def: "dir", options: [["dir", "A point and a direction"], ["points", "Two points"]] }, { id: "a", label: "Point A", def: "5, 2, -4" }, { id: "b", label: "Direction, or point B", def: "3, 2, -8" }],
      solve(v, o) {
        const a = vec(v.a, "Point A"); let b = vec(v.b, "The second input");
        if (v.mode === "points") { o.step("Direction of the line $= \\vec{b} - \\vec{a}$"); b = sub(b, a); o.m(V(b)); }
        nz(b, "The direction");
        o.step("Vector equation $\\vec{r} = \\vec{a} + \\lambda\\vec{b}$"); o.m(`\\vec{r} = ${V(a)} + \\lambda\\left(${V(b)}\\right)`);
        o.step("Cartesian equation $\\dfrac{x - x_1}{a} = \\dfrac{y - y_1}{b} = \\dfrac{z - z_1}{c}$"); o.m(cart(a, b));
        o.ans(`$\\vec{r} = ${V(a)} + \\lambda\\left(${V(b)}\\right)$, &nbsp; or &nbsp; $${cart(a, b)}$`);
      } },
    { id: "angle", title: "Angle between two lines", sec: "11.4", desc: "Finds the angle between two lines from their direction ratios.",
      fields: [{ id: "b1", label: "Direction ratios of line 1", def: "1, 2, 2" }, { id: "b2", label: "Direction ratios of line 2", def: "3, 2, 6" }],
      solve(v, o) {
        const a = nz(vec(v.b1), "Line 1"), b = nz(vec(v.b2), "Line 2"), d = dot(a, b), c = Math.abs(d) / (mag(a) * mag(b)), A = acosT(c);
        o.step("$\\cos\\theta = \\left|\\dfrac{a_1a_2 + b_1b_2 + c_1c_2}{\\sqrt{a_1^2 + b_1^2 + c_1^2}\\,\\sqrt{a_2^2 + b_2^2 + c_2^2}}\\right|$");
        o.m(`a_1a_2 + b_1b_2 + c_1c_2 = ${dotT(a, b)}`); o.m(`\\cos\\theta = \\left|\\dfrac{${N(d)}}{(${N(mag(a))})(${N(mag(b))})}\\right| = ${N(c)} \\quad\\Rightarrow\\quad \\theta = ${A.tex}`);
        o.ans(`$\\theta = ${deg(A.th)}$. ${Math.abs(d) < 1e-12 ? "The lines are <b>perpendicular</b>." : mag(cross(a, b)) < 1e-12 ? "The lines are <b>parallel</b>." : ""}`);
      } },
    { id: "distance", title: "Shortest distance between two lines", sec: "11.5", desc: "Finds the shortest distance between the lines $\\vec{r} = \\vec{a_1} + \\lambda\\vec{b_1}$ and $\\vec{r} = \\vec{a_2} + \\mu\\vec{b_2}$, for skew lines and for parallel lines.",
      fields: [dA, dB, dC, dD],
      solve(v, o) {
        const a1 = vec(v.a1), b1 = nz(vec(v.b1), "Line 1 direction"), a2 = vec(v.a2), b2 = nz(vec(v.b2), "Line 2 direction"), w = sub(a2, a1), c = cross(b1, b2);
        o.m(`\\vec{r} = ${V(a1)} + \\lambda\\left(${V(b1)}\\right), \\qquad \\vec{r} = ${V(a2)} + \\mu\\left(${V(b2)}\\right)`);
        o.step("$\\vec{a_2} - \\vec{a_1}$"); o.m(V(w));
        if (mag(c) < 1e-12) {
          const k = cross(b1, w), d = mag(k) / mag(b1);
          o.p("$\\vec{b_1} \\times \\vec{b_2} = \\vec{0}$, so the lines are <b>parallel</b>."); o.step("Use $d = \\dfrac{|\\vec{b} \\times (\\vec{a_2} - \\vec{a_1})|}{|\\vec{b}|}$");
          o.m(`\\vec{b} \\times (\\vec{a_2} - \\vec{a_1}) = ${crossT(b1, w)} = ${V(k)}`); o.m(`d = \\dfrac{${N(mag(k))}}{${N(mag(b1))}} = ${ML.approx(d)}`);
          o.ans(d < 1e-12 ? "The distance is 0: the two equations describe the <b>same line</b>." : `The lines are parallel and the distance between them is $${ML.approx(d)}$ units.`); return;
        }
        o.step("$\\vec{b_1} \\times \\vec{b_2}$"); o.m(`${crossT(b1, b2)} = ${V(c)}, \\qquad |\\vec{b_1} \\times \\vec{b_2}| = ${N(mag(c))}`);
        const num = dot(c, w), d = Math.abs(num) / mag(c);
        o.step("$d = \\left|\\dfrac{(\\vec{b_1} \\times \\vec{b_2}) \\cdot (\\vec{a_2} - \\vec{a_1})}{|\\vec{b_1} \\times \\vec{b_2}|}\\right|$"); o.m(`(\\vec{b_1} \\times \\vec{b_2}) \\cdot (\\vec{a_2} - \\vec{a_1}) = ${dotT(c, w)}`); o.m(`d = \\left|\\dfrac{${N(num)}}{${N(mag(c))}}\\right| = ${ML.approx(d)}`);
        o.ans(d < 1e-12 ? "The shortest distance is 0, so the lines <b>intersect</b> (they are coplanar)." : `Shortest distance $= ${ML.approx(d)}$ units. The lines are skew.`);
      } },
    { id: "plane3", title: "Plane through three points", sec: "11.6", desc: "Finds the equation of the plane passing through three non-collinear points.",
      fields: [{ id: "A", label: "Point A", def: "2, 5, -3" }, { id: "B", label: "Point B", def: "-2, -3, 5" }, { id: "C", label: "Point C", def: "5, 3, -3" }],
      solve(v, o) {
        const A = vec(v.A, "Point A"), B = vec(v.B, "Point B"), C = vec(v.C, "Point C"), AB = sub(B, A), AC = sub(C, A), n = cross(AB, AC);
        o.step("Two vectors in the plane"); o.m(`\\vec{AB} = ${V(AB)}, \\qquad \\vec{AC} = ${V(AC)}`);
        o.step("Normal to the plane $\\vec{n} = \\vec{AB} \\times \\vec{AC}$"); o.m(`\\vec{n} = ${crossT(AB, AC)} = ${V(n)}`);
        if (mag(n) < 1e-12) { o.ans("$\\vec{AB} \\times \\vec{AC} = \\vec{0}$: the three points are <b>collinear</b>, so they do not fix a unique plane."); return; }
        const g = n.every((x) => Number.isInteger(x)) ? n.reduce((p, q) => { q = Math.abs(q); while (q) [p, q] = [q, p % q]; return p; }, 0) || 1 : 1, nn = n.map((x) => x / g), p = [...nn, dot(nn, A)];
        o.step("Plane: $(\\vec{r} - \\vec{a}) \\cdot \\vec{n} = 0$"); o.m(`\\left[\\vec{r} - \\left(${V(A)}\\right)\\right] \\cdot \\left(${V(nn)}\\right) = 0 \\quad\\Rightarrow\\quad ${planeT(p)}`);
        o.ans(`Equation of the plane: $${planeT(p)}$`);
      } },
    { id: "planes", title: "Angle between two planes", sec: "11.8", desc: "Finds the angle between two planes $a_1x + b_1y + c_1z = d_1$ and $a_2x + b_2y + c_2z = d_2$ from their normals.",
      fields: [{ id: "p1", label: "Plane 1: a, b, c, d", def: "2, 1, -2, 5", hint: "For ax + by + cz = d" }, { id: "p2", label: "Plane 2: a, b, c, d", def: "3, -6, -2, 7" }],
      solve(v, o) {
        const p = plane(v.p1, "Plane 1"), q = plane(v.p2, "Plane 2"), n1 = p.slice(0, 3), n2 = q.slice(0, 3), d = dot(n1, n2), c = Math.abs(d) / (mag(n1) * mag(n2)), A = acosT(c);
        o.m(`${planeT(p)} \\qquad\\text{and}\\qquad ${planeT(q)}`);
        o.step("Normals to the planes"); o.m(`\\vec{n_1} = ${V(n1)}, \\qquad \\vec{n_2} = ${V(n2)}`);
        o.step("$\\cos\\theta = \\left|\\dfrac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}\\right|$"); o.m(`\\vec{n_1} \\cdot \\vec{n_2} = ${dotT(n1, n2)}`); o.m(`\\cos\\theta = \\left|\\dfrac{${N(d)}}{(${N(mag(n1))})(${N(mag(n2))})}\\right| = ${N(c)} \\quad\\Rightarrow\\quad \\theta = ${A.tex}`);
        o.ans(`$\\theta = \\cos^{-1}\\left(${N(c)}\\right) = ${deg(A.th)}$. ${Math.abs(d) < 1e-12 ? "The planes are <b>perpendicular</b>." : mag(cross(n1, n2)) < 1e-12 ? "The planes are <b>parallel</b>." : ""}`);
      } },
    { id: "point-plane", title: "Distance of a point from a plane", sec: "11.9", desc: "Finds the perpendicular distance of a point from the plane $ax + by + cz = d$.",
      fields: [{ id: "p", label: "Plane: a, b, c, d", def: "2, -3, 4, 6", hint: "For ax + by + cz = d" }, { id: "P", label: "Point", def: "0, 0, 0" }],
      solve(v, o) {
        const p = plane(v.p), P = vec(v.P, "The point"), n = p.slice(0, 3), num = dot(n, P) - p[3], d = Math.abs(num) / mag(n);
        o.m(`\\text{Plane: } ${planeT(p)}, \\qquad \\text{point } ${pt(P)}`);
        o.step("$\\text{Distance} = \\left|\\dfrac{ax_1 + by_1 + cz_1 - d}{\\sqrt{a^2 + b^2 + c^2}}\\right|$");
        o.m(`= \\left|\\dfrac{${n.map((x, i) => `${par(x)}${par(P[i])}`).join(" + ")} - ${par(p[3])}}{${magT(n).replace(/ = [^=]*$/, "")}}\\right| = \\left|\\dfrac{${N(num)}}{${N(mag(n))}}\\right| = ${ML.approx(d)}`);
        o.ans(d < 1e-12 ? "The distance is 0: the point <b>lies on the plane</b>." : `Distance $= ${ML.approx(d)}$ units`);
      } },
    { id: "line-plane", title: "Angle between a line and a plane", sec: "11.10", desc: "Finds the angle between a line with direction $\\vec{b}$ and the plane $ax + by + cz = d$.",
      fields: [{ id: "b", label: "Direction ratios of the line", def: "2, 3, 6" }, { id: "p", label: "Plane: a, b, c, d", def: "10, 2, -11, 3" }],
      solve(v, o) {
        const b = nz(vec(v.b), "The line direction"), p = plane(v.p), n = p.slice(0, 3), d = dot(b, n), s = Math.abs(d) / (mag(b) * mag(n)), th = Math.asin(Math.min(1, s));
        o.m(`\\vec{b} = ${V(b)}, \\qquad \\text{plane: } ${planeT(p)}, \\quad \\vec{n} = ${V(n)}`);
        o.step("$\\sin\\phi = \\left|\\dfrac{\\vec{b} \\cdot \\vec{n}}{|\\vec{b}||\\vec{n}|}\\right|$ (the angle with the plane is the complement of the angle with the normal)");
        o.m(`\\vec{b} \\cdot \\vec{n} = ${dotT(b, n)}`); o.m(`\\sin\\phi = \\left|\\dfrac{${N(d)}}{(${N(mag(b))})(${N(mag(n))})}\\right| = ${N(s)}`);
        o.ans(`$\\phi = \\sin^{-1}\\left(${N(s)}\\right) = ${deg(th)}$. ${Math.abs(d) < 1e-12 ? "The line is <b>parallel</b> to the plane." : ""}`);
      } },
  ] });
})();
