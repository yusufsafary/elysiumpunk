/* ELYSIUM PUNKS - shared site script
   One file for every page. Each feature guards on element existence,
   so pages only run what they contain.
   Progressive enhancement: adding class "anim" to <html> is the very
   first action. Every hidden pre-animation state in the CSS applies
   only under html.anim, so without JS all content is simply visible. */
(function () {
  document.documentElement.classList.add("anim");
  "use strict";

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) { fn(list[i], i); }
  }

  /* ---------- scroll progress hairline ---------- */
  var prog = document.getElementById("scrollProgress");
  if (prog) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      prog.style.transform = "scaleX(" + p + ")";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- hero entrance choreography ---------- */
  var hiEls = document.querySelectorAll(".hi");
  if (hiEls.length) {
    if (reduced) {
      each(hiEls, function (el) { el.classList.add("in"); });
    } else {
      setTimeout(function () {
        requestAnimationFrame(function () {
          each(hiEls, function (el) { el.classList.add("in"); });
        });
      }, 30);
    }
  }

  /* ---------- hero marquee ---------- */
  var track = document.getElementById("marqueeTrack");
  if (track) {
    var faces = ["punk-1-mortal.png", "punk-700-blessed.png", "punk-2-mortal.png", "punk-3-mortal.png",
      "punk-701-blessed.png", "punk-4-mortal.png", "punk-970-saint.png", "punk-5-mortal.png",
      "punk-11-mortal.png", "punk-6-mortal.png", "punk-702-blessed.png", "punk-12-mortal.png",
      "punk-7-mortal.png", "punk-13-mortal.png", "punk-8-mortal.png", "punk-14-mortal.png",
      "punk-15-mortal.png", "punk-16-mortal.png", "punk-17-mortal.png", "punk-18-mortal.png"];
    var frag = document.createDocumentFragment();
    for (var r = 0; r < 2; r++) {
      for (var i = 0; i < faces.length; i++) {
        var im = document.createElement("img");
        im.src = "img/" + faces[i];
        im.alt = "";
        im.loading = "lazy";
        frag.appendChild(im);
      }
    }
    track.appendChild(frag);
  }

  /* ---------- connect wallet placeholder ---------- */
  var connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", function () {
      var b = this;
      b.textContent = "Wallet connect at mint";
      setTimeout(function () { b.textContent = "Connect Wallet"; }, 2200);
    });
  }

  /* ---------- cookie consent ---------- */
  var bar = document.getElementById("cookieBar");
  if (bar) {
    var KEY = "ep_cookie_consent";
    function choice() {
      try { return localStorage.getItem(KEY); } catch (e) { return "set"; }
    }
    function save(v) {
      try { localStorage.setItem(KEY, v + ":" + new Date().toISOString().slice(0, 10)); } catch (e) {}
    }
    window.EPCookies = {
      open: function () { bar.classList.add("show"); },
      reset: function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        bar.classList.add("show");
      }
    };
    var acc = document.getElementById("cookieAccept");
    var dec = document.getElementById("cookieDecline");
    if (acc) {
      acc.addEventListener("click", function () {
        save("accepted");
        bar.classList.remove("show");
      });
    }
    if (dec) {
      dec.addEventListener("click", function () {
        save("declined");
        bar.classList.remove("show");
      });
    }
    if (!choice()) {
      setTimeout(function () { bar.classList.add("show"); }, 700);
    }
    var changeBtn = document.getElementById("cookieChangeBtn");
    if (changeBtn) {
      changeBtn.addEventListener("click", function () { window.EPCookies.reset(); });
    }
  }

  /* ---------- reveal on scroll (shared observer) ---------- */
  function observeVis(els) {
    if (!els.length) { return; }
    if (reduced || !("IntersectionObserver" in window)) {
      each(els, function (el) { el.classList.add("vis"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("vis");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px 20% 0px" });
    each(els, function (el) { io.observe(el); });
  }
  observeVis(document.querySelectorAll(".rv"));
  observeVis(document.querySelectorAll("section.blk h2"));

  /* ---------- stat strip counters ---------- */
  var statsBox = document.querySelector(".stats");
  if (statsBox) {
    var statEls = statsBox.querySelectorAll(".stat");
    var counters = statsBox.querySelectorAll("b[data-count]");
    var counted = false;
    function runStats() {
      if (counted) { return; }
      counted = true;
      each(statEls, function (el) { el.classList.add("vis"); });
      if (reduced) { return; }
      each(counters, function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (!target) { return; }
        var dur = 1200;
        var start = null;
        function frame(ts) {
          if (!start) { start = ts; }
          var t = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased).toLocaleString("en-US");
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            el.textContent = target.toLocaleString("en-US");
          }
        }
        requestAnimationFrame(frame);
      });
    }
    if (reduced || !("IntersectionObserver" in window)) {
      runStats();
    } else {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            runStats();
            sio.disconnect();
          }
        });
      }, { threshold: 0.2 });
      sio.observe(statsBox);
    }
  }

  /* ---------- gallery filter chips ---------- */
  var chips = document.querySelectorAll(".fchip[data-filter]");
  var tiles = document.querySelectorAll(".gallery figure[data-type]");
  if (chips.length && tiles.length) {
    each(chips, function (chip) {
      chip.addEventListener("click", function () {
        each(chips, function (c) { c.classList.toggle("on", c === chip); });
        var f = chip.getAttribute("data-filter");
        each(tiles, function (tile) {
          var show = f === "all" || tile.getAttribute("data-type") === f;
          if (show) {
            tile.style.display = "";
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                tile.classList.remove("tile-out");
              });
            });
          } else {
            tile.classList.add("tile-out");
            setTimeout(function () {
              if (tile.classList.contains("tile-out")) {
                tile.style.display = "none";
              }
            }, 260);
          }
        });
      });
    });
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var TYPES = {
      mortal: {
        name: "Mortal", share: "About 70% of the collection",
        desc: "Showed up exactly as they were. Human skin, no halo, no laurel, no special treatment. Most punks land here."
      },
      blessed: {
        name: "Blessed", share: "About 27% of the collection",
        desc: "Something noticed them on the way in. These are the ones wearing a halo or a laurel."
      },
      saint: {
        name: "Saint", share: "About 3% of the collection",
        desc: "Golden skin and a halo, the full treatment. About 3 in every 100 seeds land here, so if yours does, yeah, it's a big deal."
      }
    };
    var lbImg = document.getElementById("lbImg");
    var lbType = document.getElementById("lbType");
    var lbShare = document.getElementById("lbShare");
    var lbDesc = document.getElementById("lbDesc");
    var lbSeed = document.getElementById("lbSeed");
    var lbClose = document.getElementById("lbClose");
    var lbBackdrop = document.getElementById("lbBackdrop");
    var lastFocus = null;
    var prevOverflow = "";

    function openLb(type, src, seedLabel) {
      var d = TYPES[type];
      if (!d || !lbImg) { return; }
      lbImg.src = src;
      lbImg.alt = d.name + " punk sample face";
      if (lbType) { lbType.textContent = d.name; }
      if (lbShare) { lbShare.textContent = d.share; }
      if (lbDesc) { lbDesc.textContent = d.desc; }
      if (lbSeed) {
        var m = /punk-(\d+)-/.exec(src || "");
        lbSeed.textContent = m ? ("SEED " + m[1] + " · DRAWN BY THE COLLECTION GENERATOR") : (seedLabel || "");
      }
      lastFocus = document.activeElement;
      prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      lb.hidden = false;
      if (lbClose) { lbClose.focus(); }
    }
    function closeLb() {
      lb.hidden = true;
      document.documentElement.style.overflow = prevOverflow;
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
    if (lbClose) { lbClose.addEventListener("click", closeLb); }
    if (lbBackdrop) { lbBackdrop.addEventListener("click", closeLb); }
    var currentFig = null;
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) { return; }
      if (e.key === "Escape" || e.key === "Esc") { closeLb(); return; }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") { return; }
      var vis = [];
      each(tiles, function (t) { if (t.style.display !== "none") { vis.push(t); } });
      if (!vis.length || !currentFig) { return; }
      var idx = vis.indexOf(currentFig);
      var nxt = vis[(idx + (e.key === "ArrowRight" ? 1 : -1) + vis.length) % vis.length];
      if (nxt && nxt._openLb) { nxt._openLb(); }
    });

    each(tiles, function (fig) {
      function open() {
        currentFig = fig;
        var img = fig.querySelector("img");
        openLb(fig.getAttribute("data-type"), img ? img.getAttribute("src") : "", "Sample face");
      }
      fig._openLb = open;
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    each(document.querySelectorAll(".typecard"), function (card) {
      var img = card.querySelector("img");
      var h3 = card.querySelector("h3");
      if (!img || !h3) { return; }
      var type = h3.textContent.replace(/\s+/g, " ").trim().toLowerCase();
      if (!TYPES[type]) { return; }
      img.addEventListener("click", function () {
        openLb(type, img.getAttribute("src"), "");
      });
    });
  }

  /* ---------- FAQ smooth accordion (progressive: native without JS) ---------- */
  var faqItems = document.querySelectorAll(".faq details");
  if (faqItems.length && !reduced) {
    var faqBusy = false;
    function faqFinish(det, panel) {
      panel.style.height = "";
      panel.style.overflow = "";
      panel.style.transition = "";
      faqBusy = false;
    }
    function faqOpen(det, panel) {
      det.open = true;
      var target = panel.scrollHeight;
      panel.style.overflow = "hidden";
      panel.style.height = "0px";
      void panel.offsetHeight;
      panel.style.transition = "height .28s ease";
      panel.style.height = target + "px";
      setTimeout(function () { faqFinish(det, panel); }, 320);
    }
    function faqClose(det, panel, done) {
      panel.style.overflow = "hidden";
      panel.style.height = panel.scrollHeight + "px";
      void panel.offsetHeight;
      panel.style.transition = "height .28s ease";
      panel.style.height = "0px";
      setTimeout(function () {
        det.open = false;
        faqFinish(det, panel);
        if (done) { done(); }
      }, 320);
    }
    each(faqItems, function (det) {
      var summary = det.querySelector("summary");
      var panel = det.querySelector(".a");
      if (!summary || !panel) { return; }
      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (faqBusy) { return; }
        if (det.open) {
          faqBusy = true;
          faqClose(det, panel);
        } else {
          var other = null;
          each(faqItems, function (o) { if (o !== det && o.open) { other = o; } });
          faqBusy = true;
          if (other) {
            faqClose(other, other.querySelector(".a"), function () { faqOpen(det, panel); });
          } else {
            faqOpen(det, panel);
          }
        }
      });
    });
  }

  /* ---------- safety net: nothing stays hidden ---------- */
  setTimeout(function () {
    each(document.querySelectorAll(".hi:not(.in)"), function (el) { el.classList.add("in"); });
    each(document.querySelectorAll(".rv:not(.vis)"), function (el) { el.classList.add("vis"); });
    each(document.querySelectorAll("section.blk h2:not(.vis)"), function (el) { el.classList.add("vis"); });
    each(document.querySelectorAll(".stat:not(.vis)"), function (el) { el.classList.add("vis"); });
  }, 1200);

  /* ---------- back to top ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }
})();
