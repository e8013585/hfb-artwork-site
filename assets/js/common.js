/* Shared behaviour: theme, header, inquiry list storage, toast. */
(function () {
  "use strict";

  var PHONE = "+19255189256";
  var PHONE_DISPLAY = "+1 (925) 518-9256";
  var LIST_KEY = "hfb-inquiry-list";
  var THEME_KEY = "hfb-theme";
  var memoryList = [];

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Icons ---------- */
  function icon(name, extra) {
    return '<svg class="icon ' + (extra || "") + '" aria-hidden="true"><use href="assets/img/icons.svg#i-' + name + '"></use></svg>';
  }

  /* ---------- Theme ---------- */
  var savedTheme = safeGet(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  /* ---------- Inquiry list ---------- */
  var byslug = {};
  (window.HFB_ARTWORKS || []).forEach(function (a) { byslug[a.slug] = a; });

  function readList() {
    var raw = safeGet(LIST_KEY);
    var list = memoryList;
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    return Array.isArray(list) ? list.filter(function (s) { return byslug[s]; }) : [];
  }
  function writeList(list) {
    memoryList = list.slice();
    safeSet(LIST_KEY, JSON.stringify(list));
    updateCount(true);
    document.dispatchEvent(new CustomEvent("hfb:list", { detail: list }));
  }
  function has(slug) { return readList().indexOf(slug) !== -1; }
  function toggle(slug) {
    var list = readList();
    var i = list.indexOf(slug);
    if (i === -1) list.push(slug); else list.splice(i, 1);
    writeList(list);
    return i === -1;
  }
  function remove(slug) {
    writeList(readList().filter(function (s) { return s !== slug; }));
  }
  function clear() { writeList([]); }

  function updateCount(bump) {
    var n = readList().length;
    document.querySelectorAll("[data-list-count]").forEach(function (el) {
      el.textContent = n;
      el.setAttribute("data-count", n);
    });
    if (bump) {
      document.querySelectorAll(".list-btn").forEach(function (b) {
        b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
      });
    }
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function smsHref(body) {
    // "?&body=" is understood by both iOS and Android messaging apps.
    return "sms:" + PHONE + (body ? "?&body=" + encodeURIComponent(body) : "");
  }

  function buildMessage(list) {
    if (!list.length) {
      return "Hi! I found your work on Artwork by HFB and I'm interested in buying a piece. Could you tell me more?";
    }
    var lines = list.map(function (s) {
      var a = byslug[s];
      return "• #" + a.no + " “" + a.title + "” (" + money(a.price) + ")";
    });
    var total = list.reduce(function (sum, s) { return sum + byslug[s].price; }, 0);
    return "Hi! I'd like to buy " + (list.length === 1 ? "this artwork" : "these artworks") +
      " from Artwork by HFB:\n" + lines.join("\n") +
      (list.length > 1 ? "\nListed total: " + money(total) : "") +
      "\n\nIs " + (list.length === 1 ? "it" : "everything") + " still available?";
  }

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  function toast(html) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = html;
    requestAnimationFrame(function () { toastEl.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        safeSet(THEME_KEY, next);
      });
    });

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    updateCount(false);
  });

  // Keep the badge in sync when the list changes in another tab.
  window.addEventListener("storage", function (e) {
    if (e.key === LIST_KEY) {
      updateCount(false);
      document.dispatchEvent(new CustomEvent("hfb:list", { detail: readList() }));
    }
  });

  window.HFB = {
    PHONE: PHONE, PHONE_DISPLAY: PHONE_DISPLAY,
    icon: icon, byslug: byslug, money: money, smsHref: smsHref, buildMessage: buildMessage,
    list: { read: readList, has: has, toggle: toggle, remove: remove, clear: clear },
    toast: toast, copyText: copyText
  };
})();
