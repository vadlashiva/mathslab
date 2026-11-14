/* MathsLab app shell: chapter list, tool forms, routing by URL hash. */
(function () {
  const ML = window.ML, side = document.getElementById("side"), main = document.getElementById("main");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  ML.chapters.sort((a, b) => a.n - b.n);
  const HELP = `<details class="help"><summary>How to type maths</summary>
    <p>Multiply with <code>*</code> (<code>2*x</code> or <code>2x</code>), powers with <code>^</code> (<code>x^3</code>), roots as <code>sqrt(x)</code>, e to a power as <code>e^x</code> or <code>exp(x)</code>, natural log as <code>log(x)</code> or <code>ln(x)</code>, and <code>pi</code> for π.
    Trigonometry: <code>sin(x)</code>, <code>cos(x)</code>, <code>tan(x)</code>, <code>cot(x)</code>, <code>sec(x)</code>, <code>cosec(x)</code>; inverses as <code>asin(x)</code>, <code>atan(x)</code> or <code>sin^-1(x)</code>. Always put brackets after a function name: <code>x*sin(x)</code>, not <code>xsinx</code>.</p></details>`;

  function sidebar(active) {
    const part = (label, list) => `<div class="sideHead">${label}</div>` + list.map((c) => `<a href="#/${c.id}" class="${c.id === active ? "on" : ""}"><span class="no">${c.n}</span><span>${esc(c.title)}</span></a>`).join("");
    side.innerHTML = `<a href="#/" class="${active ? "" : "on"}"><span class="no">⌂</span><span>All chapters</span></a>` + part("Part I", ML.chapters.filter((c) => c.n <= 6)) + part("Part II", ML.chapters.filter((c) => c.n > 6));
  }
  function home() {
    const cards = (list) => `<div class="grid">${list.map((c) => `<a class="chCard" href="#/${c.id}"><span class="chNo">Chapter ${c.n}</span><b>${esc(c.title)}</b><small>${c.tools.map((t) => esc(t.title)).join(" · ")}</small></a>`).join("")}</div>`;
    main.innerHTML = `<h1>II PUC Mathematics, solved step by step</h1>
      <p class="lead">Pick a chapter, type your own question, and see every step of the working. All ${ML.chapters.reduce((s, c) => s + c.tools.length, 0)} solvers run in your browser.</p>
      <h2>Part I</h2><p class="lead">Chapters 1 to 6</p>${cards(ML.chapters.filter((c) => c.n <= 6))}
      <h2>Part II</h2><p class="lead">Chapters 7 to 13, arranged by the sections of the Part II textbook</p>${cards(ML.chapters.filter((c) => c.n > 6))}
      <p class="foot">MathsLab shows the method along with the answer. Write the steps in your own words in the exam, and check any answer that looks unusual with your teacher.</p>`;
  }
  function fieldHtml(f) {
    const id = `f_${f.id}`, wide = f.type === "area" || f.wide ? " wide" : "";
    let input;
    if (f.type === "select") input = `<select id="${id}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${v === f.def ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    else if (f.type === "area") input = `<textarea id="${id}" rows="${f.rows || 3}" spellcheck="false">${esc(f.def || "")}</textarea>`;
    else input = `<input type="text" id="${id}" value="${esc(f.def ?? "")}" spellcheck="false" autocomplete="off">`;
    return `<div class="field${wide}"><label for="${id}">${ML.rich(f.label)}</label>${input}${f.hint ? `<small>${ML.rich(f.hint)}</small>` : ""}</div>`;
  }
  function solve(tool) {
    const out = document.getElementById("out"), v = {};
    tool.fields.forEach((f) => (v[f.id] = document.getElementById(`f_${f.id}`).value));
    out.innerHTML = ""; ML.pending.length = 0;
    try {
      const o = new ML.Out();
      tool.solve(v, o);
      out.appendChild(o.el);
      ML.pending.splice(0).forEach((fn) => fn());
    } catch (e) {
      if (e && e.constructor === Error) out.innerHTML = `<div class="error">${ML.rich(esc(e.message || e))}</div>`;
      else { console.error(e); out.innerHTML = `<div class="error">I could not work this one out. Check that the input is typed the way the hint shows, and try again.</div>`; }
    }
  }
  function chapter(ch, toolId) {
    const tool = ch.tools.find((t) => t.id === toolId) || ch.tools[0];
    main.innerHTML = `<span class="chNo">Chapter ${ch.n} · Part ${ch.n <= 6 ? "I" : "II"}</span><h1>${esc(ch.title)}</h1>
      <div class="pills">${ch.tools.map((t) => `<a class="pill ${t === tool ? "on" : ""}" href="#/${ch.id}/${t.id}">${esc(t.title)}</a>`).join("")}</div>
      <div class="card"><h2>${esc(tool.title)}${tool.sec ? `<span class="sec">Textbook §${tool.sec}</span>` : ""}</h2><p class="desc">${ML.rich(tool.desc)}</p>
        <form id="form"><div class="fields">${tool.fields.map(fieldHtml).join("")}</div>
        <div class="actions"><button class="btn" type="submit">Solve</button><button class="btn ghost" type="button" id="reset">Load example</button></div></form>${HELP}</div>
      <div class="card" id="out"></div>`;
    document.getElementById("form").addEventListener("submit", (e) => { e.preventDefault(); solve(tool); });
    document.getElementById("reset").addEventListener("click", () => { tool.fields.forEach((f) => (document.getElementById(`f_${f.id}`).value = f.def ?? "")); solve(tool); });
    main.querySelectorAll("input[type=text]").forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); solve(tool); } }));
    solve(tool);
  }
  function route() {
    const [, chId, toolId] = location.hash.split("/");
    const ch = ML.chapters.find((c) => c.id === chId);
    sidebar(ch && ch.id); side.classList.remove("open");
    if (ch) chapter(ch, toolId); else home();
    window.scrollTo(0, 0);
  }
  document.getElementById("menuBtn").addEventListener("click", () => side.classList.toggle("open"));
  window.addEventListener("hashchange", route);
  route();
})();
