/* Home page: gallery rendering, filters, sorting and the artwork lightbox. */
(function () {
  "use strict";

  var ART = window.HFB_ARTWORKS || [];
  var H = window.HFB;
  var icon = H.icon;

  var CATS = [
    { id: "all", label: "All works" },
    { id: "paint", label: "Acrylic & Gouache" },
    { id: "water", label: "Watercolor & Ink" },
    { id: "mixed", label: "Mixed Media" },
    { id: "drawing", label: "Pastel & Drawing" }
  ];
  var catLabel = {};
  CATS.forEach(function (c) { catLabel[c.id] = c.label; });

  var state = { cat: "all", sort: "featured" };
  var visible = ART.slice();

  var grid = document.getElementById("gallery");
  var chips = document.getElementById("chips");
  var sortSel = document.getElementById("sort");
  var resultCount = document.getElementById("result-count");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Filters ---------- */
  function renderChips() {
    chips.innerHTML = CATS.map(function (c) {
      var n = c.id === "all" ? ART.length : ART.filter(function (a) { return a.category === c.id; }).length;
      return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + (state.cat === c.id) + '">' +
        (c.id === "all" ? "" : '<span class="dot" aria-hidden="true"></span>') +
        esc(c.label) + ' <span class="n">' + n + "</span></button>";
    }).join("");
  }

  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.cat = b.getAttribute("data-cat");
    chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b); });
    render();
  });

  sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });

  /* ---------- Cards ---------- */
  function addBtn(a, cls) {
    var on = H.list.has(a.slug);
    return '<button type="button" class="add-btn ' + (cls || "") + '" data-add="' + a.slug + '" aria-pressed="' + on + '">' +
      icon("plus", "i-plus") + icon("check", "i-check") +
      '<span>' + (on ? "On your list" : "Add to inquiry list") + "</span></button>";
  }

  function card(a, i) {
    return '<article class="card" data-cat="' + a.category + '" style="animation-delay:' + Math.min(i * 40, 600) + 'ms">' +
      '<button type="button" class="card-media" data-open="' + a.slug + '" aria-label="View ' + esc(a.title) + '">' +
      '<img src="' + a.thumb + '" width="' + a.w + '" height="' + a.h + '" alt="' + esc(a.title) + (a.subtitle ? ' (' + esc(a.subtitle.toLowerCase()) + ')' : '') + ', ' + esc(a.medium.toLowerCase()) + '" loading="' + (i < 6 ? "eager" : "lazy") + '" decoding="async">' +
      '<span class="card-no">No. ' + String(a.no).padStart(2, "0") + "</span></button>" +
      '<div class="card-body">' +
      '<span class="tag"><span class="dot" aria-hidden="true"></span>' + esc(catLabel[a.category]) + "</span>" +
      '<div class="card-top"><h3><button type="button" data-open="' + a.slug + '">' + esc(a.title) + "</button></h3>" +
      '<span class="price">' + H.money(a.price) + "</span></div>" +
      (a.subtitle ? '<p class="subtitle">' + esc(a.subtitle) + "</p>" : "") +
      '<p class="card-meta">' + esc(a.medium) + "<br>" + esc(a.sizeCm) + " (" + esc(a.sizeIn) + ")" + (a.signed ? " · Signed " + esc(a.signed) : "") + "</p>" +
      '<div class="card-actions">' + addBtn(a) + "</div></div></article>";
  }

  function sorted(list) {
    var l = list.slice();
    if (state.sort === "price-asc") l.sort(function (a, b) { return a.price - b.price || a.no - b.no; });
    else if (state.sort === "price-desc") l.sort(function (a, b) { return b.price - a.price || a.no - b.no; });
    else if (state.sort === "title") l.sort(function (a, b) { return a.title.localeCompare(b.title); });
    return l;
  }

  var GAP = 24, MIN_COL = 300;
  var colCount = 0;

  function columnsFor(width) {
    return Math.max(1, Math.min(3, Math.floor((width + GAP) / (MIN_COL + GAP))));
  }

  // Masonry that keeps reading order: each card goes into the currently shortest column,
  // using the known image aspect ratio to estimate heights before images load.
  function render() {
    visible = sorted(ART.filter(function (a) { return state.cat === "all" || a.category === state.cat; }));
    resultCount.textContent = visible.length + (visible.length === 1 ? " work" : " works");
    if (!visible.length) {
      grid.innerHTML = '<p class="empty">No works in this category yet.</p>';
      return;
    }
    colCount = columnsFor(grid.clientWidth || window.innerWidth);
    var cols = [], heights = [];
    for (var c = 0; c < colCount; c++) { cols.push([]); heights.push(0); }
    visible.forEach(function (a, i) {
      var target = heights.indexOf(Math.min.apply(null, heights));
      cols[target].push(card(a, i));
      heights[target] += a.h / a.w + 0.55; // image ratio + approx. card body
    });
    grid.innerHTML = cols.map(function (col) { return '<div class="gallery-col">' + col.join("") + "</div>"; }).join("");
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (columnsFor(grid.clientWidth) !== colCount) render();
    }, 150);
  });

  function syncButtons() {
    document.querySelectorAll("[data-add]").forEach(function (b) {
      var on = H.list.has(b.getAttribute("data-add"));
      b.setAttribute("aria-pressed", on);
      var label = b.querySelector("span");
      if (label) label.textContent = on ? "On your list" : "Add to inquiry list";
    });
  }
  document.addEventListener("hfb:list", syncButtons);

  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) {
      var slug = add.getAttribute("data-add");
      var added = H.list.toggle(slug);
      var a = H.byslug[slug];
      H.toast(added
        ? "“" + esc(a.title) + "” added. <a href=\"contact.html\">Text to buy →</a>"
        : "Removed “" + esc(a.title) + "” from your list.");
      return;
    }
    var open = e.target.closest("[data-open]");
    if (open) { openLightbox(open.getAttribute("data-open"), open); }
  });

  /* ---------- Lightbox ---------- */
  var dlg = document.getElementById("lightbox");
  var lbImg = dlg.querySelector(".lb-media img");
  var lbInfo = dlg.querySelector(".lb-info");
  var lbCounter = dlg.querySelector(".lb-counter");
  var lbFull = dlg.querySelector(".lb-full");
  var current = null;
  var returnFocus = null;

  function sequence() {
    // Navigate within the currently filtered view when the piece is in it, otherwise the full catalog.
    return visible.some(function (a) { return a.slug === current; }) ? visible : ART;
  }

  function fill(slug) {
    var a = H.byslug[slug];
    if (!a) return;
    current = slug;
    var seq = sequence();
    var idx = seq.findIndex(function (x) { return x.slug === slug; });

    lbImg.src = a.thumb; // show the cached thumbnail instantly, then swap in the large file
    lbImg.alt = a.title + (a.subtitle ? " (" + a.subtitle.toLowerCase() + ")" : "") + ", " + a.medium.toLowerCase();
    lbImg.width = a.fw; lbImg.height = a.fh;
    var big = new Image();
    big.onload = function () { if (current === slug) lbImg.src = a.full; };
    big.src = a.full;
    lbFull.href = a.full;

    lbCounter.textContent = (idx + 1) + " / " + seq.length;

    var msg = H.buildMessage([slug]);
    lbInfo.innerHTML =
      '<div data-cat="' + a.category + '"><span class="tag"><span class="dot" aria-hidden="true"></span>No. ' + String(a.no).padStart(2, "0") + " · " + esc(catLabel[a.category]) + "</span></div>" +
      '<h2 id="lb-title">' + esc(a.title) + "</h2>" +
      (a.subtitle ? '<p class="subtitle subtitle-lg">' + esc(a.subtitle) + "</p>" : "") +
      '<div class="lb-price">' + H.money(a.price) + "<small>Original · one of a kind</small></div>" +
      '<div class="lb-actions">' +
      '<a class="btn btn-red" href="' + H.smsHref(msg) + '">' + icon("message") + "Text to buy</a>" +
      addBtn(a) +
      "</div>" +
      '<p class="lb-desc">' + esc(a.description) + "</p>" +
      '<dl class="specs">' +
      "<dt>" + icon("brush") + "Medium</dt><dd>" + esc(a.medium) + "</dd>" +
      "<dt>" + icon("ruler") + "Size</dt><dd>" + esc(a.sizeCm) + " <span style=\"color:var(--muted)\">(" + esc(a.sizeIn) + ")</span></dd>" +
      (a.signed ? "<dt>" + icon("pen") + "Signed</dt><dd>Signed &amp; dated " + esc(a.signed) + "</dd>" : "") +
      "<dt>" + icon("frame") + "Framing</dt><dd>Sold unframed — ready for a mat and frame of your choice</dd>" +
      "</dl>";

    if (history.replaceState) history.replaceState(null, "", "#art=" + slug);
    document.title = a.title + " — Artwork by HFB";
  }

  function openLightbox(slug, trigger) {
    returnFocus = trigger || document.activeElement;
    fill(slug);
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    }
    dlg.querySelector(".lb-close").focus();
  }

  function step(dir) {
    var seq = sequence();
    var idx = seq.findIndex(function (x) { return x.slug === current; });
    var next = seq[(idx + dir + seq.length) % seq.length];
    fill(next.slug);
  }

  dlg.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
  dlg.querySelector(".lb-next").addEventListener("click", function () { step(1); });
  dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });
  dlg.addEventListener("close", function () {
    current = null;
    document.title = "Artwork by HFB — Original Paintings & Drawings";
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  });

  // Simple swipe navigation on touch screens.
  var touchX = null;
  dlg.querySelector(".lb-media").addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  dlg.querySelector(".lb-media").addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ---------- Init ---------- */
  renderChips();
  render();

  function openFromHash() {
    var m = location.hash.match(/^#art=([\w-]+)/);
    if (m && H.byslug[m[1]] && m[1] !== current) openLightbox(m[1]);
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
})();
