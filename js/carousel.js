/* ============================================================
   GEM Crispy Confectonaries — Product Carousel
   Lightweight, dependency-free carousel used on the homepage.
   - Responsive: 1 slide/view on mobile, 2 on tablet, 3 on desktop
   - Autoplay, paused on hover/focus/touch, and disabled entirely
     for prefers-reduced-motion
   - Loops in both directions
   - Swipe/drag support for touch and mouse
   - Keyboard accessible (buttons + dots), arrow-key support
   ============================================================ */

(function () {
  "use strict";

  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var viewport = carousel.querySelector("[data-carousel-viewport]");
    var track = carousel.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-carousel-slide]"));
    var prevBtn = carousel.querySelector("[data-carousel-prev]");
    var nextBtn = carousel.querySelector("[data-carousel-next]");
    var dotsWrap = carousel.querySelector("[data-carousel-dots]");

    if (!track || slides.length === 0) return;

    var slidesPerView = 1;
    var currentIndex = 0;
    var autoplayId = null;
    var autoplayDelay = 4500;
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function getSlidesPerView() {
      var width = window.innerWidth;
      if (width >= 980) return 3;
      if (width >= 700) return 2;
      return 1;
    }

    function maxIndex() {
      return Math.max(0, slides.length - slidesPerView);
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      var dotCount = maxIndex() + 1;
      for (var i = 0; i < dotCount; i++) {
        var dot = document.createElement("button");
        dot.className = "carousel-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        (function (index) {
          dot.addEventListener("click", function () {
            goTo(index);
            restartAutoplay();
          });
        })(i);
        dotsWrap.appendChild(dot);
      }
      updateDots();
    }

    function updateDots() {
      if (!dotsWrap) return;
      var dots = dotsWrap.querySelectorAll(".carousel-dot");
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === currentIndex);
      });
    }

    function update(animate) {
      var slideWidth = slides[0].getBoundingClientRect().width;
      var offset = currentIndex * slideWidth;
      track.style.transition = animate === false ? "none" : "";
      track.style.transform = "translateX(-" + offset + "px)";
      updateDots();
    }

    function goTo(index) {
      var max = maxIndex();
      if (index < 0) index = max;
      if (index > max) index = 0;
      currentIndex = index;
      update(true);
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    function startAutoplay() {
      if (prefersReducedMotion || maxIndex() === 0) return;
      stopAutoplay();
      autoplayId = window.setInterval(next, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Controls
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restartAutoplay(); });

    // Pause on hover / keyboard focus
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    // Keyboard arrows when the carousel (or its children) has focus
    carousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { next(); restartAutoplay(); }
      if (event.key === "ArrowLeft") { prev(); restartAutoplay(); }
    });

    // Swipe / drag support (touch + mouse)
    var dragStartX = null;
    var dragDelta = 0;
    var isDragging = false;

    function dragStart(clientX) {
      isDragging = true;
      dragStartX = clientX;
      dragDelta = 0;
      stopAutoplay();
      track.style.transition = "none";
    }

    function dragMove(clientX) {
      if (!isDragging) return;
      dragDelta = clientX - dragStartX;
      var slideWidth = slides[0].getBoundingClientRect().width;
      var offset = currentIndex * slideWidth - dragDelta;
      track.style.transform = "translateX(-" + offset + "px)";
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      var threshold = 50;
      if (dragDelta > threshold) {
        prev();
      } else if (dragDelta < -threshold) {
        next();
      } else {
        update(true);
      }
      startAutoplay();
    }

    if (viewport) {
      viewport.addEventListener("touchstart", function (e) { dragStart(e.touches[0].clientX); }, { passive: true });
      viewport.addEventListener("touchmove", function (e) { dragMove(e.touches[0].clientX); }, { passive: true });
      viewport.addEventListener("touchend", dragEnd);

      viewport.addEventListener("mousedown", function (e) { dragStart(e.clientX); e.preventDefault(); });
      window.addEventListener("mousemove", function (e) { if (isDragging) dragMove(e.clientX); });
      window.addEventListener("mouseup", dragEnd);
    }

    // Recalculate on resize (debounced)
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var newSpv = getSlidesPerView();
        if (newSpv !== slidesPerView) {
          slidesPerView = newSpv;
          currentIndex = Math.min(currentIndex, maxIndex());
          buildDots();
        }
        update(false);
      }, 150);
    });

    // Init
    slidesPerView = getSlidesPerView();
    buildDots();
    update(false);
    startAutoplay();
  });
})();