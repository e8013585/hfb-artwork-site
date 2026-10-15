/* Contact page: inquiry list, prefilled text message, copy helpers. */
(function () {
  "use strict";

  var H = window.HFB;
  var icon = H.icon;
  var listEl = document.getElementById("inq");
  var msg = document.getElementById("msg");
  var smsSend = document.getElementById("sms-send");
  var smsMain = document.getElementById("sms-main");
  var edited = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderList() {
    var list = H.list.read();
    if (!list.length) {
      listEl.innerHTML = '<div class="inq-empty">' +
        '<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="assets/img/icons.svg#i-empty"></use></svg>' +
        "<p><strong>Your list is empty.</strong><br>Browse the gallery and tap “Add to inquiry list” on the pieces you love — or just text the titles directly.</p>" +
        '<a class="btn btn-sm" href="./#gallery-section">Browse the gallery ' + icon("arrow") + "</a></div>";
    } else {
      var total = 0;
      listEl.innerHTML = '<ul class="inq-list">' + list.map(function (slug) {
        var a = H.byslug[slug];
        total += a.price;
        return '<li class="inq-item">' +
          '<a href="./#art=' + a.slug + '"><img src="' + a.thumb + '" alt="" loading="lazy"></a>' +
          "<div><h3>" + esc(a.title) + "</h3><p>No. " + String(a.no).padStart(2, "0") + " · " + esc(a.size) + " · " + H.money(a.price) + "</p></div>" +
          '<button type="button" class="remove-btn" data-remove="' + a.slug + '" aria-label="Remove ' + esc(a.title) + ' from list">' + icon("trash") + "</button>" +
          "</li>";
      }).join("") + "</ul>" +
        '<div class="inq-total"><span>' + list.length + (list.length === 1 ? " artwork" : " artworks") + " · listed total</span><strong>" + H.money(total) + "</strong></div>";
    }
    if (!edited) msg.value = H.buildMessage(list);
    syncLinks();
  }

  function syncLinks() {
    var href = H.smsHref(msg.value.trim());
    smsSend.href = href;
    smsMain.href = href;
  }

  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-remove]");
    if (!b) return;
    var a = H.byslug[b.getAttribute("data-remove")];
    H.list.remove(a.slug);
    H.toast("Removed “" + esc(a.title) + "” from your list.");
  });

  msg.addEventListener("input", function () { edited = true; syncLinks(); });

  document.addEventListener("hfb:list", function () {
    edited = false; // the list changed, so regenerate the suggested message
    renderList();
  });

  document.getElementById("copy-number").addEventListener("click", function () {
    H.copyText(H.PHONE_DISPLAY).then(
      function () { H.toast("Number copied: " + H.PHONE_DISPLAY); },
      function () { H.toast("Couldn’t copy — the number is " + H.PHONE_DISPLAY); }
    );
  });
  document.getElementById("copy-msg").addEventListener("click", function () {
    H.copyText(msg.value).then(
      function () { H.toast("Message copied — paste it into a text to " + H.PHONE_DISPLAY); },
      function () { H.toast("Couldn’t copy — please select the text manually."); }
    );
  });

  renderList();
})();
