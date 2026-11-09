/* ELYSIUM PUNKS - shared site script
   One file for every page. Each feature guards on element existence,
   so pages only run what they contain. */
(function () {
  "use strict";

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------- reveal on scroll ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      for (var k = 0; k < rvEls.length; k++) { rvEls[k].classList.add("vis"); }
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("vis");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px 20% 0px" });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- back to top ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }
})();
