/* Photo input for the Ask box: reads the question from a picture, then hands the text to the solver.
   If the site is served with the api/read-photo function and an API key, an AI model reads the photo.
   Otherwise a text reader that runs in the browser (Tesseract) is used. */
(function () {
  const ML = window.ML;
  const loadScript = (src) => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => fail(new Error("load")); document.head.appendChild(s); });
  const toImage = (file) => new Promise((ok, fail) => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => fail(new Error("This file is not a picture I can open.")); img.src = URL.createObjectURL(file); });
  // redraw on a white canvas; small crops are enlarged (the reader needs letters about 30 px tall), large photos reduced
  const draw = (img, scale, type, quality) => { const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL(type, quality); };

  let aiReady = null;
  ML.photoMode = () => (aiReady ??= location.protocol.startsWith("http") ? fetch("api/read-photo").then((r) => (r.ok ? r.json() : {})).then((j) => !!j.ai).catch(() => false) : Promise.resolve(false));

  async function readWithAI(img) {
    const side = Math.max(img.naturalWidth, img.naturalHeight), url = draw(img, Math.min(1, 1600 / side) * (side < 400 ? 2 : 1), "image/jpeg", 0.9);
    const r = await fetch("api/read-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: url.split(",")[1], type: "image/jpeg" }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.text) throw new Error(j.error || "The AI reader did not answer. Try again, or type the question.");
    return j.text.trim();
  }

  let worker = null;
  async function readWithOCR(img, status) {
    if (!location.protocol.startsWith("http")) throw new Error("Reading photos works on the hosted site, not when the page is opened as a file. Please type the question instead.");
    if (!worker) {
      status("Loading the photo reader (first time only)…");
      if (!window.Tesseract) await loadScript("vendor/tesseract/tesseract.min.js");
      const base = new URL("vendor/tesseract/", location.href).href;
      worker = await window.Tesseract.createWorker("eng", 1, { workerPath: base + "worker.min.js", corePath: base, langPath: base, gzip: true });
      await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    }
    status("Reading the photo…");
    const h = img.naturalHeight, lines = Math.max(1, Math.round(h / 40)), scale = Math.max(1, Math.min(4, (lines * 90) / h, 2600 / Math.max(img.naturalWidth, 1)));
    const { data } = await worker.recognize(draw(img, scale, "image/png"));
    return ML.fixOCR(data.text);
  }
  // common misreadings of printed maths
  ML.fixOCR = (text) => String(text).split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    let s = l.replace(/[|]/g, "").replace(/[‘’`']/g, "").replace(/—/g, "-").replace(/\s+/g, " ");
    if (/\bd\s?x\s*\.?$/i.test(s)) s = s.replace(/^((?:\(?\d{1,2}[.)]\s*)?)\s*[JjfS\[\]{}]+\s*(?=[(\w√])/, "$1∫ ");   // the integral sign is usually read as J, f or [
    return s.replace(/\bsin\s*2\s*x\b/gi, "sin 2x").replace(/\b(sin|cos|tan|cot|sec|cosec|log)(?=\d?[a-z]\b)/gi, "$1 ").replace(/\bCOS\b/g, "cos").replace(/\bSIN\b/g, "sin");
  }).join("\n");

  // reads a picture file and returns the question text
  ML.readPhoto = async (file, status) => {
    const img = await toImage(file);
    if (await ML.photoMode()) { status("Reading the photo with AI…"); try { return { text: await readWithAI(img), by: "ai" }; } catch (e) { status("The AI reader failed; using the built-in reader…"); } }
    return { text: await readWithOCR(img, status), by: "ocr" };
  };
})();
