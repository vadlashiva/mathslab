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
    side.innerHTML = `<a href="#/" class="${active ? "" : "on"}"><span class="no">⌂</span><span>Ask a question</span></a>` + part("Part I", ML.chapters.filter((c) => c.n <= 6)) + part("Part II", ML.chapters.filter((c) => c.n > 6));
  }
  function home() {
    const cards = (list) => `<div class="grid">${list.map((c) => `<a class="chCard" href="#/${c.id}"><span class="chNo">Chapter ${c.n}</span><b>${esc(c.title)}</b><small>${c.tools.map((t) => esc(t.title)).join(" · ")}</small></a>`).join("")}</div>`;
    const EX = ["∫ x^2 e^x dx", "Integrate sin 2x – 4 e^3x", "Differentiate x^2 sin(3x)", "∫ 1/(x^2 - 9) dx", "Integrate x^2 from 2 to 3", "Maximise Z = 4x + y subject to x + y ≤ 50, 3x + y ≤ 90, x ≥ 0, y ≥ 0"];
    main.innerHTML = `<h1>II PUC Mathematics, solved step by step</h1>
      <p class="lead">Paste or type a question below, or pick a chapter. All ${ML.chapters.reduce((s, c) => s + c.tools.length, 0)} solvers run in your browser.</p>
      <div class="card ask"><h2>Ask a question</h2><p class="desc">Type a question, or add a photo of it: use the button, drop a picture here, or copy a screenshot and paste it with Ctrl+V. Several questions can go in together, one per line.</p>
        <form id="askForm"><textarea id="askBox" rows="4" spellcheck="false" placeholder="For example:  ∫ (4 e^3x + 1) dx     or     Differentiate x^2 sin(3x)"></textarea>
        <div class="actions"><button class="btn" type="submit">Solve</button><label class="btn ghost photoBtn camBtn">📸 Take a photo<input type="file" id="askCamera" accept="image/*" capture="environment" hidden></label><label class="btn ghost photoBtn">🖼️ Choose a picture<input type="file" id="askPhoto" accept="image/*" hidden></label><button class="btn ghost" type="button" id="askClear">Clear</button></div>
        <div id="photoRow" class="photoRow" hidden><img id="photoThumb" alt="The photo you added"><span id="photoStatus"></span></div></form>
        <div class="chips">Try: ${EX.map((e) => `<button type="button" class="chip">${esc(e)}</button>`).join("")}</div>
        <details class="help"><summary>Tips for pasting from a PDF</summary><p>Copying from the textbook PDF usually loses powers and fractions: $e^{3x}$ arrives as <code>e3x</code> or just <code>e</code>, and a fraction arrives as scattered lines. After pasting, check the line that starts with <b>Read as</b>. If it is not your question, fix the text: write powers with <code>^</code> (<code>x^2</code>, <code>e^(3x)</code>) and fractions with <code>/</code> and brackets, like <code>(x^3 + 5x^2 - 4)/x^2</code>.</p></details></div>
      <div id="askOut"></div>
      <h2>Part I</h2><p class="lead">Chapters 1 to 6</p>${cards(ML.chapters.filter((c) => c.n <= 6))}
      <h2>Part II</h2><p class="lead">Chapters 7 to 13, arranged by the sections of the Part II textbook</p>${cards(ML.chapters.filter((c) => c.n > 6))}
      <p class="foot">MathsLab shows the method along with the answer. Write the steps in your own words in the exam, and check any answer that looks unusual with your teacher.</p>`;
  }
  function ask() {
    const box = document.getElementById("askBox"), out = document.getElementById("askOut"), qs = ML.splitQuestions(box.value);
    out.innerHTML = ""; ML.pending.length = 0;
    if (!qs.length) { out.innerHTML = `<div class="card"><div class="error">Type or paste a question first.</div></div>`; return; }
    qs.forEach((q, i) => {
      const card = document.createElement("div"); card.className = "card";
      card.innerHTML = `<div class="qHead">${qs.length > 1 ? `<span class="stepNo">Question ${i + 1}</span> ` : ""}<code>${esc(q.text.length > 160 ? q.text.slice(0, 160) + "…" : q.text)}</code></div>`;
      try { card.appendChild(ML.answerQuestion(q).el); }
      catch (e) { const d = document.createElement("div"); d.className = "error"; d.innerHTML = e && e.constructor === Error ? ML.rich(esc(e.message)) : "I could not work this one out. Check the line that I read, fix the typing and try again."; card.appendChild(d); if (!(e && e.constructor === Error)) console.error(e); }
      out.appendChild(card);
    });
    ML.pending.splice(0).forEach((fn) => fn());
    out.scrollIntoView({ behavior: "smooth", block: "start" });
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
  function wireAsk() {
    const form = document.getElementById("askForm"); if (!form) return;
    form.addEventListener("submit", (e) => { e.preventDefault(); ask(); });
    document.getElementById("askClear").addEventListener("click", () => { document.getElementById("askBox").value = ""; document.getElementById("askOut").innerHTML = ""; document.getElementById("photoRow").hidden = true; document.getElementById("askBox").focus(); });
    const photo = async (file) => {
      if (!file || !/^image\//.test(file.type)) return;
      const row = document.getElementById("photoRow"), st = document.getElementById("photoStatus"), box = document.getElementById("askBox");
      row.hidden = false; document.getElementById("photoThumb").src = URL.createObjectURL(file);
      try {
        const r = await ML.readPhoto(file, (t) => (st.textContent = t));
        if (!r.text) throw new Error("I could not read any text in this photo. Try a sharper, closer picture, or type the question.");
        box.value = r.text; document.getElementById("askOut").innerHTML = "";
        if (r.by === "ai") { st.innerHTML = "Read from the photo by AI. <b>Check the text in the box</b>; if it is not your question, correct it and press Solve again."; ask(); }
        else { st.innerHTML = "I have put what I could read into the box. <b>Check it against your photo</b> (powers, roots and fractions usually need fixing), then press <b>Solve</b>."; box.focus(); }
      } catch (e) { st.textContent = e && e.constructor === Error && e.message !== "load" ? e.message : "The photo reader could not start. Check your connection, or type the question."; }
    };
    ["askPhoto", "askCamera"].forEach((id) => document.getElementById(id).addEventListener("change", (e) => { if (e.target.files[0]) photo(e.target.files[0]); e.target.value = ""; }));
    const card = main.querySelector(".ask");
    card.addEventListener("paste", (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => /^image\//.test(x.type)); if (f) { e.preventDefault(); photo(f); } });
    card.addEventListener("dragover", (e) => e.preventDefault());
    card.addEventListener("drop", (e) => { const f = [...(e.dataTransfer?.files || [])].find((x) => /^image\//.test(x.type)); if (f) { e.preventDefault(); photo(f); } });
    main.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { document.getElementById("askBox").value = c.textContent; ask(); }));
    main.querySelectorAll(".ask .help").forEach((d) => (d.innerHTML = ML.rich(d.innerHTML)));
  }
  function route() {
    const [, chId, toolId] = location.hash.split("/");
    const ch = ML.chapters.find((c) => c.id === chId);
    sidebar(ch && ch.id); side.classList.remove("open");
    if (ch) chapter(ch, toolId); else { home(); wireAsk(); }
    window.scrollTo(0, 0);
  }
  document.getElementById("menuBtn").addEventListener("click", () => side.classList.toggle("open"));
  window.addEventListener("hashchange", route);
  route();
})();
