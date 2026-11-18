/* Homepage motion: paper wall loop + parallax, scroll reveal, nav state. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var q = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  document.documentElement.classList.add("js-motion");

  /* paper wall: fill each row past two screen widths, then double it for a seamless loop */
  var wall = document.querySelector(".paper-wall");
  if (wall) {
    var tiles = q(".wall-pool .wall-tile", wall);
    var rows = q(".wall-row", wall);
    if (tiles.length) {
      rows.forEach(function (row, r) {
        var track = row.querySelector(".wall-track");
        var need = Math.ceil((window.innerWidth * 1.4) / 226) + 1;
        var n = Math.max(need, tiles.length);
        for (var i = 0; i < n; i++) track.appendChild(tiles[(i + r * 3) % tiles.length].cloneNode(true));
        q(".wall-tile", track).forEach(function (t) { track.appendChild(t.cloneNode(true)); });
        track.style.setProperty("--dur", (n * 7 + r * 18) + "s");
      });
    }
    var pool = wall.querySelector(".wall-pool");
    if (pool) pool.remove();

    var hero = wall.parentNode;
    var sync = function (visible) { wall.classList.toggle("is-paused", document.hidden || visible === false); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { sync(es[0].isIntersecting); }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { sync(); });

    var inner = wall.querySelector(".wall-rows");
    if (!reduce && window.matchMedia("(pointer: fine)").matches) {
      var x = 0, y = 0, raf = 0;
      hero.addEventListener("pointermove", function (e) {
        x = e.clientX / window.innerWidth - 0.5;
        y = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          inner.style.translate = (x * -28).toFixed(1) + "px " + (y * -18).toFixed(1) + "px";
        });
      });
      hero.addEventListener("pointerleave", function () { inner.style.translate = "0 0"; });
    }
  }

  /* scroll reveal, staggered inside lists */
  q(".about-section, .section-heading, .research-strip").forEach(function (el) { el.classList.add("reveal"); });
  q(".publication-list").forEach(function (list) {
    q(".publication-card", list).forEach(function (c, i) {
      c.classList.add("reveal");
      c.style.setProperty("--d", Math.min(i % 4, 3) * 0.07 + "s");
    });
  });
  var items = q(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* top bar: shadow once scrolled, highlight the section in view */
  var bar = document.querySelector(".topbar");
  var links = q(".nav-links a");
  var onScroll = function () {
    if (bar) bar.classList.toggle("is-scrolled", window.scrollY > 8);
    // anything already scrolled past (e.g. after a nav jump) is shown too
    items.forEach(function (el) {
      if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
    });
    var cur = null;
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s && s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = a;
    });
    links.forEach(function (a) { a.classList.toggle("is-current", a === cur); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  /* scroll progress */
  var prog = document.createElement("div");
  prog.className = "scroll-progress"; prog.setAttribute("aria-hidden", "true");
  document.body.appendChild(prog);
  var setProg = function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.setProperty("--p", h > 0 ? (window.scrollY / h).toFixed(4) : 0);
  };
  window.addEventListener("scroll", setProg, { passive: true }); setProg();

  /* typed phrase in the lede (full sentence kept for screen readers) */
  var lede = document.querySelector(".hero-lede");
  if (lede && !reduce) {
    var phrases = ["learn from interaction.", "reason across modalities.", "evolve on their own.", "improve through experience."];
    lede.setAttribute("aria-label", lede.textContent.trim());
    lede.innerHTML = 'I build AI agents that<br><span class="typed" aria-hidden="true"></span><span class="typed-caret" aria-hidden="true"></span>';
    var out = lede.querySelector(".typed"), pi = 0, ci = 0, del = false;
    (function type() {
      var w = phrases[pi];
      ci += del ? -1 : 1;
      out.textContent = w.slice(0, ci);
      var wait = del ? 28 : 55 + Math.random() * 40;
      if (!del && ci === w.length) { del = true; wait = 2200; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
      setTimeout(type, wait);
    })();
  }

  /* card spotlight + thumbnail tilt */
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    q(".publication-card").forEach(function (c) {
      var m = c.querySelector(".paper-media");
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
        if (m) {
          var mr = m.getBoundingClientRect();
          var x = Math.max(-1, Math.min(1, (e.clientX - mr.left) / mr.width * 2 - 1));
          var y = Math.max(-1, Math.min(1, (e.clientY - mr.top) / mr.height * 2 - 1));
          m.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
          m.style.setProperty("--rx", (y * -6).toFixed(2) + "deg");
        }
      });
      c.addEventListener("pointerleave", function () {
        if (m) { m.style.setProperty("--rx", "0deg"); m.style.setProperty("--ry", "0deg"); }
      });
    });
  }
})();
