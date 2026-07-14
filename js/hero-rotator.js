/* ============================================================
   GEM Crispy Confectonaries — Hero Product Rotator
   Auto-switches the hero image + "Must Try" badge through all
   featured products every few seconds, with a soft crossfade.
   Pauses on hover/focus and respects prefers-reduced-motion.
   ============================================================ */

(function () {
  "use strict";

  var wrap = document.querySelector("[data-hero-rotator]");
  if (!wrap) return;

  var imgEl = wrap.querySelector("[data-hero-image]");
  var eyebrowEl = wrap.querySelector("[data-hero-badge-eyebrow]");
  var titleEl = wrap.querySelector("[data-hero-badge-title]");
  var dotsWrap = wrap.querySelector("[data-hero-dots]");

  if (!imgEl) return;

  var slides = [
    {
      src: "assets/products/plantain-chips-snack-pack-1.jpg",
      alt: "Two packs of GEM plantain chips, one open and overflowing with crispy golden plantain slices",
      eyebrow: "Must Try",
      title: "Original Plantain Chips",
    },
    {
      src: "assets/products/plantain-chips-family-jar-1.jpg",
      alt: "Two jars of GEM plantain chips, one open and overflowing with crispy golden plantain slices",
      eyebrow: "Family Size",
      title: "Plantain Chips Family Jar",
    },
    {
      src: "assets/products/kuli-kuli.jpg",
      alt: "GEM Kuli Kuli, a traditional Nigerian roasted groundnut snack",
      eyebrow: "Fan Favourite",
      title: "Kuli Kuli",
    },
    {
      src: "assets/products/peanut-burger-bag.jpg",
      alt: "GEM Peanut Burger, sugar-coated peanuts spilling from an open pack",
      eyebrow: "Nigerian Classic",
      title: "Peanut Burger",
    },
    {
      src: "assets/machines/continuous-band-sealer.jpg",
      alt: "Continuous band sealer with conveyor belt and control panel",
      eyebrow: "Production Equipment",
      title: "Continuous Band Sealer",
    },
    {
      src: "assets/machines/date-coding-machine.jpg",
      alt: "Manual date coding machine with temperature dial and print ribbon",
      eyebrow: "Production Equipment",
      title: "Date Coding Machine",
    },
    {
      src: "assets/machines/vegetable-slicer.jpg",
      alt: "Electric/manual vegetable slicer shown in two sizes",
      eyebrow: "Production Equipment",
      title: "Vegetable Slicer",
    },
    {
      src: "assets/machines/industrial-deep-fryer.jpg",
      alt: "Industrial twin-tank deep fryer with perforated baskets",
      eyebrow: "Production Equipment",
      title: "Industrial Deep Fryer",
    },
    {
      src: "assets/machines/peanut-coating-machine.jpg",
      alt: "Peanut coating machine with a rotating stainless steel drum",
      eyebrow: "Production Equipment",
      title: "Peanut Coating Machine",
    },
  ];

  var currentIndex = 0;
  var delay = 4000;
  var fadeDuration = 350;
  var timerId = null;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "Show " + slide.title);
      dot.addEventListener("click", function () {
        showSlide(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    });
    updateDots();
  }

  function updateDots() {
    if (!dotsWrap) return;
    var dots = dotsWrap.querySelectorAll(".carousel-dot");
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === currentIndex);
    });
  }

  function showSlide(index) {
    currentIndex = index;
    var slide = slides[currentIndex];

    imgEl.style.opacity = 0;
    if (titleEl) titleEl.style.opacity = 0;

    window.setTimeout(function () {
      imgEl.src = slide.src;
      imgEl.alt = slide.alt;
      if (eyebrowEl) eyebrowEl.textContent = slide.eyebrow;
      if (titleEl) titleEl.textContent = slide.title;
      imgEl.style.opacity = 1;
      if (titleEl) titleEl.style.opacity = 1;
      updateDots();
    }, fadeDuration);
  }

  function next() {
    showSlide((currentIndex + 1) % slides.length);
  }

  function start() {
    if (prefersReducedMotion || slides.length < 2) return;
    stop();
    timerId = window.setInterval(next, delay);
  }

  function stop() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function restart() {
    stop();
    start();
  }

  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);
  wrap.addEventListener("focusin", stop);
  wrap.addEventListener("focusout", start);

  buildDots();
  start();
})();